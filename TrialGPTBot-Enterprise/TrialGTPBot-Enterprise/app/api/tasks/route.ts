/**
 * Tasks API Route - Backend for Task Queue Management
 * 
 * Provides RESTful endpoints for:
 * - Fetching tasks with filtering and pagination
 * - Making decisions on tasks (approve/reject/escalate)
 * - Bulk operations
 * - Statistics calculation
 * - Auto-approve high confidence tasks
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory task store (in production, this would be a database)
let tasks: any[] = [];
let taskIdCounter = 1000;

// Generate mock tasks if empty
function ensureTasksExist() {
  if (tasks.length === 0) {
    const confidences = [
      { level: 'very_high', score: 98, color: 'emerald' },
      { level: 'high', score: 89, color: 'blue' },
      { level: 'medium', score: 76, color: 'amber' },
      { level: 'low', score: 58, color: 'orange' },
      { level: 'very_low', score: 42, color: 'red' },
    ];
    
    const priorities = ['critical', 'high', 'medium', 'low'];
    const statuses = ['pending_review', 'in_progress', 'completed', 'escalated'];
    const forms = ['ICF', 'CRF', 'AE', 'CM', 'DV', 'LB', 'VS', 'ECG'];
    const edcSystems = [
      { type: 'medidata_rave', label: 'Medidata Rave', color: 'indigo' },
      { type: 'oracle_clinical_one', label: 'Oracle Clinical One', color: 'cyan' },
      { type: 'veeva_vault', label: 'Veeva Vault', color: 'teal' },
    ];
    const riskCategories = [
      'Data Integrity', 'Patient Safety', 'Regulatory Compliance',
      'Protocol Deviation', 'Adverse Event', 'Consent Issue'
    ];

    // Generate 50 mock tasks
    for (let i = 0; i < 50; i++) {
      const conf = confidences[Math.floor(Math.random() * confidences.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const edc = edcSystems[Math.floor(Math.random() * edcSystems.length)];
      const riskScore = Math.floor(Math.random() * 100);
      const isOverdue = Math.random() > 0.85 && status !== 'completed';
      
      tasks.push({
        id: `TASK-${String(++taskIdCounter).padStart(4, '0')}`,
        trialId: `TRIAL-${Math.floor(Math.random() * 900) + 100}`,
        siteId: `SITE-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
        subjectId: `SUBJ-${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
        formId: `${forms[Math.floor(Math.random() * forms.length)]}-${Math.floor(Math.random() * 999) + 1}`,
        fieldId: `field_${Math.random().toString(36).substring(2, 8)}`,
        originalValue: i % 4 === 0 ? null : `Original_Value_${i + 1}`,
        aiSuggestedValue: `AI_Suggestion_${i + 1}`,
        confidence: conf,
        priority,
        status,
        riskCategory: riskCategories[Math.floor(Math.random() * riskCategories.length)],
        riskScore,
        edcSource: edc,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
        dueDate: isOverdue 
          ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000),
        isOverdue,
        decision: status === 'completed' ? (Math.random() > 0.3 ? 'approved' : 'rejected') : undefined,
        modelVersion: `v${Math.floor(Math.random() * 5) + 1}.2.1`,
        processingTime: Math.floor(Math.random() * 4500) + 150,
        auditTrail: [],
      });
    }
  }
}

// GET /api/tasks - Fetch tasks with filtering
export async function GET(request: NextRequest) {
  try {
    ensureTasksExist();
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const confidence = searchParams.get('confidence');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const edcSource = searchParams.get('edcSource');
    const search = searchParams.get('search')?.toLowerCase();
    
    // Filter tasks
    let filteredTasks = [...tasks];
    
    if (confidence && confidence !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.confidence.level === confidence);
    }
    
    if (priority && priority !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.priority === priority);
    }
    
    if (status && status !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.status === status);
    }
    
    if (edcSource && edcSource !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.edcSource.type === edcSource);
    }
    
    if (search) {
      filteredTasks = filteredTasks.filter(t =>
        t.subjectId.toLowerCase().includes(search) ||
        t.formId.toLowerCase().includes(search) ||
        t.fieldId.toLowerCase().includes(search) ||
        t.trialId.toLowerCase().includes(search) ||
        t.aiSuggestedValue.toLowerCase().includes(search)
      );
    }
    
    // Sort by priority (critical first), then by date
    filteredTasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    
    // Paginate
    const paginatedTasks = filteredTasks.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      tasks: paginatedTasks,
      total: filteredTasks.length,
      limit,
      offset,
      hasMore: offset + limit < filteredTasks.length,
      filters: { confidence, priority, status, edcSource, search },
      fetchedAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task (from AI engine)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newTask = {
      id: `TASK-${String(++taskIdCounter).padStart(4, '0')}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending_review',
      auditTrail: [{
        timestamp: new Date(),
        action: 'created',
        userId: body.createdBy || 'ai_engine',
        details: 'Task created by AI engine',
      }],
    };
    
    tasks.unshift(newTask);
    
    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Task created successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
