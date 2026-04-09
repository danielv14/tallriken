import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuth } from '#/auth/guards'

export const Route = createFileRoute('/_authed')({
  beforeLoad: requireAuth,
  component: () => <Outlet />,
})
