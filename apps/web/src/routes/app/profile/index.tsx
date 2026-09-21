import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Profile } from '@/features/auth/components/profile'
import { ProfileLoading } from '@/features/auth/components/profile-loading'
import { authQueryOptions } from '@/features/auth/query-options'
import { ProfileError } from '@/features/auth/components/profile-error'
import { ProfileNotFound } from '@/features/auth/components/profile-not-found'
import { AuthenticationError, NotFoundError } from '@/lib/errors'

export const Route = createFileRoute('/app/profile/')({
  loader: async ({ context: { queryClient, authClient } }) => {
    try {
      await queryClient.query(authQueryOptions(authClient))
    } catch (error) {
      if (AuthenticationError.is(error) || NotFoundError.is(error)) {
        throw notFound()
      }
      throw error
    }
  },
  component: ProfilePage,
  errorComponent: ProfileError,
  notFoundComponent: ProfileNotFound,
})

function ProfilePage() {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<ProfileLoading />}>
        <Profile />
      </Suspense>
    </div>
  )
}
