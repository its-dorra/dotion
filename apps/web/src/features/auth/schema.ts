import z from 'zod'

export const SignInSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().check(
    z.minLength(8, {
      message: 'Password must be at least 8 characters long',
    }),
  ),
})

export const SignUpSchema = z
  .object({
    email: z.email({ message: 'Invalid email address' }),
    name: z.string().min(1, { message: 'Name is required' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
