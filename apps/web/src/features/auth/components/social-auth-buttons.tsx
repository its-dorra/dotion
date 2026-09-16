import { FaGithub as Github } from 'react-icons/fa'
import { FcGoogle as Google } from 'react-icons/fc'
import { Button } from '@/components/ui/button'
import { useSignIn } from '../hooks/use-sign-in'
import { m } from '@/paraglide/messages'

export function SocialAuthButtons() {
  const signInMutation = useSignIn()

  function handleSocialSignIn(provider: 'github' | 'google') {
    return signInMutation.mutateAsync({
      method: 'social',
      data: {
        provider,
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => handleSocialSignIn('github')}
        disabled={signInMutation.isPending}
        type="button"
        variant="outline"
        className="w-full gap-2"
      >
        <Github className="size-4" />
        {m.auth_continue_github()}
      </Button>

      <Button
        onClick={() => handleSocialSignIn('google')}
        disabled={signInMutation.isPending}
        type="button"
        variant="outline"
        className="w-full gap-2"
      >
        <Google className="size-4" />
        {m.auth_continue_google()}
      </Button>

      {signInMutation.isError && (
        <div className="text-sm text-red-500">
          {signInMutation.error instanceof Error
            ? signInMutation.error.message
            : 'An unknown error occurred'}
        </div>
      )}
    </div>
  )
}
