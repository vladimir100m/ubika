module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/test/**/*.test.js', '**/test/**/*.test.ts'],
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
}
