import type { RawInvestment } from '../types'

// Known Trump-related crypto projects and tokens
const KNOWN_TOKENS: Record<string, string> = {
  '$TRUMP': 'TRUMP meme token (Solana)',
  '$MELANIA': 'MELANIA token',
  'WLFI': 'World Liberty Financial',
}

export async function collectCryptoWallets(config: Record<string, unknown>): Promise<RawInvestment[]> {
  const wallets = (config.wallets as string[]) || []
  const minValue = (config.min_value_usd as number) || 10000
  const investments: RawInvestment[] = []

  // 1. Check Ethereum wallets via Etherscan
  for (const wallet of wallets) {
    if (wallet.startsWith('0x')) {
      const ethTxs = await fetchEtherscanTransactions(wallet, minValue)
      investments.push(...ethTxs)
    }
  }

  // 2. Check for $TRUMP token activity via public APIs
  try {
    const trumpTokenActivity = await fetchTrumpTokenNews()
    investments.push(...trumpTokenActivity)
  } catch {
    // Skip on failure
  }

  return investments
}

async function fetchEtherscanTransactions(
  wallet: string,
  _minValue: number
): Promise<RawInvestment[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY
  if (!apiKey) return []

  const investments: RawInvestment[] = []

  try {
    // Get recent ERC-20 token transfers
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${wallet}&page=1&offset=20&sort=desc&apikey=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()
    if (data.status !== '1' || !data.result) return []

    for (const tx of data.result) {
      const value = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'))
      if (value === 0) continue

      const isOutgoing = tx.from.toLowerCase() === wallet.toLowerCase()

      investments.push({
        asset_name: tx.tokenName || tx.tokenSymbol || 'Unknown Token',
        asset_ticker: tx.tokenSymbol,
        asset_type: 'crypto',
        family_member: 'Trump Family (Wallet)',
        action: isOutgoing ? 'sell/transfer' : 'buy/receive',
        description: `${isOutgoing ? 'Sent' : 'Received'} ${value.toLocaleString()} ${tx.tokenSymbol} — tx: ${tx.hash.slice(0, 10)}...`,
        source_type: 'crypto_onchain',
        source_url: `https://etherscan.io/tx/${tx.hash}`,
        source_title: `Ethereum: ${value.toLocaleString()} ${tx.tokenSymbol} ${isOutgoing ? 'out' : 'in'}`,
        detected_at: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      })
    }
  } catch {
    // Skip
  }

  return investments
}

async function fetchTrumpTokenNews(): Promise<RawInvestment[]> {
  // Use CoinGecko free API to check $TRUMP token price movements
  const investments: RawInvestment[] = []

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/official-trump/market_chart?vs_currency=usd&days=1',
      { headers: { accept: 'application/json' } }
    )

    if (!res.ok) return []

    const data = await res.json()
    const prices: [number, number][] = data.prices || []

    if (prices.length < 2) return []

    const latest = prices[prices.length - 1]
    const earliest = prices[0]
    const priceChange = ((latest[1] - earliest[1]) / earliest[1]) * 100

    // Only report if significant price movement (>10% in 24h)
    if (Math.abs(priceChange) > 10) {
      investments.push({
        asset_name: '$TRUMP Token',
        asset_ticker: 'TRUMP',
        asset_type: 'crypto',
        family_member: 'Donald Trump',
        entity_name: 'Official Trump Meme Coin',
        action: priceChange > 0 ? 'price surge' : 'price drop',
        estimated_amount_usd: latest[1],
        description: `$TRUMP token ${priceChange > 0 ? 'surged' : 'dropped'} ${Math.abs(priceChange).toFixed(1)}% in 24h. Current price: $${latest[1].toFixed(2)}`,
        source_type: 'crypto_onchain',
        source_url: 'https://www.coingecko.com/en/coins/official-trump',
        source_title: `$TRUMP ${priceChange > 0 ? '📈' : '📉'} ${Math.abs(priceChange).toFixed(1)}% in 24h`,
        detected_at: new Date(latest[0]).toISOString(),
      })
    }
  } catch {
    // CoinGecko rate limit or token not found
  }

  return investments
}
