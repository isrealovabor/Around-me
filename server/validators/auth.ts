import { z } from 'zod'

export const registerInput = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(80),
})
export const loginInput = registerInput.pick({ email: true, password: true })
export const resetRequestInput = z.object({ email: z.string().trim().email().max(254).transform(value => value.toLowerCase()) })
export const tokenInput = z.object({ token: z.string().min(32).max(200) })
export const resetPasswordInput = tokenInput.extend({ password: z.string().min(12).max(128) })
