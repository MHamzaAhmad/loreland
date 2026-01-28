import { HeadContent, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createApiClient, ApiClientProvider } from '@packages/ui-logic'
import Header from '../components/Header'

import appCss from '../styles.css?url'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

// Create API client
const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8787' : ''),
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Loreland - Vision Creation & Fantasy Living',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Lora:ital,wght@0,400..700;1,400..700&display=swap',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 space-y-4">
      <h1 className="text-4xl md:text-6xl font-sans text-primary animate-pulse tracking-wide">
        404
      </h1>
      <div className="h-px w-32 bg-primary/20" />
      <p className="text-xl text-primary/60 uppercase tracking-wide">
        Page Not Found
      </p>
      <p className="text-muted-foreground text-sm max-w-md">
        The page you are looking for does not exist.
      </p>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  // Check if we are in an active game session (immersive mode)
  // Path format: /games/$id/play/$sessionId
  // We want to exclude /games/$id/play (the list)
  const isImmersiveMode = /\/games\/[^/]+\/play\/.+/.test(location.pathname)

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col font-['DM_Sans'] antialiased">
        <QueryClientProvider client={queryClient}>
          <ApiClientProvider client={apiClient}>
            <div className="flex-1 flex flex-col relative z-0">
              {!isImmersiveMode && <Header />}
              <main className="flex-1 relative">
                {children}
              </main>
            </div>
          </ApiClientProvider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
