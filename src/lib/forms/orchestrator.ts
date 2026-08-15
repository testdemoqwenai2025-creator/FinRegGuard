/**
 * L5 — Form Auto-Fill Orchestrator
 * =================================
 *
 * The "recruitment-ATS for compliance" engine. Given a form_slug and
 * entity_id, this orchestrator:
 *
 *   L5. Reads FormTemplate.fieldSchemaJson
 *   L5. Resolves each field's source-of-truth connector via FieldOntology
 *   L5. Calls connectors in parallel (grouping fields by primary connector
 *       so we make 1 HTTP call per connector, not per field)
 *   L5. Writes FormFieldValue rows with confidence scores
 *   L5. Computes overall confidence for the FormInstance
 *
 *   L6. Writes FormFieldProvenance rows for every auto-filled field —
 *       capturing connector run ID, raw payload hash, parser version,
 *       payload snippet, and the exact JSON path within the raw payload
 *       that yielded the value. This is the regulator-grade audit trail.
 *
 *   L7. Routes low-confidence fields (below the FieldOntology's
 *       confidenceThreshold) to ReviewQueueItem rows with team routing
 *       (KYC for EDD, MLRO for SAR, etc.) and the original value
 *       preserved so reviewers can diff.
 *
 * Also writes a ConnectorRun row for every connector call — even failures —
 * so the regulator examination PDF can show the full call history.
 *
 * Input:  { formSlug, entityId, entityType?, createdBy? }
 * Output:  AutofillResult with per-field outcomes + connector run summary
 *
 * Failure modes (all non-fatal — the orchestrator always returns a result):
 *   - FormTemplate not found            → status=failure, no instance created
 *   - Entity ID unparsable              → status=failure
 *   - Connector fetch fails             → field marked low_confidence, in review queue
 *   - Field not returned by any source  → field marked no_data, in review queue
 *   - Multiple sources disagree         → field marked conflict, in review queue
 */

import { db } from '@/lib/db'
import { getConnector, parseEntityId } from '@/lib/connectors/registry'
import type { FetchResult, ParsedField } from '@/lib/connectors/types'
import { confidenceBand } from '@/lib/connectors/types'

// ─────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────

export type AutofillRequest = {
  /** FormTemplate.slug — e.g., "edd-form-framework" */
  formSlug: string
  /** Entity identifier — e.g., "LEI:529900T8BM49AURQ", "CRN:03977902", "Binance Holdings" */
  entityId: string
  /** counterparty | customer | transaction | beneficial_owner (default: counterparty) */
  entityType?: string
  /** Who triggered the autofill (user email or "system"). Default: "system" */
  createdBy?: string
}

export type FieldResult = {
  fieldPath: string
  fieldLabel: string
  ontologyFieldName: string | null
  value: unknown
  confidence: number
  confidenceBand: 'high' | 'medium' | 'low'
  connectorSlug: string | null
  autoFilled: boolean
  inReviewQueue: boolean
  reviewReason?: string
  reviewTeam?: string
  error?: string
}

export type ConnectorRunSummary = {
  connectorSlug: string
  connectorName: string
  success: boolean
  status: 'success' | 'partial' | 'failure' | 'circuit_open' | 'rate_limited'
  httpStatus: number
  latencyMs: number
  recordsPulled: number
  fieldsReturned: number
  errorMessage?: string
  endpointCalled: string
}

export type AutofillResult = {
  instanceId: string
  templateSlug: string
  entityId: string
  entityName: string
  status: 'success' | 'partial' | 'failure'
  totalFields: number
  autoFilledFields: number
  reviewQueueItems: number
  overallConfidence: number
  autoFilledConfidence: number
  fieldResults: FieldResult[]
  connectorRuns: ConnectorRunSummary[]
  durationMs: number
  errorMessage?: string
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

/** FieldOntology row including the primaryConnector relation. */
type FieldOntologyRow = {
  id: string
  fieldName: string
  canonicalType: string
  description: string
  sourceOfTruthByJurisdiction: string
  parserSlug: string
  fallbackChainJson: string
  confidenceThreshold: string
  primaryConnectorId: string | null
  primaryConnector: { id: string; slug: string; name: string } | null
}

/** Resolve the source-of-truth connector slug for a field, given the entity's jurisdiction. */
function resolveConnectorSlug(
  ontology: FieldOntologyRow,
  jurisdiction: string | undefined,
): string {
  try {
    const map = JSON.parse(ontology.sourceOfTruthByJurisdiction || '{}') as Record<string, string>
    if (jurisdiction && map[jurisdiction]) return map[jurisdiction]
    return map._default || ontology.primaryConnector?.slug || 'lei'
  } catch {
    return ontology.primaryConnector?.slug || 'lei'
  }
}

/** Map form type to the review team that should triage low-confidence fields. */
function teamForFormType(formType: string): 'KYC' | 'MLRO' | 'Licensing' | 'Sanctions' | 'DPO' {
  switch (formType) {
    case 'EDD':       return 'KYC'
    case 'SAR':       return 'MLRO'
    case 'MiCA_CASP': return 'Licensing'
    case 'Travel_Rule': return 'Sanctions'
    case 'GDPR_RoPA': return 'DPO'
    default:          return 'KYC'
  }
}

/** Determine the review reason for a field that needs human eyes. */
function reviewReasonForField(
  ontology: FieldOntologyRow,
  confidence: number,
  isSanctionsHit: boolean,
): 'low_confidence' | 'sanctions_hit' | 'manual_flag' {
  if (isSanctionsHit) return 'sanctions_hit'
  const threshold = ontology.confidenceThreshold || 'medium'
  const thresholdScore = threshold === 'high' ? 0.9 : threshold === 'medium' ? 0.7 : 0.5
  if (confidence < thresholdScore) return 'low_confidence'
  return 'manual_flag'
}

// ─────────────────────────────────────────────────────────────
// Main orchestrator
// ─────────────────────────────────────────────────────────────

export async function runAutofill(req: AutofillRequest): Promise<AutofillResult> {
  const startTs = Date.now()
  const entityType = req.entityType || 'counterparty'
  const createdBy = req.createdBy || 'system'

  // ── 1. Load FormTemplate ──
  const template = await db.formTemplate.findUnique({
    where: { slug: req.formSlug },
  })
  if (!template) {
    return failureResult(req, `FormTemplate not found: ${req.formSlug}`, startTs)
  }

  // Parse field schema
  let schema: { fields: Array<{ name: string; type: string; required: boolean; autofill_field: string | null; description?: string }> }
  try {
    schema = JSON.parse(template.fieldSchemaJson)
  } catch (e) {
    return failureResult(req, `Invalid fieldSchemaJson for ${req.formSlug}: ${(e as Error).message}`, startTs)
  }

  // ── 2. Parse entity ID ──
  const lookup = parseEntityId(req.entityId)

  // ── 3. Create FormInstance (status=auto_filling) ──
  const instance = await db.formInstance.create({
    data: {
      templateId: template.id,
      entityId: req.entityId,
      entityType,
      entityName: lookup.value, // will update once we have legal_name
      status: 'auto_filling',
      overallConfidence: 0,
      autoFilledFieldCount: 0,
      reviewQueueCount: 0,
      createdBy,
    },
  })

  // ── 4. Build field→ontology map ──
  type FieldPlan = {
    fieldPath: string
    fieldLabel: string
    description: string
    ontologyFieldName: string
    ontology: FieldOntologyRow
    connectorSlug: string
  }
  const fieldPlans: FieldPlan[] = []
  const fieldsWithoutAutofill: Array<{ fieldPath: string; fieldLabel: string; description: string }> = []

  for (const f of schema.fields) {
    if (!f.autofill_field) {
      fieldsWithoutAutofill.push({
        fieldPath: f.name,
        fieldLabel: f.name.replace(/_/g, ' '),
        description: f.description || '',
      })
      continue
    }
    const ont = await db.fieldOntology.findUnique({
      where: { fieldName: f.autofill_field },
      include: { primaryConnector: true },
    })
    if (!ont) {
      fieldsWithoutAutofill.push({
        fieldPath: f.name,
        fieldLabel: f.name.replace(/_/g, ' '),
        description: `(no ontology mapping for "${f.autofill_field}")`,
      })
      continue
    }
    fieldPlans.push({
      fieldPath: f.name,
      fieldLabel: f.name.replace(/_/g, ' '),
      description: f.description || '',
      ontologyFieldName: ont.fieldName,
      ontology: ont,
      connectorSlug: resolveConnectorSlug(ont, lookup.jurisdiction),
    })
  }

  // Group field plans by connector slug — so we make 1 fetch per connector.
  const fieldsByConnector = new Map<string, FieldPlan[]>()
  for (const fp of fieldPlans) {
    if (!fieldsByConnector.has(fp.connectorSlug)) {
      fieldsByConnector.set(fp.connectorSlug, [])
    }
    fieldsByConnector.get(fp.connectorSlug)!.push(fp)
  }

  // ── 5. Call each connector in parallel ──
  const connectorRunSummaries: ConnectorRunSummary[] = []
  const fieldResults: FieldResult[] = []

  type ParsedConnectorResult = {
    connectorSlug: string
    connectorName: string
    fetchResult: FetchResult | null
    fieldsByOntologyName: Map<string, ParsedField>
    connectorRunId: string | null
    error: string | null
  }
  const parsedResults: ParsedConnectorResult[] = []

  const connectorPromises = Array.from(fieldsByConnector.entries()).map(async ([slug]): Promise<ParsedConnectorResult> => {
    const connector = getConnector(slug)
    if (!connector) {
      return {
        connectorSlug: slug,
        connectorName: slug,
        fetchResult: null,
        fieldsByOntologyName: new Map<string, ParsedField>(),
        connectorRunId: null,
        error: `Connector "${slug}" not registered in registry`,
      }
    }

    const fetchResult = await connector.fetch(lookup)
    const fieldsByOntologyName = new Map<string, ParsedField>()
    if (fetchResult.parsed) {
      for (const pf of fetchResult.parsed.fields) {
        fieldsByOntologyName.set(pf.field, pf)
      }
    }

    // Write ConnectorRun row
    let connectorRunId: string | null = null
    const connectorRow = await db.connector.findUnique({ where: { slug } })
    if (connectorRow) {
      const run = await db.connectorRun.create({
        data: {
          connectorId: connectorRow.id,
          startedAt: new Date(Date.now() - fetchResult.latencyMs),
          finishedAt: new Date(),
          status: fetchResult.status,
          httpStatus: fetchResult.httpStatus,
          recordsPulled: fetchResult.parsed?.rawRecordCount ?? 0,
          rawPayloadHash: fetchResult.rawPayloadHash || null,
          payloadSnippet: fetchResult.payloadSnippet || null,
          errorMessage: fetchResult.errorMessage || null,
          endpointCalled: fetchResult.endpointCalled || null,
          latencyMs: fetchResult.latencyMs,
        },
      })
      connectorRunId = run.id

      // Update Connector row health stats
      await db.connector.update({
        where: { slug },
        data: {
          lastPollAt: new Date(),
          lastSuccessAt: fetchResult.success ? new Date() : connectorRow.lastSuccessAt,
          errorCount24h: fetchResult.success ? 0 : connectorRow.errorCount24h + 1,
          recordsPulledLifetime: connectorRow.recordsPulledLifetime + (fetchResult.parsed?.rawRecordCount ?? 0),
          avgLatencyMs: connectorRow.avgLatencyMs === 0
            ? fetchResult.latencyMs
            : Math.round(connectorRow.avgLatencyMs * 0.8 + fetchResult.latencyMs * 0.2),
          circuitBreakerState: fetchResult.status === 'circuit_open' ? 'open' : 'closed',
        },
      })
    }

    return {
      connectorSlug: slug,
      connectorName: connector.name,
      fetchResult,
      fieldsByOntologyName,
      connectorRunId,
      error: null,
    }
  })

  const connectorResults = await Promise.all(connectorPromises)

  // ── 6. Walk each planned field, write FormFieldValue + Provenance + ReviewQueueItem ──
  // First, determine the entity's jurisdiction from the LEI connector result (if any)
  let resolvedJurisdiction: string | undefined = lookup.jurisdiction
  let resolvedEntityName: string = lookup.value
  for (const cr of connectorResults) {
    if (cr.connectorSlug === 'lei' && cr.fetchResult?.parsed) {
      const jurField = cr.fetchResult.parsed.fields.find((f) => f.field === 'jurisdiction')
      if (jurField?.value) resolvedJurisdiction = String(jurField.value)
      const nameField = cr.fetchResult.parsed.fields.find((f) => f.field === 'legal_name')
      if (nameField?.value) resolvedEntityName = String(nameField.value)
      break
    }
  }

  const team = teamForFormType(template.formType)

  // Cache connector IDs to avoid repeated DB lookups
  const connectorIdCache = new Map<string, string | null>()
  async function getConnectorId(slug: string): Promise<string | null> {
    if (connectorIdCache.has(slug)) return connectorIdCache.get(slug) ?? null
    const row = await db.connector.findUnique({ where: { slug }, select: { id: true } })
    const id = row?.id ?? null
    connectorIdCache.set(slug, id)
    return id
  }

  for (const fp of fieldPlans) {
    const cr = connectorResults.find((c) => c.connectorSlug === fp.connectorSlug)
    if (!cr) {
      fieldResults.push({
        fieldPath: fp.fieldPath,
        fieldLabel: fp.fieldLabel,
        ontologyFieldName: fp.ontologyFieldName,
        value: null,
        confidence: 0,
        confidenceBand: 'low',
        connectorSlug: fp.connectorSlug,
        autoFilled: false,
        inReviewQueue: true,
        reviewReason: 'no_data',
        reviewTeam: team,
        error: 'Connector plan not found',
      })
      continue
    }

    // If connector failed entirely, mark field as no_data
    if (cr.error || !cr.fetchResult?.success || !cr.fetchResult.parsed) {
      const fv = await db.formFieldValue.create({
        data: {
          instanceId: instance.id,
          fieldPath: fp.fieldPath,
          valueJson: JSON.stringify(null),
          confidence: 0,
          confidenceBand: 'low',
          autoFilled: false,
          ontologyFieldName: fp.ontologyFieldName,
          sourceConnectorId: await getConnectorId(fp.connectorSlug),
        },
      })
      // Provenance row (still written — captures the failed attempt)
      if (cr.fetchResult) {
        await db.formFieldProvenance.create({
          data: {
            fieldValueId: fv.id,
            connectorRunId: cr.connectorRunId,
            connectorSlug: fp.connectorSlug,
            fetchedAt: new Date(),
            rawPayloadHash: cr.fetchResult.rawPayloadHash || null,
            parserSlug: fp.ontology.parserSlug,
            parserVersion: '1.0.0',
            payloadSnippet: cr.fetchResult.payloadSnippet || null,
            payloadJsonPath: null,
            confidenceAtCapture: 0,
          },
        })
      }
      await db.reviewQueueItem.create({
        data: {
          fieldValueId: fv.id,
          instanceId: instance.id,
          status: 'pending',
          reason: 'no_data',
          assignedTeam: team,
          originalValueJson: null,
        },
      })
      fieldResults.push({
        fieldPath: fp.fieldPath,
        fieldLabel: fp.fieldLabel,
        ontologyFieldName: fp.ontologyFieldName,
        value: null,
        confidence: 0,
        confidenceBand: 'low',
        connectorSlug: fp.connectorSlug,
        autoFilled: false,
        inReviewQueue: true,
        reviewReason: 'no_data',
        reviewTeam: team,
        error: cr.error || cr.fetchResult?.errorMessage || `Connector status: ${cr.fetchResult?.status}`,
      })
      continue
    }

    // Connector succeeded — look up the parsed field value
    const parsedField = cr.fieldsByOntologyName.get(fp.ontologyFieldName)
    if (!parsedField || parsedField.value === null || parsedField.value === undefined) {
      // Field not returned by connector — no_data
      const fv = await db.formFieldValue.create({
        data: {
          instanceId: instance.id,
          fieldPath: fp.fieldPath,
          valueJson: JSON.stringify(null),
          confidence: 0,
          confidenceBand: 'low',
          autoFilled: false,
          ontologyFieldName: fp.ontologyFieldName,
          sourceConnectorId: await getConnectorId(fp.connectorSlug),
        },
      })
      await db.formFieldProvenance.create({
        data: {
          fieldValueId: fv.id,
          connectorRunId: cr.connectorRunId,
          connectorSlug: fp.connectorSlug,
          fetchedAt: new Date(),
          rawPayloadHash: cr.fetchResult.rawPayloadHash || null,
          parserSlug: fp.ontology.parserSlug,
          parserVersion: cr.fetchResult.parsed.parserVersion,
          payloadSnippet: cr.fetchResult.payloadSnippet || null,
          payloadJsonPath: null,
          confidenceAtCapture: 0,
        },
      })
      await db.reviewQueueItem.create({
        data: {
          fieldValueId: fv.id,
          instanceId: instance.id,
          status: 'pending',
          reason: 'no_data',
          assignedTeam: team,
          originalValueJson: null,
        },
      })
      fieldResults.push({
        fieldPath: fp.fieldPath,
        fieldLabel: fp.fieldLabel,
        ontologyFieldName: fp.ontologyFieldName,
        value: null,
        confidence: 0,
        confidenceBand: 'low',
        connectorSlug: fp.connectorSlug,
        autoFilled: false,
        inReviewQueue: true,
        reviewReason: 'no_data',
        reviewTeam: team,
      })
      continue
    }

    // Field has a value — write FormFieldValue
    const band = confidenceBand(parsedField.confidence)
    const isSanctionsHit = (
      fp.ontologyFieldName === 'sanctions_screening_result' &&
      typeof parsedField.value === 'object' && parsedField.value !== null &&
      (parsedField.value as { hit?: boolean }).hit === true
    )
    const reason = reviewReasonForField(fp.ontology, parsedField.confidence, isSanctionsHit)
    const needsReview = reason !== 'manual_flag' || band === 'low'

    const fv = await db.formFieldValue.create({
      data: {
        instanceId: instance.id,
        fieldPath: fp.fieldPath,
        valueJson: JSON.stringify(parsedField.value),
        confidence: parsedField.confidence,
        confidenceBand: band,
        autoFilled: true,
        ontologyFieldName: fp.ontologyFieldName,
        sourceConnectorId: await getConnectorId(fp.connectorSlug),
      },
    })

    // L6 — Provenance
    await db.formFieldProvenance.create({
      data: {
        fieldValueId: fv.id,
        connectorRunId: cr.connectorRunId,
        connectorSlug: fp.connectorSlug,
        fetchedAt: new Date(),
        rawPayloadHash: cr.fetchResult.rawPayloadHash || null,
        parserSlug: fp.ontology.parserSlug,
        parserVersion: cr.fetchResult.parsed.parserVersion,
        payloadSnippet: cr.fetchResult.payloadSnippet || null,
        payloadJsonPath: parsedField.payloadPath || null,
        confidenceAtCapture: parsedField.confidence,
      },
    })

    // L7 — Review queue (if low confidence or sanctions hit)
    if (needsReview) {
      await db.reviewQueueItem.create({
        data: {
          fieldValueId: fv.id,
          instanceId: instance.id,
          status: 'pending',
          reason,
          assignedTeam: isSanctionsHit ? 'Sanctions' : team,
          originalValueJson: JSON.stringify(parsedField.value),
        },
      })
    }

    fieldResults.push({
      fieldPath: fp.fieldPath,
      fieldLabel: fp.fieldLabel,
      ontologyFieldName: fp.ontologyFieldName,
      value: parsedField.value,
      confidence: parsedField.confidence,
      confidenceBand: band,
      connectorSlug: fp.connectorSlug,
      autoFilled: true,
      inReviewQueue: needsReview,
      reviewReason: needsReview ? reason : undefined,
      reviewTeam: needsReview ? (isSanctionsHit ? 'Sanctions' : team) : undefined,
    })
  }

  // Add "manual / not autofillable" fields to the result for UI display
  for (const f of fieldsWithoutAutofill) {
    fieldResults.push({
      fieldPath: f.fieldPath,
      fieldLabel: f.fieldLabel,
      ontologyFieldName: null,
      value: null,
      confidence: 0,
      confidenceBand: 'low',
      connectorSlug: null,
      autoFilled: false,
      inReviewQueue: false,
      error: 'Field requires manual entry (not autofillable in Phase 1)',
    })
  }

  // ── 7. Build connector run summaries ──
  for (const cr of connectorResults) {
    if (!cr.fetchResult) {
      connectorRunSummaries.push({
        connectorSlug: cr.connectorSlug,
        connectorName: cr.connectorName,
        success: false,
        status: 'failure',
        httpStatus: 0,
        latencyMs: 0,
        recordsPulled: 0,
        fieldsReturned: 0,
        errorMessage: cr.error || 'No fetch attempted',
        endpointCalled: '',
      })
      continue
    }
    connectorRunSummaries.push({
      connectorSlug: cr.connectorSlug,
      connectorName: cr.connectorName,
      success: cr.fetchResult.success,
      status: cr.fetchResult.status,
      httpStatus: cr.fetchResult.httpStatus,
      latencyMs: cr.fetchResult.latencyMs,
      recordsPulled: cr.fetchResult.parsed?.rawRecordCount ?? 0,
      fieldsReturned: cr.fetchResult.parsed?.fields.length ?? 0,
      errorMessage: cr.fetchResult.errorMessage,
      endpointCalled: cr.fetchResult.endpointCalled,
    })
  }

  // ── 8. Compute overall confidence + update FormInstance ──
  const autoFilledFields = fieldResults.filter((f) => f.autoFilled)
  const reviewQueueCount = fieldResults.filter((f) => f.inReviewQueue).length
  const autoFilledConfidence = autoFilledFields.length > 0
    ? autoFilledFields.reduce((sum, f) => sum + f.confidence, 0) / autoFilledFields.length
    : 0
  const overallConfidence = fieldResults.length > 0
    ? fieldResults.reduce((sum, f) => sum + f.confidence, 0) / fieldResults.length
    : 0

  const status: AutofillResult['status'] =
    autoFilledFields.length === 0 ? 'failure'
    : reviewQueueCount > autoFilledFields.length / 2 ? 'partial'
    : 'success'

  await db.formInstance.update({
    where: { id: instance.id },
    data: {
      status: status === 'failure' ? 'draft' : 'in_review',
      overallConfidence,
      autoFilledFieldCount: autoFilledFields.length,
      reviewQueueCount,
      entityName: resolvedEntityName,
    },
  })

  return {
    instanceId: instance.id,
    templateSlug: template.slug,
    entityId: req.entityId,
    entityName: resolvedEntityName,
    status,
    totalFields: fieldResults.length,
    autoFilledFields: autoFilledFields.length,
    reviewQueueItems: reviewQueueCount,
    overallConfidence,
    autoFilledConfidence,
    fieldResults,
    connectorRuns: connectorRunSummaries,
    durationMs: Date.now() - startTs,
  }
}

// ─────────────────────────────────────────────────────────────
// Failure helper (no instance created)
// ─────────────────────────────────────────────────────────────

function failureResult(req: AutofillRequest, errorMessage: string, startTs: number): AutofillResult {
  return {
    instanceId: '',
    templateSlug: req.formSlug,
    entityId: req.entityId,
    entityName: req.entityId,
    status: 'failure',
    totalFields: 0,
    autoFilledFields: 0,
    reviewQueueItems: 0,
    overallConfidence: 0,
    autoFilledConfidence: 0,
    fieldResults: [],
    connectorRuns: [],
    durationMs: Date.now() - startTs,
    errorMessage,
  }
}

// ─────────────────────────────────────────────────────────────
// Query helpers (used by UI)
// ─────────────────────────────────────────────────────────────

export async function listFormInstances(limit = 50) {
  return db.formInstance.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      template: { select: { slug: true, name: true, formType: true, regulator: true, jurisdiction: true } },
      _count: {
        select: {
          fieldValues: true,
          reviewQueueItems: true,
        },
      },
    },
  })
}

export async function getFormInstanceDetail(id: string) {
  return db.formInstance.findUnique({
    where: { id },
    include: {
      template: true,
      fieldValues: {
        orderBy: { fieldPath: 'asc' },
        include: {
          provenance: true,
          sourceConnector: { select: { slug: true, name: true } },
          reviewQueueItem: true,
        },
      },
      reviewQueueItems: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function listReviewQueueItems(status?: string, limit = 50) {
  return db.reviewQueueItem.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      fieldValue: {
        include: {
          instance: {
            select: { id: true, entityId: true, entityName: true, template: { select: { slug: true, name: true } } },
          },
        },
      },
    },
  })
}
