"use client"
import React, { useState } from 'react'

export default function AdminPage() {
  const [propertyId, setPropertyId] = useState('')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function triggerSync(e?: React.FormEvent) {
    e?.preventDefault()
    if (!propertyId) return setMessage('Property ID required')
    const ok = window.confirm(`Trigger sync for property ${propertyId}?`)
    if (!ok) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sync-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret || '',
        },
        body: JSON.stringify({ propertyId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'sync failed')
      setMessage('Sync successful')
    } catch (err: any) {
      setMessage(`Error: ${err?.message || 'Unknown'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin — Sync Property</h1>
      <form onSubmit={triggerSync}>
        <div style={{ marginBottom: 8 }}>
          <label>Property ID</label>
          <br />
          <input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} style={{ width: 300, padding: 8 }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Admin Secret (paste to authorize)</label>
          <br />
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} style={{ width: 300, padding: 8 }} />
        </div>

        <button type="submit" disabled={loading}> {loading ? 'Running…' : 'Trigger Sync'}</button>
      </form>

      {message && <div style={{ marginTop: 16 }}>{message}</div>}
    </main>
  )
}
