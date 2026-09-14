# Transactional email

Around Me uses Resend for transactional email only. The server constructs one `EmailProvider` and uses it through `TransactionalEmailService`; no React component or browser bundle imports the Resend SDK.

## Configuration

Set these server-only values in the deployment secret manager (and local ignored `.env`):

```dotenv
RESEND_API_KEY=...
EMAIL_FROM="Around Me <sender@verified-domain.example>"
EMAIL_REPLY_TO=support@verified-domain.example
APP_URL=https://app.example
```

`EMAIL_FROM` must be an address Resend permits for the account. Before production, verify an Around Me sending domain in Resend and publish exactly the DNS records Resend displays for that domain. Do not invent DNS records. The development `onboarding@resend.dev` sender is only appropriate where Resend permits it.

## Flows and security

- Verification links expire after 24 hours; raw tokens are cryptographically random and only SHA-256 hashes are stored.
- Password-reset links expire after one hour; they are single-use and hashed at rest.
- Resend-verification, registration, password-reset requests, and reset attempts are rate limited.
- Forgot-password and resend-verification endpoints provide neutral responses to prevent account enumeration.
- Password changes trigger a security email without including the password.
- HTML emails include a plain-text alternative. Delivery records contain type, status, provider ID, and safe failure codes. Logs mask recipient addresses and never include tokens, passwords, or API keys.

## Production checklist

- Verify the production sending domain in Resend and configure `EMAIL_FROM`.
- Set an HTTPS `APP_URL`; links always derive from this trusted value.
- Store `RESEND_API_KEY` only in server secret management; never use a `VITE_` prefix.
- Replace the in-memory rate-limit store with a shared store before multi-instance production deployment.
- Review the email-delivery audit table retention policy.
