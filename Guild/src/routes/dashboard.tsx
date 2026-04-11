import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../store/authStore'
import Dashboard from '../pages/Dashboard'

export const Route = createFileRoute('/dashboard')({
  // Logic: Check the store before the route loads
  beforeLoad: () => {
    const token = useAuthStore.getState().token

    if (!token) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: Dashboard
})