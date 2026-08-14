/**
 * FDA API Integration - Proxy to OpenFDA API
 * 
 * Provides access to:
 * - Drug labels and information
 * - Adverse event reports
 * - Clinical trial data
 * - Recall information
 * 
 * Free tier: 240 requests/minute, no API key required
 * Documentation: https://open.fda.gov/api/
 */

import { NextRequest, NextResponse } from 'next/server';

const FDA_BASE_URL = 'https://api.fda.gov';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get the FDA endpoint (drug/label, drug/event, etc.)
    const endpoint = searchParams.get('endpoint') || 'drug/label';
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || '10';
    const skip = searchParams.get('skip') || '0';

    // Build FDA API URL
    let fdaUrl = `${FDA_BASE_URL}/${endpoint}.json`;
    const params = new URLSearchParams();
    
    if (search) {
      params.append('search', search);
    }
    params.append('limit', limit);
    params.append('skip', skip);
    
    fdaUrl += `?${params.toString()}`;

    console.log(`[FDA API] Requesting: ${fdaUrl}`);

    // Make request to FDA API
    const response = await fetch(fdaUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrialGPTBot-Enterprise/2.5'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Log the request for audit
    console.log(`[FDA API] Response: ${data.results?.length || 0} results`);

    return NextResponse.json({
      success: true,
      source: 'FDA OpenAPI',
      endpoint,
      query: { search, limit, skip },
      fetchedAt: new Date().toISOString(),
      ...data,
      // Add TrialGPTBot-specific metadata
      metadata: {
        apiVersion: '2.0',
        disclaimer: 'Data provided by U.S. Food and Drug Administration',
        license: 'Public Domain',
        attributionRequired: true,
      },
    });

  } catch (error) {
    console.error('FDA API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data from FDA API',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: getFallbackData(),
    }, { status: 500 });
  }
}

// POST for complex searches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, search, filters } = body;

    let fdaUrl = `${FDA_BASE_URL}/${endpoint || 'drug/label'}.json`;
    const params = new URLSearchParams();

    if (search) {
      params.append('search', search);
    }

    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value) {
          params.append(key, value);
        }
      });
    }

    params.append('limit', String(body.limit || 10));
    fdaUrl += `?${params.toString()}`;

    console.log(`[FDA API] POST Request: ${fdaUrl}`);

    const response = await fetch(fdaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrialGPTBot-Enterprise/2.5'
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'FDA OpenAPI',
      ...data,
    });

  } catch (error) {
    console.error('FDA POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'FDA API request failed' },
      { status: 500 }
    );
  }
}

// Fallback data when FDA API is unavailable
function getFallbackData() {
  return {
    results: [
      {
        id: "fallback_1",
        openfda: {
          brand_name: ["Sample Drug"],
          generic_name: ["Active Ingredient"],
          manufacturer_name: ["Pharma Corp"]
        },
        indications_and_usage: ["This is fallback data when FDA API is unavailable."],
        is_fallback: true
      }
    ],
    meta: {
      disclaimer: "This is cached/fallback data. Live FDA data unavailable.",
      last_updated: new Date().toISOString()
    }
  };
}
