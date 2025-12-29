import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createApiClient, ApiClientProvider } from '@packages/ui-logic'
import Header from '../components/Header'
import MatrixBackground from '../components/MatrixBackground'

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

// Create API client - uses relative URL for same-origin API
const apiClient = createApiClient({
  baseUrl: import.meta.env.DEV ? 'http://localhost:8787' : '',
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
        href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Rajdhani:wght@300;400;500;600;700&family=Fira+Code:wght@300..700&display=swap',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col font-['Rajdhani'] antialiased selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)]">
        <MatrixBackground />
        <div className="scanline-overlay" />
        <QueryClientProvider client={queryClient}>
          <ApiClientProvider client={apiClient}>
            <div className="flex-1 flex flex-col relative z-0">
              <Header />
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
