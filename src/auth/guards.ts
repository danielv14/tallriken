import { redirect } from '@tanstack/react-router'
import { getIsAuthenticated } from '#/auth/server'

export const requireAuth = async () => {
  const isAuthenticated = await getIsAuthenticated()
  if (!isAuthenticated) {
    throw redirect({ to: '/login', search: { error: undefined } })
  }
}

export const requireGuest = async () => {
  const isAuthenticated = await getIsAuthenticated()
  if (isAuthenticated) {
    throw redirect({ to: '/' })
  }
}
