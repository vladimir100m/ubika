#!/usr/bin/env bash
set -euo pipefail
# Create an Atlas Search (FTS) index programmatically.
# Requires: ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, ATLAS_PROJECT_ID as env vars.
# Usage: ATLAS_PUBLIC_KEY=... ATLAS_PRIVATE_KEY=... ATLAS_PROJECT_ID=... VECTOR_DIM=1536 ./scripts/create_atlas_index.sh

PROJECT_ID=${ATLAS_PROJECT_ID:-}
if [ -z "$PROJECT_ID" ]; then
  echo "Set ATLAS_PROJECT_ID environment variable"
  exit 2
fi

PUBLIC=${ATLAS_PUBLIC_KEY:-}
PRIVATE=${ATLAS_PRIVATE_KEY:-}
if [ -z "$PUBLIC" ] || [ -z "$PRIVATE" ]; then
  echo "Set ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY environment variables"
  exit 2
fi

VECTOR_DIM=${VECTOR_DIM:-1536}

read -r -d '' PAYLOAD <<EOF || true
{
  "collectionName": "property_embeddings",
  "database": "ubika",
  "name": "property_embeddings_search",
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": { "type": "knnVector", "dimensions": ${VECTOR_DIM}, "similarity": "cosine" },
      "propertyId": { "type": "string" },
      "content": { "type": "string" },
      "chunkIndex": { "type": "int" },
      "createdAt": { "type": "date" }
    }
  }
}
EOF

echo "Creating Atlas FTS index (project: $PROJECT_ID) with dimensions=$VECTOR_DIM"

curl -s -u "$PUBLIC:$PRIVATE" \
  -X POST "https://cloud.mongodb.com/api/atlas/v1.0/groups/$PROJECT_ID/fts/indexes" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .

echo "Request submitted. Check Atlas UI for index build status (may take a minute)."
