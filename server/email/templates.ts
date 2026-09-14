import type { EmailMessage } from './types'

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!)
function layout(title: string, body: string, ctaLabel?: string, url?: string): Pick<EmailMessage, 'html' | 'text'> {
  const safeTitle = escapeHtml(title)
  const link = url ? `<p style="word-break:break-all;color:#176e50">${escapeHtml(url)}</p>` : ''
  const button = ctaLabel && url ? `<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#176e50;color:#fff;padding:12px 18px;border-radius:7px;text-decoration:none">${escapeHtml(ctaLabel)}</a></p>` : ''
  return { html: `<main style="font-family:Arial,sans-serif;color:#18221e;max-width:560px;margin:auto;padding:24px"><h1 style="color:#173c2c">Around <span style="color:#f36f35">Me</span></h1><h2>${safeTitle}</h2><p>${body}</p>${button}${link}<hr style="border:0;border-top:1px solid #e5e9e5;margin-top:28px"/><p style="font-size:12px;color:#6b786f">Around Me helps neighbours connect safely. Never share your password.</p></main>`, text: `Around Me\n\n${title}\n\n${body}${url ? `\n\n${ctaLabel ?? 'Open link'}: ${url}` : ''}\n\nNever share your password.` }
}
export function verificationEmail(name: string, url: string): EmailMessage { return { to: '', subject: 'Verify your Around Me email', ...layout('Verify your email', `Welcome, ${escapeHtml(name)}. Please verify your email to take part in your community. This link expires in 24 hours. If you did not create an account, you can ignore this email.`, 'Verify email', url) } }
export function passwordResetEmail(url: string): EmailMessage { return { to: '', subject: 'Reset your Around Me password', ...layout('Reset your password', 'We received a request to reset your password. This link expires in one hour. If you did not request this, you can ignore this email.', 'Reset password', url) } }
export function passwordChangedEmail(timestamp: string): EmailMessage { return { to: '', subject: 'Your Around Me password was changed', ...layout('Password changed', `Your Around Me password was changed at approximately ${escapeHtml(timestamp)}. If this was not you, reset your password and contact support immediately.`) } }
export function welcomeEmail(name: string, community?: string): EmailMessage { return { to: '', subject: 'Welcome to Around Me', ...layout('Welcome to Around Me', `You are ready to connect with your neighbours${community ? ` around ${escapeHtml(community)}` : ''}.`) } }
export function securityNoticeEmail(title: string, message: string): EmailMessage { return { to: '', subject: `Around Me security notice: ${title}`, ...layout(title, escapeHtml(message)) } }
export function notificationEmail(title: string, message: string): EmailMessage { return { to: '', subject: `Around Me: ${title}`, ...layout(title, escapeHtml(message)) } }
