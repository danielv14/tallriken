import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getIsAuthenticated } from '#/auth/server'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const isAuthenticated = await getIsAuthenticated()
    if (!isAuthenticated) {
      throw redirect({ to: '/login', search: { error: undefined } })
    }
  },
  component: () => <Outlet />,
})
