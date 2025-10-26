#!/usr/bin/env node
// Lightweight dry-run that builds the denormalized property document
// without touching DB or external services. Useful to validate the
// doc shape produced by the sync endpoint logic.

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'USD'

const fixtureProperty = {
  id: process.argv[2] || 'prop-fixture-1',
  title: 'Charming test property',
  description: 'A lovely test property used for dry-run validation. Large description to ensure summary works.'.repeat(2),
  price: 350000,
  squareMeters: 110,
  city: 'Testville',
  country: 'Testland',
  state: 'TS',
  zip_code: '12345',
}

const fixtureImages = [
  { id: 'img-1', image_url: 'https://example.com/img-1.jpg', is_cover: true, display_order: 1 },
  { id: 'img-2', image_url: 'https://example.com/img-2.jpg', is_cover: false, display_order: 2 },
]

const fixtureFeatures = [
  { id: 'f1', name: 'Pool' },
  { id: 'f2', name: 'Garage' },
]

function buildDoc(property, images = [], features = []) {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    summary: property.description ? property.description.slice(0, 240) : undefined,
    features: (features || []).map((f) => f.name),
    images: (images || []).map((i) => i.image_url),
    neighborhood: { name: property.city, city: property.city },
    price: property.price,
    price_per_m2:
      property.price && property.squareMeters ? Math.round(property.price / property.squareMeters) : undefined,
    currency: DEFAULT_CURRENCY,
    _raw: { property, images, features },
  }
}

function main() {
  const doc = buildDoc(fixtureProperty, fixtureImages, fixtureFeatures)
  console.log('Dry-run denormalized document:')
  console.log(JSON.stringify(doc, null, 2))
}

main()
