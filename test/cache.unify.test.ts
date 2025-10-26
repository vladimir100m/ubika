import { cacheSet, cacheGet, cacheDel, cacheInvalidatePattern } from '../src/lib/cache'
const scripts = require('../scripts/cache-wrapper')

describe('cache parity between server and scripts wrappers', () => {
  const prefix = `test:unify:${Date.now()}`
  it('exposes set/get/del and invalidatePattern and they do not throw', async () => {
    // server set/get
    await cacheSet(`${prefix}:a`, { x: 1 })
    const v1 = await cacheGet(`${prefix}:a`)
    expect(v1).not.toBeNull()

    // scripts set/get
    await scripts.set(`${prefix}:b`, 'ok')
    const v2 = await scripts.get(`${prefix}:b`)
    expect(v2).not.toBeNull()

    // delete operations
    await cacheDel(`${prefix}:a`)
    const afterDel = await cacheGet(`${prefix}:a`)
    expect(afterDel).toBeNull()

    const delResult = await scripts.del(`${prefix}:b`)
    // scripts returns 1 or 0; ensure it executed
    expect(typeof delResult === 'number').toBe(true)

    // invalidate pattern should not throw
    await cacheInvalidatePattern(`${prefix}:*`)
    await scripts.invalidatePattern(`${prefix}:*`)

    // ensure any script-level client is closed to avoid open handles in Jest
    if (scripts && typeof scripts.quit === 'function') {
      try { await scripts.quit() } catch (e) { /* ignore */ }
    }
  })
})
