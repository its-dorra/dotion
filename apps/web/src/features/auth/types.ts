import { createAuthClient } from 'better-auth/react'
import z from 'zod'
import type { SignInSchema, SignUpSchema } from './schema'

export type User = ReturnType<
  typeof createAuthClient
>['$Infer']['Session']['user']

export type SignInSchemaType = z.infer<typeof SignInSchema>
export type SignUpSchemaType = z.infer<typeof SignUpSchema>

export type AuthClient = ReturnType<typeof createAuthClient>
