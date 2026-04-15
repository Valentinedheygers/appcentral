"use client"

import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import type { TrackerSource } from '@/lib/trump-tracker/types'

export function SourceStatus({ sources }: { sources: TrackerSource[] }) {
  if (!sources.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No sources configured
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sources.map(source => {
        const hasError = !!source.last_error
        const lastPolled = source.last_polled_at
          ? getRelativeTime(source.last_polled_at)
          : 'Never'

        return (
          <div
            key={source.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2">
              {hasError ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              ) : source.last_polled_at ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-card-foreground">
                {source.display_name}
              </span>
            </div>
            <span className={`text-[10px] ${hasError ? 'text-red-400' : 'text-muted-foreground'}`}>
              {hasError ? 'Error' : lastPolled}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
