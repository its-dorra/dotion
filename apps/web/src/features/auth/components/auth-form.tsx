import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SignInForm from './sign-in-form'
import SignUpForm from './sign-up-form'
import { SocialAuthButtons } from './social-auth-buttons'
import { m } from '@/paraglide/messages'

export function AuthForm() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="sign-in" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">{m.auth_sign_in()}</TabsTrigger>
          <TabsTrigger value="sign-up">{m.auth_sign_up()}</TabsTrigger>
        </TabsList>

        <TabsContent value="sign-in" className="mt-4">
          <SignInForm />
        </TabsContent>

        <TabsContent value="sign-up" className="mt-4">
          <SignUpForm />
        </TabsContent>
      </Tabs>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-popover px-2 text-muted-foreground">
            {m.auth_or_continue_with()}
          </span>
        </div>
      </div>

      <SocialAuthButtons />
    </div>
  )
}
