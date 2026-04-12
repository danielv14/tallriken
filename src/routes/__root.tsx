import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { ChatPanel } from '#/chat/chat-panel'
import { ChatToggle } from '#/chat/chat-toggle'
import { useChatStore } from '#/chat/store'
import { RouteError, NotFound } from '#/components/route-error'
import appCss from '../styles.css?url'

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen font-sans text-gray-800 antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

const RootComponent = () => {
  const isOpen = useChatStore((s) => s.isOpen)

  return (
    <>
      <div
        className={`transition-all duration-300 ${isOpen ? 'md:mr-[420px]' : ''}`}
      >
        <Outlet />
      </div>
      <ChatPanel />
      <ChatToggle />
    </>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Tallriken' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍽️</text></svg>', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  errorComponent: ({ error }) => (
    <RouteError message={error.message} />
  ),
  notFoundComponent: () => <NotFound />,
})
