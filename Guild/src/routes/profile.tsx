/* routes/profile.tsx */
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../store/authStore'
import Profile from '../pages/Profile'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    // Access the token directly from the store state
    const token = useAuthStore.getState().token

    if (!token) {
      throw redirect({
        to: '/'
      })
    }
  },
  component: Profile
})