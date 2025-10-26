// Minimal AI service stubs to satisfy build. Replace with real implementations
// that call embedding/LLM services when available.

export async function ingestBatch(ids: string[]): Promise<{ id: string; status: string }[]> {
  // Placeholder: pretend we queued/processed each id
  return (ids || []).map((id) => ({ id, status: 'queued' }))
}

export async function queryText(query: string, filters: any): Promise<any[]> {
  // Placeholder: return an empty results array
  return []
}

export default { ingestBatch, queryText }
