module.exports = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 's.gravatar.com'],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    // Provide sensible fallbacks to satisfy Next config validation
    POSTGRES_USER: process.env.POSTGRES_USER || process.env.PGUSER || '',
    POSTGRES_HOST: process.env.POSTGRES_HOST || process.env.PGHOST || '',
    POSTGRES_DB: process.env.POSTGRES_DB || process.env.PGDATABASE || '',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || '',
    POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
  },
};
