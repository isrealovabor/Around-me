export type TransactionalEmailType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED' | 'WELCOME' | 'SECURITY_NOTICE' | 'NOTIFICATION'
export type EmailMessage = { to: string; subject: string; html: string; text: string; replyTo?: string }
export type EmailSendResult = { providerMessageId?: string }
export interface EmailProvider { send(message: EmailMessage): Promise<EmailSendResult> }
