"use client"

import { ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { TrumpInvestment } from '@/lib/trump-tracker/types'
import { useState } from 'react'

const ASSET_BADGE: Record<string, { label: string; color: string }> = {
  stock: { label: 'Stock', color: '#10b981' },
  crypto: { label: 'Crypto', color: '#f59e0b' },
  real_estate: { label: 'Real Estate', color: '#3b82f6' },
  nft: { label: 'NFT', color: '#a855f7' },
  spac: { label: 'SPAC', color: '#ec4899' },
  fund: { label: 'Fund', color: '#06b6d4' },
  other: { label: 'Other', color: '#6b7280' },
}

const SOURCE_LABELS: Record<string, string> = {
  sec_filing: 'SEC Filing',
  news: 'News',
  crypto_onchain: 'On-Chain',
  congress_disclosure: 'Congress',
  social_media: 'Social Media',
}

export function InvestmentCard({ investment }: { investment: TrumpInvestment }) {
  const [expanded, setExpanded] = useState(false)
  const badge = ASSET_BADGE[investment.asset_type] || ASSET_BADGE.other
  const isCongressMember = investment.family_member.startsWith('Rep.') || investment.family_member.startsWith('Sen.')

  const timeAgo = getRelativeTime(investment.detected_at)
  const amount = investment.estimated_amount_usd
    ? `$${investment.estimated_amount_usd.toLocaleString()}`
    : null

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: badge.color + '20', color: badge.color }}
          >
            {badge.label}
          </span>
          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
            {SOURCE_LABELS[investment.source_type] || investment.source_type}
          </span>
          {isCongressMember && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
              Congress
            </span>
          )}
          {!isCongressMember && !investment.verified && (
            <span className="text-[10px] text-amber-500 font-medium">Unverified</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Asset name + ticker */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-card-foreground">
            {investment.asset_name}
            {investment.asset_ticker && (
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                ({investment.asset_ticker})
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {investment.family_member}
            {investment.action && ` · ${investment.action}`}
            {amount && ` · ${amount}`}
          </p>
        </div>
        {investment.source_url && (
          <a
            href={investment.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Description */}
      {investment.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {investment.description}
        </p>
      )}

      {/* AI Summary (expandable) */}
      {investment.ai_summary && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            AI Summary
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <p className="text-xs text-muted-foreground mt-1 p-2 rounded bg-muted/50">
              {investment.ai_summary}
            </p>
          )}
        </div>
      )}
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
  if (days < 7) return `${days}d ago`

  return new Date(dateStr).toLocaleDateString()
}
