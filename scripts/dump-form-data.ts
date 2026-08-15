// scripts/dump-form-data.ts
// Dump current FormInstance + FormFieldValue + FormFieldProvenance +
// ReviewQueueItem + Connector + ConnectorRun + FormTemplate + FieldOntology
// rows into public/data/forms/*.json so the static GitHub Pages site can
// display the same data the dev server shows.
//
// Run with: bun run scripts/dump-form-data.ts

import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const prisma = new PrismaClient()
const OUT_DIR = join(process.cwd(), 'public', 'data', 'forms')

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // 1. FormTemplates
  const templates = await prisma.formTemplate.findMany({
    include: { instances: { orderBy: { createdAt: 'desc' }, take: 50 } },
  })
  writeFileSync(join(OUT_DIR, 'templates.json'), JSON.stringify(templates, null, 2))

  // 2. FormInstances (with fieldValues + provenance + reviewQueueItems)
  const instances = await prisma.formInstance.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      template: true,
      fieldValues: {
        orderBy: { fieldPath: 'asc' },
        include: {
          provenance: true,
        },
      },
      reviewQueueItems: {
        orderBy: { createdAt: 'desc' },
        include: { fieldValue: true },
      },
    },
  })
  writeFileSync(join(OUT_DIR, 'instances.json'), JSON.stringify(instances, null, 2))

  // 3. ReviewQueueItems (flat list)
  const reviewQueue = await prisma.reviewQueueItem.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      fieldValue: { include: { provenance: true } },
      instance: { include: { template: true } },
    },
  })
  writeFileSync(join(OUT_DIR, 'review-queue.json'), JSON.stringify(reviewQueue, null, 2))

  // 4. Connectors (with their last 20 runs each)
  const connectors = await prisma.connector.findMany({
    include: {
      runs: { orderBy: { startedAt: 'desc' }, take: 20 },
    },
  })
  writeFileSync(join(OUT_DIR, 'connectors.json'), JSON.stringify(connectors, null, 2))

  // 5. FieldOntology
  const ontology = await prisma.fieldOntology.findMany({
    orderBy: { fieldName: 'asc' },
  })
  writeFileSync(join(OUT_DIR, 'ontology.json'), JSON.stringify(ontology, null, 2))

  // 6. Summary stats
  const totalInstances = await prisma.formInstance.count()
  const totalReviewItems = await prisma.reviewQueueItem.count()
  const totalConnectors = await prisma.connector.count()
  const totalFields = await prisma.formFieldValue.count()
  const summary = {
    totalInstances,
    totalReviewItems,
    totalConnectors,
    totalFields,
    generatedAt: new Date().toISOString(),
  }
  writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2))

  console.log(`✓ Dumped form data to ${OUT_DIR}`)
  console.log(`  - templates.json (${templates.length} templates)`)
  console.log(`  - instances.json (${instances.length} instances)`)
  console.log(`  - review-queue.json (${reviewQueue.length} items)`)
  console.log(`  - connectors.json (${connectors.length} connectors)`)
  console.log(`  - ontology.json (${ontology.length} field definitions)`)
  console.log(`  - summary.json`)
  console.log(`  Summary:`, summary)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
