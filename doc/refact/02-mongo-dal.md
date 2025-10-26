# Step 02 — Mongo read-model DAL & types

Purpose
- Add a small DAL to manage the denormalized `property_documents` collection in Mongo. This enables fast reads for property detail and search without changing the canonical Postgres model.

Actions
1. Add `src/lib/mongo.ts`:
   - Initialize `mongodb` client using `process.env.MONGODB_URI`.
   - Reuse a global variable to avoid reconnects in serverless.
2. Add `src/lib/readModel.ts`:
   - upsertPropertyDocument(propertyId, doc)
   - getPropertyDocument(propertyId)
   - searchPropertyDocuments(filters, { page, pageSize })
3. Add types `src/lib/types.ts` or `src/types/property.d.ts` describing `PropertyDocument`.
4. Add a feature flag env var `USE_MONGO_READMODEL=true` to allow fallback to Postgres.

Files to add/edit
- `src/lib/mongo.ts`
- `src/lib/readModel.ts`
- `src/lib/types.ts`
- `.env.example` (add MONGODB_URI)

Example snippet (mongo.ts)
```ts
import { MongoClient } from 'mongodb'
const uri = process.env.MONGODB_URI
let client: MongoClient
export async function getMongo() {
  if (!client) {
    client = new MongoClient(uri!, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
  }
  return client
}
```

Acceptance criteria
- `readModel.upsertPropertyDocument` works for inserted sample doc.
- Pages can optionally read from `readModel.getPropertyDocument`.