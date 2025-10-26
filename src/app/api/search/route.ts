import { NextRequest, NextResponse } from 'next/server'
import { validateEnv } from '../../../lib/envChecks'
validateEnv()

import { searchCached } from '../../../lib/searchService'
import { createRequestId, createLogger } from '../../../lib/logger'

export async function GET(req: NextRequest) {
  const reqId = createRequestId('search-')
  const log = createLogger(reqId)

  try {
    const url = req.nextUrl
    const q = url.searchParams.get('q') || undefined
    const city = url.searchParams.get('city') || undefined
    const priceMin = url.searchParams.get('priceMin') ? Number(url.searchParams.get('priceMin')) : undefined
    const priceMax = url.searchParams.get('priceMax') ? Number(url.searchParams.get('priceMax')) : undefined
    const page = url.searchParams.get('page') ? Math.max(1, Number(url.searchParams.get('page'))) : 1
    const pageSize = url.searchParams.get('pageSize') ? Math.min(100, Number(url.searchParams.get('pageSize'))) : 20

    const filters = { q, city, priceMin, priceMax }
    const res = await searchCached(filters, page, pageSize)
    return NextResponse.json(res)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('search route error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
