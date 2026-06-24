import { defineConfig } from 'vite-plus';
import type { UserConfig as ViteConfig } from 'vite';

const assetGraphBuildConfig = {
  build: {
    chunkImportMap: true,
  },
  html: {
    additionalAssetSources: {
      img: {
        srcAttributes: ['data-src'],
        srcsetAttributes: ['data-srcset'],
      },
      source: {
        srcsetAttributes: ['data-srcset'],
      },
    },
  },
} satisfies Pick<ViteConfig, 'build' | 'html'>;
const untypedAssetGraphBuildConfig: Record<string, unknown> = assetGraphBuildConfig;

export default defineConfig(({ command, mode }) => ({
  ...(command === 'build' ? untypedAssetGraphBuildConfig : {}),
  ...(command === 'serve' && mode !== 'test'
    ? {
        ...untypedAssetGraphBuildConfig,
        experimental: {
          bundledDev: true,
        },
      }
    : {}),
  css: {
    transformer: 'lightningcss',
  },
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
}));
