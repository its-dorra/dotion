import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'

import logo from '@/assets/logo.png?url'
import appCss from '../styles.css?url'
import { QueryClient } from '@tanstack/react-query'
import { getAuthClient } from '@/lib/auth-client'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/common/theme-provider'
import { DocumentBackgroundProvider } from '@/components/common/document-background-provider'
import { getLocale, getTextDirection } from '@/paraglide/runtime'
import { TooltipProvider } from '@/components/ui/tooltip'
import { authQueryOptions } from '@/features/auth/query-options'
import { AuthPopoverProvider } from '@/features/auth/hooks/use-auth-popover'
import { PwaManager } from '@/components/pwa/pwa-manager'
import { DirectionProvider } from '@/components/ui/direction'

export interface RouterAppContext {
  queryClient: QueryClient
  authClient: ReturnType<typeof getAuthClient>
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
      },
      {
        title: 'Dotion',
      },
      {
        name: 'description',
        content: 'Connected workspace for notes, docs, and collaboration',
      },
      {
        name: 'theme-color',
        content: '#ffffff',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#09090b',
        media: '(prefers-color-scheme: dark)',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Dotion',
      },
      {
        name: 'application-name',
        content: 'Dotion',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: logo,
      },
      {
        rel: 'manifest',
        href: '/manifest.webmanifest',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon-180x180.png',
      },
    ],
  }),
  beforeLoad: async ({ context: { queryClient, authClient } }) => {
    try {
      await queryClient.ensureQueryData(authQueryOptions(authClient))
    } catch (e) {
      console.error({ e })
    }
  },
  component: RootDocument,
})

function RootDocument() {
  const locale = getLocale()
  const dir = getTextDirection()

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="light" storageKey="theme">
          <DocumentBackgroundProvider>
            <DirectionProvider dir={dir}>
              <TooltipProvider>
                <AuthPopoverProvider>
                  <Outlet />
                </AuthPopoverProvider>
              </TooltipProvider>
            </DirectionProvider>
          </DocumentBackgroundProvider>
        </ThemeProvider>
        <Toaster richColors />
        <PwaManager />
        <TanStackDevtools
          plugins={[
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            formDevtoolsPlugin(),
          ]}
          config={{
            position: 'bottom-left',
            hideUntilHover: true,
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}
