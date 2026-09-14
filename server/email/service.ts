import { prisma } from '../lib/prisma'
import { verificationEmail, passwordResetEmail, passwordChangedEmail, welcomeEmail, securityNoticeEmail, notificationEmail } from './templates'
import type { EmailProvider, TransactionalEmailType } from './types'

const maskEmail = (email: string) => { const [local, domain] = email.split('@'); return `${local.slice(0, 2)}***@${domain}` }

export class TransactionalEmailService {
  constructor(private readonly provider: EmailProvider) {}
  private async deliver(type: TransactionalEmailType, userId: string, recipient: string, message: ReturnType<typeof verificationEmail>) {
    try {
      const result = await this.provider.send({ ...message, to: recipient })
      await prisma.emailDelivery.create({ data: { type, userId, recipient, status: 'SENT', providerMessageId: result.providerMessageId } })
      console.info(JSON.stringify({ event: 'transactional_email_sent', type, recipient: maskEmail(recipient), providerMessageId: result.providerMessageId }))
      return true
    } catch (error) {
      const failureCode = error instanceof Error ? error.message.slice(0, 100) : 'EMAIL_SEND_FAILED'
      await prisma.emailDelivery.create({ data: { type, userId, recipient, status: 'FAILED', failureCode } })
      console.warn(JSON.stringify({ event: 'transactional_email_failed', type, recipient: maskEmail(recipient), failureCode }))
      return false
    }
  }
  sendEmailVerification(user: { id: string; email: string; name: string }, url: string) { return this.deliver('EMAIL_VERIFICATION', user.id, user.email, verificationEmail(user.name, url)) }
  sendPasswordReset(user: { id: string; email: string }, url: string) { return this.deliver('PASSWORD_RESET', user.id, user.email, passwordResetEmail(url)) }
  sendPasswordChangedNotice(user: { id: string; email: string }, timestamp: string) { return this.deliver('PASSWORD_CHANGED', user.id, user.email, passwordChangedEmail(timestamp)) }
  sendWelcomeEmail(user: { id: string; email: string; name: string }, community?: string) { return this.deliver('WELCOME', user.id, user.email, welcomeEmail(user.name, community)) }
  sendSecurityNotice(user: { id: string; email: string }, title: string, message: string) { return this.deliver('SECURITY_NOTICE', user.id, user.email, securityNoticeEmail(title, message)) }
  sendNotification(user: { id: string; email: string }, title: string, message: string) { return this.deliver('NOTIFICATION', user.id, user.email, notificationEmail(title, message)) }
}
