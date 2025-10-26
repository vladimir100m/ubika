"use client"
import React, { useState } from 'react'

type SearchResult = {
  id: string
  title?: string
  [key: string]: any
}

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState<number | null>(null)

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    setResults([])
    try {
      const params = new URLSearchParams()
      params.set('q', q)
      params.set('page', '1')
      params.set('pageSize', '20')
      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const data = await res.json()
      setResults(Array.isArray(data.results) ? data.results : [])
      setTotal(typeof data.total === 'number' ? data.total : null)
    } catch (err: any) {
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Search properties</h1>
      <form onSubmit={runSearch} style={{ marginBottom: 16 }}>
        <input
          aria-label="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by city, title, or id"
          style={{ padding: 8, width: '60%', marginRight: 8 }}
        />
        <button type="submit" disabled={loading || q.trim() === ''}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {!loading && results.length === 0 && q && !error && (
        <div>No results</div>
      )}

      {total !== null && (
        <div style={{ marginBottom: 8 }}>Results: {total}</div>
      )}

      <ul>
        {results.map((r) => (
          <li key={r.id || JSON.stringify(r)} style={{ marginBottom: 8 }}>
            <strong>{r.title || r.id}</strong>
            <div style={{ fontSize: 12, color: '#444' }}>{JSON.stringify(r)}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
