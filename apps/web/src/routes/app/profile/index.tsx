import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '@/features/auth/components/profile'
import { ProfileLoading } from '@/features/auth/components/profile-loading'
import { authQueryOptions } from '@/features/auth/query-options'

export const Route = createFileRoute('/app/profile/')({
  loader: async ({ context: { queryClient, authClient } }) => {
    await queryClient.ensureQueryData(authQueryOptions(authClient))
  },
  component: ProfilePage,
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
