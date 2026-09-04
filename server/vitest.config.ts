import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    // Each test file gets its own isolated in-memory DB (module registry is fresh per file).
    env: {
      NODE_ENV: 'test',
      DATABASE_PATH: ':memory:',
      SESSION_SECRET: 'test-session-secret-not-for-production-use-only',
      UPLOADS_DIR: './test-uploads',
    },
  },
});
