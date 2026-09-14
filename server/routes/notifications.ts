import { Hono } from 'hono'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { z } from 'zod'
import type { ServerEnv } from '../config/env'
import { readSessionToken } from '../auth/session'
import { requireActiveUser } from '../auth/authorization'
import { ApiError } from '../lib/errors'
import type { NotificationService } from '../notifications/service'

const preferenceInput = z.object({ emailEnabled: z.boolean().optional(), repliesCommentsEnabled: z.boolean().optional(), mentionsEnabled: z.boolean().optional(), localAlertsEnabled: z.boolean().optional(), eventRemindersEnabled: z.boolean().optional(), communityUpdatesEnabled: z.boolean().optional(), marketingEnabled: z.boolean().optional(), pushEnabled: z.boolean().optional() })

async function currentUserId(context: Context, env: ServerEnv) {
  const token = getCookie(context, 'around_me_session')
  if (!token) throw new ApiError(401, 'Please sign in to view notifications', 'UNAUTHENTICATED')
  try { return requireActiveUser(await readSessionToken(token, env.AUTH_SESSION_SECRET)).userId } catch { throw new ApiError(401, 'Please sign in to view notifications', 'UNAUTHENTICATED') }
}

export function createNotificationRoutes(dependencies: { env: ServerEnv; notifications: NotificationService }) {
  const app = new Hono()
  app.get('/', async context => context.json({ notifications: await dependencies.notifications.listForUser(await currentUserId(context, dependencies.env)) }))
  app.get('/unread-count', async context => context.json({ count: await dependencies.notifications.unreadCount(await currentUserId(context, dependencies.env)) }))
  app.patch('/:id/read', async context => {
    const updated = await dependencies.notifications.markRead(await currentUserId(context, dependencies.env), context.req.param('id'))
    if (!updated.count) throw new ApiError(404, 'Notification not found', 'NOT_FOUND')
    return context.json({ status: 'read' })
  })
  app.post('/read-all', async context => context.json({ updated: (await dependencies.notifications.markAllRead(await currentUserId(context, dependencies.env))).count }))
  app.get('/preferences', async context => context.json({ preferences: await dependencies.notifications.preferences(await currentUserId(context, dependencies.env)) }))
  app.patch('/preferences', async context => context.json({ preferences: await dependencies.notifications.updatePreferences(await currentUserId(context, dependencies.env), preferenceInput.parse(await context.req.json())) }))
  return app
}
