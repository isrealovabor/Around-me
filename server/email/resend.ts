import { Resend } from 'resend'
import type { EmailProvider, EmailMessage } from './types'

export function createResendEmailProvider(config: { apiKey: string; from: string; replyTo?: string }): EmailProvider {
  const client = new Resend(config.apiKey)
  return { async send(message: EmailMessage) {
    const { data, error } = await client.emails.send({ from: config.from, to: message.to, subject: message.subject, html: message.html, text: message.text, replyTo: message.replyTo ?? config.replyTo })
    if (error) throw new Error(`RESEND_${error.name ?? 'SEND_FAILED'}`)
    return { providerMessageId: data?.id }
  } }
}
