// Standalone from vite.config.ts on purpose: that file requires PORT/BASE_PATH
// env vars (dev-server concerns) that have nothing to do with running tests.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // pure game-logic tests only — no DOM needed
    include: ['src/**/*.test.ts'],
  },
});
