import { createFileRoute } from '@tanstack/react-router'
import { loginWithPassword } from '#/auth/responses'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const password = formData.get('password')

        if (typeof password !== 'string') {
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid' },
          })
        }

        return loginWithPassword(password)
      },
    },
  },
})
