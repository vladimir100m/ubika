import { NextRequest, NextResponse } from 'next/server'
import { validateEnv } from '../../../lib/envChecks'

// Fail fast when critical env vars are misconfigured
validateEnv()

import { query } from '../../../lib/db'
import { upsertPropertyDocument } from '../../../lib/readModel'
import { resolveImageUrl } from '../../../lib/blob'
import { cacheDel, cacheInvalidatePattern } from '../../../lib/cache'
import { getPropertyInvalidationPatterns, CACHE_KEYS } from '../../../lib/cacheKeyBuilder'
import { rateLimit } from '../../../lib/ratelimit'
import { createRequestId, createLogger } from '../../../lib/logger'
import { buildAndUpsertTyped } from '../../../lib/syncPropertyTyped'

// Protected endpoint to sync a canonical property into the Mongo read-model
export async function POST(req: NextRequest) {
  const reqId = createRequestId('sync-')
  const log = createLogger(reqId)

  try {
    const secret = req.headers.get('x-admin-secret') || ''
    const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
    if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
      log.warn('Unauthorized sync attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // basic rate limit by remote address header (best-effort)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const allowed = await rateLimit(`sync:${ip}`, 30, 60)
    if (!allowed) {
      log.warn('Rate limit exceeded', { ip })
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await req.json()
    const propertyId = body?.propertyId || body?.id
    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    // Fetch canonical property
    const propertyQuery = `
      SELECT 
        p.id, p.title, p.description, p.price, p.address, p.city, p.state, p.country, 
        p.zip_code, p.type, p.room as rooms, p.bathrooms, p.square_meters as "squareMeters",
        p.status, p.created_at, p.updated_at, p.year_built as yearBuilt, 
        p.geocode, p.seller_id, p.operation_status_id
      FROM properties p
      WHERE p.id = $1
    `

    const result = await query(propertyQuery, [propertyId])
    if (!result || result.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const property = result.rows[0]

    // Fetch images
    let images = [] as any[]
    try {
      const imagesResult = await query(
        'SELECT id, property_id, image_url, is_cover, display_order FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC, display_order ASC',
        [property.id]
      )
      images = imagesResult.rows || []
      // Resolve image URLs using existing helper (may throw)
      for (const img of images) {
        try {
          img.image_url = await resolveImageUrl(img.image_url)
        } catch (e) {
          // leave original if resolution fails
          log.warn('resolveImageUrl failed', { image: img.id, error: e })
        }
      }
    } catch (e) {
      log.warn('Failed to fetch images', e)
      images = []
    }

    // Fetch features
    let features = [] as any[]
    try {
      const feats = await query('SELECT f.id, f.name FROM property_features f JOIN property_feature_assignments a ON a.feature_id = f.id WHERE a.property_id = $1', [property.id])
      features = feats.rows || []
    } catch (e) {
      log.warn('Failed to fetch features', e)
      features = []
    }

    // Build denormalized doc, upsert and invalidate cache via shared helper
    try {
      await buildAndUpsertTyped({
        property,
        images,
        features,
        resolveImageUrl,
        upsertPropertyDocument,
        cacheDel,
        cacheInvalidatePattern,
        CACHE_KEYS,
        getPropertyInvalidationPatterns,
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
      })
      log.info('Upserted property document (via helper)', { propertyId: property.id })
    } catch (e) {
      log.error('Failed to upsert property document', e)
      return NextResponse.json({ error: 'Failed to upsert read-model' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Unexpected error
    console.error('sync-property error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
