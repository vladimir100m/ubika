module.exports = {
  experimental: {
    allowedDevOrigins: [
      'http://localhost:3000',
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
};