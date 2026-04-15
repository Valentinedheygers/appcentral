"use client"

import { useEffect, useRef } from 'react'
import type { TrumpInvestment } from '@/lib/trump-tracker/types'
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend)

const COLORS: Record<string, string> = {
  stock: '#10b981',
  crypto: '#f59e0b',
  real_estate: '#3b82f6',
  nft: '#a855f7',
  spac: '#ec4899',
  fund: '#06b6d4',
  other: '#6b7280',
}

const LABELS: Record<string, string> = {
  stock: 'Stocks',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  nft: 'NFT',
  spac: 'SPAC',
  fund: 'Fund',
  other: 'Other',
}

export function PortfolioChart({ investments }: { investments: TrumpInvestment[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Count by asset type
    const counts: Record<string, number> = {}
    for (const inv of investments) {
      counts[inv.asset_type] = (counts[inv.asset_type] || 0) + 1
    }

    const types = Object.keys(counts)
    if (types.length === 0) return

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: types.map(t => LABELS[t] || t),
        datasets: [
          {
            data: types.map(t => counts[t]),
            backgroundColor: types.map(t => COLORS[t] || '#6b7280'),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8,
              font: { size: 11 },
              color: '#9ca3af',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 8,
            cornerRadius: 6,
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [investments])

  if (investments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data to chart yet
      </div>
    )
  }

  return (
    <div className="p-4">
      <canvas ref={canvasRef} />
    </div>
  )
}
