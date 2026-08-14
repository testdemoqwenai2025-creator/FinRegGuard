/**
 * ClinicalTrials.gov API Integration
 * 
 * Provides access to clinical trial registry data
 * Free tier: No authentication required for basic access
 * Documentation: https://clinicaltrials.gov/api/v2/
 */

import { NextRequest, NextResponse } from 'next/server';

const CTG_BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const phase = searchParams.get('phase') || '';
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    // Build ClinicalTrials.gov API URL
    let url = `${CTG_BASE_URL}?`;
    const params = new URLSearchParams();

    if (query) {
      params.append('query.cond', query);
      params.append('query.term', query);
    }

    if (status && status !== 'all') {
      params.append('filter.overallStatus', status);
    }

    if (phase && phase !== 'all') {
      params.append('filter.phase', phase.toUpperCase());
    }

    params.append('pageSize', limit);
    params.append('offset', offset);

    // Request specific fields we need
    params.append('fields', [
      'protocolSection.identificationNCTId',
      'protocolSection.identificationModule.briefTitle',
      'protocolSection.identificationModule.officialTitle',
      'protocolSection.statusModule',
      'protocolSection.designModule',
      'protocolSection.interventionsModule',
      'protocolSection.conditionsModule',
      'protocolSection.eligibilityModule',
      'protocolSection.contactsLocationsModule',
      'resultsSection',
    ].join(','));

    url += params.toString();

    console.log(`[CTG API] Requesting: ${url.substring(0, 100)}...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrialGPTBot-Enterprise/2.5'
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'ClinicalTrials.gov',
      apiVersion: 'v2',
      fetchedAt: new Date().toISOString(),
      query: { query, status, phase, limit, offset },
      totalResults: data.totalResults || 0,
      studies: (data.studies || []).map((study: any) => ({
        nctId: study.protocolSection?.identificationNCTId,
        title: study.protocolSection?.identificationModule?.briefTitle,
        officialTitle: study.protocolSection?.identificationModule?.officialTitle,
        status: study.protocolSection?.statusModule?.overallStatus,
        phase: study.protocolSection?.designModule?.phases,
        conditions: study.protocolSection?.conditionsModule?.conditions?.map((c: any) => c.name),
        interventions: study.protocolSection?.interventionsModule?.interventions?.map((i: any) => ({
          type: i.type,
          name: i.name,
        })),
        eligibility: {
          criteria: study.protocolSection?.eligibilityModule?.eligibilityCriteria,
          gender: study.protocolSection?.eligibilityModule?.sex,
          minAge: study.protocolSection?.eligibilityModule?.minimumAge,
          maxAge: study.protocolSection?.eligibilityModule?.maximumAge,
        },
        locations: study.protocolSection?.contactsLocationsModule?.locations?.map((l: any) => ({
          facility: l.facility,
          city: l.city,
          country: l.country,
          status: l.status,
        })),
        hasResults: !!study.resultsSection,
        firstPostDate: study.protocolSection?.statusModule?.studyFirstPostDate,
        lastUpdateDate: study.protocolSection?.statusModule?.lastUpdatePostDate,
      })),
      metadata: {
        disclaimer: 'Data provided by ClinicalTrials.gov, a service of the U.S. National Institutes of Health',
        license: 'CC0 1.0 Universal (Public Domain)',
        attributionRequired: true,
      },
    });

  } catch (error) {
    console.error('ClinicalTrials.gov API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch from ClinicalTrials.gov',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: getFallbackTrials(),
    }, { status: 500 });
  }
}

function getFallbackTrials() {
  return {
    studies: [
      {
        nctId: "NCT00000001",
        title: "Sample Clinical Trial",
        status: "RECRUITING",
        phase: ["PHASE2"],
        conditions: ["Condition Example"],
        hasResults: false,
        is_fallback: true,
      }
    ],
    meta: {
      disclaimer: "This is fallback data when ClinicalTrials.gov is unavailable."
    }
  };
}
