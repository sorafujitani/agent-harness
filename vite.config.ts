import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      'memoli:prod-build': {
        command: 'bash scripts/build-memoli-local.sh',
        cache: false,
      },
      'memoli:install-local': {
        command: 'bash scripts/install-memoli-local.sh',
        cache: false,
      },
    },
  },
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
