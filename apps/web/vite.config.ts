import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import babel from '@rolldown/plugin-babel'
import { sentryCloudflareVitePlugin } from '@sentry/cloudflare/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  server: {
    port: 3002,
  },
  resolve: {
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['cookie', 'url', 'baseLocale'],
      cookieName: 'DOTION_LANG',
      urlPatterns: [
        {
          pattern: '/:path(.*)?',
          localized: [
            ['ar', '/ar/:path(.*)?'],
            ['fr', '/fr/:path(.*)?'],
          ],
        },
      ],
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    sentryCloudflareVitePlugin({
      _experimental: {
        useDiagnosticsChannelInjection: true,
      },
    }),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
})
