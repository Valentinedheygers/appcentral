"use client"

import { Search, SlidersHorizontal } from 'lucide-react'
import type { InvestmentAssetType } from '@/lib/trump-tracker/types'

interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  assetType: InvestmentAssetType | 'all'
  onAssetTypeChange: (v: InvestmentAssetType | 'all') => void
  familyMember: string
  onFamilyMemberChange: (v: string) => void
  memberOptions?: string[]
}

const ASSET_TYPES: { value: InvestmentAssetType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'stock', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'nft', label: 'NFT' },
  { value: 'spac', label: 'SPAC' },
  { value: 'fund', label: 'Fund' },
  { value: 'other', label: 'Other' },
]

const DEFAULT_MEMBERS = [
  'All Members',
  'Donald Trump',
  'Donald Trump Jr',
  'Eric Trump',
  'Ivanka Trump',
  'Jared Kushner',
]

export function FilterBar({
  search,
  onSearchChange,
  assetType,
  onAssetTypeChange,
  familyMember,
  onFamilyMemberChange,
  memberOptions,
}: FilterBarProps) {
  const members = memberOptions && memberOptions.length > 1 ? memberOptions : DEFAULT_MEMBERS

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by ticker, name, member..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Asset Type */}
      <div className="relative">
        <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={assetType}
          onChange={e => onAssetTypeChange(e.target.value as InvestmentAssetType | 'all')}
          className="pl-8 pr-8 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
        >
          {ASSET_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Member */}
      <select
        value={familyMember}
        onChange={e => onFamilyMemberChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer max-w-[220px]"
      >
        {members.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  )
}
