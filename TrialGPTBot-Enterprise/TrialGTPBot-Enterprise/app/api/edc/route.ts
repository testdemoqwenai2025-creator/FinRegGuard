/**
 * EDC Connection Test API
 * 
 * Tests connectivity to EDC systems:
 * - Medidata Rave (via API)
 * - Oracle Clinical One (via API)
 * - Veeva Vault (via API)
 * 
 * Returns connection status, latency, and system health.
 */

import { NextRequest, NextResponse } from 'next/server';

interface EDCConnectionResult {
  system: string;
  type: string;
  status: 'connected' | 'degraded' | 'disconnected' | 'error';
  latency: number;
  lastSync: string;
  recordsProcessed: number;
  pendingRecords: number;
  version: string;
  details?: any;
}

// Simulated EDC connections (in production, these would be real API calls)
async function testMedidataRave(): Promise<EDCConnectionResult> {
  const startTime = Date.now();
  
  try {
    // Simulate API call to Medidata Rave
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
    
    const latency = Date.now() - startTime;
    
    return {
      system: 'Medidata Rave',
      type: 'medidata_rave',
      status: latency < 100 ? 'connected' : latency < 200 ? 'degraded' : 'error',
      latency,
      lastSync: new Date(Date.now() - 120000).toISOString(),
      recordsProcessed: 15420 + Math.floor(Math.random() * 100),
      pendingRecords: Math.floor(Math.random() * 30),
      version: '2024.2.1',
      details: {
        apiEndpoint: 'https://api.medidata.com/rave',
        authMethod: 'OAuth2',
        odmVersion: '1.3.2',
        studyCount: 12,
        subjectCount: 847,
        formCount: 3420,
      }
    };
  } catch (error) {
    return {
      system: 'Medidata Rave',
      type: 'medidata_rave',
      status: 'error',
      latency: Date.now() - startTime,
      lastSync: new Date().toISOString(),
      recordsProcessed: 0,
      pendingRecords: 0,
      version: 'Unknown',
    };
  }
}

async function testOracleClinicalOne(): Promise<EDCConnectionResult> {
  const startTime = Date.now();
  
  try {
    // Simulate API call to Oracle Clinical One
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 100));
    
    const latency = Date.now() - startTime;
    
    return {
      system: 'Oracle Clinical One',
      type: 'oracle_clinical_one',
      status: latency < 150 ? 'connected' : latency < 300 ? 'degraded' : 'error',
      latency,
      lastSync: new Date(Date.now() - 300000).toISOString(),
      recordsProcessed: 8934 + Math.floor(Math.random() * 50),
      pendingRecords: Math.floor(Math.random() * 60),
      version: '2024.1.3',
      details: {
        apiEndpoint: 'https://clinical-one.oraclecloud.com/api',
        authMethod: 'OAuth2 + SAML',
        odmVersion: '1.3.2',
        studyCount: 8,
        subjectCount: 523,
        siteCount: 24,
      }
    };
  } catch (error) {
    return {
      system: 'Oracle Clinical One',
      type: 'oracle_clinical_one',
      status: 'error',
      latency: Date.now() - startTime,
      lastSync: new Date().toISOString(),
      recordsProcessed: 0,
      pendingRecords: 0,
      version: 'Unknown',
    };
  }
}

async function testVeevaVault(): Promise<EDCConnectionResult> {
  const startTime = Date.now();
  
  try {
    // Simulate API call to Veeva Vault
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
    
    const latency = Date.now() - startTime;
    
    return {
      system: 'Veeva Vault EDC',
      type: 'veeva_vault',
      status: latency < 200 ? 'connected' : latency < 400 ? 'degraded' : 'error',
      latency,
      lastSync: new Date(Date.now() - 900000).toISOString(),
      recordsProcessed: 6789 + Math.floor(Math.random() * 80),
      pendingRecords: Math.floor(Math.random() * 120),
      version: '24.R3.2',
      details: {
        apiEndpoint: 'https://api.veevavault.com/api/v23.3',
        authMethod: 'OAuth2',
        vaultName: 'EDC_Production',
        studyCount: 5,
        documentCount: 12450,
        storageUsed: '2.3 TB',
      }
    };
  } catch (error) {
    return {
      system: 'Veeva Vault EDC',
      type: 'veeva_vault',
      status: 'error',
      latency: Date.now() - startTime,
      lastSync: new Date().toISOString(),
      recordsProcessed: 0,
      pendingRecords: 0,
      version: 'Unknown',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system'); // Optional: test specific system

    console.log(`[EDC TEST] Testing EDC connections...`);

    let results: EDCConnectionResult[];

    if (system) {
      // Test specific system
      switch (system.toLowerCase()) {
        case 'medidata':
        case 'rave':
          results = [await testMedidataRave()];
          break;
        case 'oracle':
        case 'clinical_one':
          results = [await testOracleClinicalOne()];
          break;
        case 'veeva':
        case 'vault':
          results = [await testVeevaVault()];
          break;
        default:
          return NextResponse.json(
            { success: false, error: `Unknown EDC system: ${system}` },
            { status: 400 }
          );
      }
    } else {
      // Test all systems in parallel
      results = await Promise.all([
        testMedidataRave(),
        testOracleClinicalOne(),
        testVeevaVault(),
      ]);
    }

    // Calculate overall health
    const connectedCount = results.filter(r => r.status === 'connected').length;
    const overallHealth = `${Math.round((connectedCount / results.length) * 100)}%`;

    return NextResponse.json({
      success: true,
      testedAt: new Date().toISOString(),
      overallHealth,
      systems: results,
      summary: {
        total: results.length,
        connected: connectedCount,
        degraded: results.filter(r => r.status === 'degraded').length,
        error: results.filter(r => r.status === 'error').length,
        averageLatency: Math.round(results.reduce((sum, r) => sum + r.latency, 0) / results.length),
        totalRecordsProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
        totalPendingRecords: results.reduce((sum, r) => sum + r.pendingRecords, 0),
      },
    });

  } catch (error) {
    console.error('EDC Test Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test EDC connections' },
      { status: 500 }
    );
  }
}

// POST to configure/test a new EDC connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemType, config } = body;

    if (!systemType || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing systemType or config' },
        { status: 400 }
      );
    }

    console.log(`[EDC CONFIG] Configuring ${systemType}:`, config);

    // Validate configuration
    const validation = validateEDCConfig(systemType, config);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid configuration',
        validationErrors: validation.errors,
      }, { status: 400 });
    }

    // Test the connection with provided config
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate connection test

    return NextResponse.json({
      success: true,
      message: `Successfully configured and tested ${systemType}`,
      systemType,
      config: {
        ...config,
        apiKey: '***', // Never return full API key
        password: '***',
      },
      connectionTest: {
        status: 'success',
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      nextSteps: [
        'Save configuration securely',
        'Run initial data sync',
        'Set up automated sync schedule',
        'Configure alert thresholds',
      ],
    });

  } catch (error) {
    console.error('EDC Config Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure EDC system' },
      { status: 500 }
    );
  }
}

function validateEDCConfig(systemType: string, config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (systemType.toLowerCase()) {
    case 'medidata_rave':
    case 'rave':
      if (!config.apiKey) errors.push('API Key is required');
      if (!config.environment) errors.push('Environment (prod/dev/test) is required');
      if (!config.studyOid) errors.push('Study OID is required');
      break;

    case 'oracle_clinical_one':
    case 'oracle':
      if (!config.clientId) errors.push('Client ID is required');
      if (!config.clientSecret) errors.push('Client Secret is required');
      if (!config.tenantUrl) errors.push('Tenant URL is required');
      break;

    case 'veeva_vault':
    case 'veeva':
      if (!config.username) errors.push('Username is required');
      if (!config.password) errors.push('Password is required');
      if (!config.vaultDns) errors.push('Vault DNS is required');
      break;

    default:
      errors.push(`Unknown EDC system type: ${systemType}`);
  }

  return { valid: errors.length === 0, errors };
}
