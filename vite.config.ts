import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    plugins: ['typescript'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ['agents/**', 'runtimes/node/**', 'scripts/**'],
        env: {
          node: true,
        },
      },
      {
        files: ['**/*.test.ts'],
        plugins: ['typescript', 'vitest'],
      },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: true,
  },
  test: {
    include: ['agents/**/*.test.ts', 'packages/**/*.test.ts', 'runtimes/**/*.test.ts'],
  },
});
