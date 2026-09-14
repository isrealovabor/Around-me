import { compare, hash } from 'bcryptjs'

const BCRYPT_COST = 12

export const hashPassword = (password: string) => hash(password, BCRYPT_COST)
export const verifyPassword = (password: string, passwordHash: string) => compare(password, passwordHash)
