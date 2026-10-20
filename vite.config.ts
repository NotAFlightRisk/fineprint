import { sentryVitePlugin } from '@sentry/vite-plugin';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const plausible = process.env.PUBLIC_PLAUSIBLE_SCRIPT ?? '';
const pulse = plausible ? [new URL(plausible).origin as `${string}.${string}`] : [];
const sentry = process.env.PUBLIC_SENTRY_DSN ?? '';
const oops = sentry ? [new URL(sentry).origin as `${string}.${string}`] : [];
const uploadMaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_URL);

export default defineConfig({
  define: {
    'import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT': JSON.stringify(plausible),
    'import.meta.env.PUBLIC_SENTRY_DSN': JSON.stringify(sentry)
  },
  build: {
    sourcemap: uploadMaps && 'hidden',
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined)
  },
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      adapter: adapter({ fallback: '404.html' }),
      prerender: {
        entries: [
          '*',
          '/api/providers.json',
          '/api/criteria.json',
          '/schema/provider.json',
          '/sitemap.xml',
          '/llms.txt',
          '/logo.png'
        ]
      },
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'script-src': ['self', ...pulse],
          'connect-src': ['self', ...pulse, ...oops],
          'img-src': ['self', 'data:'],
          'style-src': ['self', 'unsafe-inline'],
          'font-src': ['self'],
          'base-uri': ['none'],
          'form-action': ['none'],
          'frame-ancestors': ['none']
        }
      }
    }),
    uploadMaps &&
      sentryVitePlugin({
        telemetry: false,
        release: { create: false, finalize: false, setCommits: false, deploy: false },
        bundleSizeOptimizations: { excludeDebugStatements: true, excludeTracing: true },
        sourcemaps: {
          assets: '.svelte-kit/output/client/**',
          filesToDeleteAfterUpload: '.svelte-kit/output/**/*.map'
        }
      })
  ],
  test: {
    include: ['tests/**/*.test.ts']
  }
});
