#!/usr/bin/env node
/*
  Preview smoke tester
  Usage:
    PREVIEW_URL="https://preview-xxxx.vercel.app" ADMIN_SECRET=... SMOKE_PROPERTY_ID=... node scripts/preview-smoke.js

  This script performs the minimal smoke checks:
    - GET /api/search -> 200 and JSON
    - POST /api/sync-property with x-admin-secret -> 200
    - GET /api/search again -> 200

  Exit code 0 on success (critical checks), non-zero on failure.
*/

const { URL } = require('url')

const PREVIEW_URL = process.env.PREVIEW_URL || process.argv[2] || 'http://localhost:3000'
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_SECRET || process.env.ADMIN_SECRET || process.env.ADMIN_SECRET
const SMOKE_PROPERTY_ID = process.env.SMOKE_PROPERTY_ID || 'preview-smoke-prop-1'

const TIMEOUT_MS = 10000

function log(...args) { console.log('[smoke]', ...args) }
function error(...args) { console.error('[smoke][ERROR]', ...args) }

async function fetchWithTimeout(path, opts = {}) {
  const url = PREVIEW_URL.replace(/\/$/, '') + path
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

async function run() {
  log('Preview URL:', PREVIEW_URL)

  // 1) GET /api/search
  let firstTotal = null
  try {
    log('GET /api/search')
    const res = await fetchWithTimeout('/api/search?q=&page=1&pageSize=1')
    if (res.status !== 200) {
      error('/api/search responded', res.status)
      process.exit(2)
    }
    const body = await res.json()
    if (!body || typeof body !== 'object') {
      error('/api/search returned invalid JSON')
      process.exit(3)
    }
    firstTotal = typeof body.total === 'number' ? body.total : (Array.isArray(body.results) ? body.results.length : null)
    log('/api/search OK — total=', firstTotal)
  } catch (e) {
    error('GET /api/search failed:', e && e.message)
    process.exit(4)
  }

  // 2) POST /api/sync-property
  try {
    if (!ADMIN_SECRET) log('WARNING: ADMIN_SECRET not provided; skipping sync POST (set ADMIN_SECRET to test)')
    else {
      log('POST /api/sync-property {propertyId:', SMOKE_PROPERTY_ID, '}')
      const res = await fetchWithTimeout('/api/sync-property', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify({ propertyId: SMOKE_PROPERTY_ID }),
      })
      if (res.status !== 200) {
        error('/api/sync-property responded', res.status)
        const txt = await res.text().catch(() => '')
        error('body:', txt)
        process.exit(5)
      }
      const txt = await res.text().catch(() => '')
      log('/api/sync-property OK — body:', txt)
    }
  } catch (e) {
    error('POST /api/sync-property failed:', e && e.message)
    process.exit(6)
  }

  // 3) GET /api/search again
  try {
    log('GET /api/search (after sync)')
    const res2 = await fetchWithTimeout('/api/search?q=&page=1&pageSize=5')
    if (res2.status !== 200) {
      error('/api/search (after sync) responded', res2.status)
      process.exit(7)
    }
    const body2 = await res2.json()
    const total2 = typeof body2.total === 'number' ? body2.total : (Array.isArray(body2.results) ? body2.results.length : null)
    log('/api/search OK — total(after)=', total2)

    if (firstTotal === 0 && total2 > 0) {
      log('Cache invalidation visible: search gained results after sync')
    } else if (firstTotal !== null) {
      log('Search total before=', firstTotal, 'after=', total2)
    }
  } catch (e) {
    error('GET /api/search (after sync) failed:', e && e.message)
    process.exit(8)
  }

  log('SMOKE COMPLETE — critical checks passed')
  process.exit(0)
}

run().catch((err) => {
  error('smoke script error', err && err.message)
  process.exit(9)
})
