'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AIRec = {
  action: string
  confidence: number
  reasoning: string
  reviewerAction: string
}

type Props = {
  rec: AIRec
  onApprove?: () => void
  onReject?: () => void
  className?: string
}

/**
 * BooleanActionCard — the cornerstone of the "machine proposes, human confirms"
 * design principle. Every decision in RegGuard AI is pre-computed by the
 * machine with a recommendation, confidence score, and reasoning. The human
 * reviewer only sees Approve / Reject buttons.
 *
 * Used across all 22 views to enforce consistency.
 */
export function BooleanActionCard({ rec, onApprove, onReject, className }: Props) {
  const [status, setStatus] = useState<'pending' | 'approving' | 'approved' | 'rejected'>('pending')

  const handleApprove = () => {
    setStatus('approving')
    setTimeout(() => {
      setStatus('approved')
      onApprove?.()
    }, 600)
  }

  const handleReject = () => {
    setStatus('approving')
    setTimeout(() => {
      setStatus('rejected')
      onReject?.()
    }, 600)
  }

  if (status === 'approved' || status === 'rejected') {
    return (
      <Card className={cn(
        'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40',
        status === 'rejected' && 'border-rose-200 from-rose-50 to-orange-50/40',
        className,
      )}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full',
            status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500',
          )}>
            {status === 'approved'
              ? <Check className="h-5 w-5 text-white" />
              : <X className="h-5 w-5 text-white" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {status === 'approved' ? 'Decision Confirmed' : 'Decision Rejected'}
            </p>
            <p className="text-xs text-slate-600">
              {rec.action} · audit-logged to ChainAnchor
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
            hash 0x{Math.random().toString(16).slice(2, 10)}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50/30 shadow-sm', className)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                AI Recommendation
              </p>
              <Badge variant="outline" className="border-violet-200 bg-white text-[10px] text-violet-700">
                {rec.confidence}% confidence
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-900">{rec.action}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{rec.reasoning}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={status === 'approving'}
            className="flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {status === 'approving'
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Anchoring…</>
              : <><Check className="h-3.5 w-3.5" /> Approve</>
            }
          </Button>
          <Button
            size="sm"
            onClick={handleReject}
            disabled={status === 'approving'}
            variant="outline"
            className="flex-1 gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact inline Boolean pill for table rows — Approve/Reject only.
 */
export function BooleanPill({ rec, onApprove, onReject }: {
  rec: AIRec
  onApprove?: () => void
  onReject?: () => void
}) {
  const [state, setState] = useState<'pending' | 'approved' | 'rejected'>('pending')
  if (state !== 'pending') {
    return (
      <Badge variant="outline" className={
        state === 'approved'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700'
      }>
        {state === 'approved' ? '✓ Approved' : '✗ Rejected'}
      </Badge>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
        title={rec.action}
        onClick={() => { setState('approved'); onApprove?.() }}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-[11px] text-rose-700 hover:bg-rose-50"
        onClick={() => { setState('rejected'); onReject?.() }}
      >
        Reject
      </Button>
    </div>
  )
}
