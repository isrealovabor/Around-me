import { Hono } from 'hono'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import type { ServerEnv } from '../config/env'
import { readSessionToken } from '../auth/session'
import { requireActiveUser, requireOwnership } from '../auth/authorization'
import { ApiError } from '../lib/errors'

async function principal(context: Context, env: ServerEnv) { const token = getCookie(context, 'around_me_session'); if (!token) throw new ApiError(401, 'Please sign in to continue', 'UNAUTHENTICATED'); try { return requireActiveUser(await readSessionToken(token, env.AUTH_SESSION_SECRET)) } catch { throw new ApiError(401, 'Please sign in to continue', 'UNAUTHENTICATED') } }
const eventInput = z.object({ communityId: z.string(), title: z.string().min(2).max(160), description: z.string().min(2).max(5000), category: z.string().min(2).max(50), venueName: z.string().max(120).optional(), locationLabel: z.string().max(120).optional(), startAt: z.coerce.date(), endAt: z.coerce.date().optional() })

export function createCommunityRoutes(dependencies: { env: ServerEnv }) {
  const app = new Hono()
  app.get('/:slug', async context => { const community = await prisma.community.findUnique({ where: { slug: context.req.param('slug') }, include: { location: { include: { parent: true } }, _count: { select: { memberships: true, followers: true, posts: true, events: true, businesses: true } } } }); if (!community) throw new ApiError(404, 'Community not found', 'NOT_FOUND'); return context.json({ community }) })
  app.post('/:id/follow', async context => { const user = await principal(context, dependencies.env); await prisma.communityFollow.upsert({ where: { userId_communityId: { userId: user.userId, communityId: context.req.param('id') } }, create: { userId: user.userId, communityId: context.req.param('id') }, update: {} }); return context.json({ status: 'following' }) })
  app.delete('/:id/follow', async context => { const user = await principal(context, dependencies.env); await prisma.communityFollow.deleteMany({ where: { userId: user.userId, communityId: context.req.param('id') } }); return context.body(null, 204) })
  app.get('/me/following', async context => { const user = await principal(context, dependencies.env); return context.json({ communities: await prisma.communityFollow.findMany({ where: { userId: user.userId }, include: { community: { include: { location: true } } }, orderBy: { createdAt: 'desc' } }) }) })
  app.post('/events', async context => { const user = await principal(context, dependencies.env); const input = eventInput.parse(await context.req.json()); const event = await prisma.localEvent.create({ data: { ...input, organizerId: user.userId, latitudeApprox: undefined, longitudeApprox: undefined } }); return context.json({ event }, 201) })
  app.put('/events/:id/attendance', async context => { const user = await principal(context, dependencies.env); const status = z.enum(['INTERESTED', 'GOING']).parse((await context.req.json()).status); const attendance = await prisma.eventAttendance.upsert({ where: { eventId_userId: { eventId: context.req.param('id'), userId: user.userId } }, create: { eventId: context.req.param('id'), userId: user.userId, status }, update: { status } }); return context.json({ attendance }) })
  app.patch('/events/:id', async context => { const user = await principal(context, dependencies.env); const event = await prisma.localEvent.findUnique({ where: { id: context.req.param('id') } }); if (!event) throw new ApiError(404, 'Event not found', 'NOT_FOUND'); requireOwnership(user, event.organizerId); const updated = await prisma.localEvent.update({ where: { id: event.id }, data: eventInput.partial().omit({ communityId: true }).parse(await context.req.json()) }); return context.json({ event: updated }) })
  app.post('/businesses/:id/claim', async context => { const user = await principal(context, dependencies.env); const claim = await prisma.businessClaim.upsert({ where: { businessId_userId: { businessId: context.req.param('id'), userId: user.userId } }, create: { businessId: context.req.param('id'), userId: user.userId }, update: {} }); return context.json({ claim, status: 'pending_review' }, 201) })
  app.get('/search/local', async context => { const query = (context.req.query('q') ?? '').trim(); if (!query) return context.json({ communities: [], events: [], businesses: [] }); const [communities, events, businesses] = await Promise.all([prisma.community.findMany({ where: { name: { contains: query, mode: 'insensitive' } }, take: 10 }), prisma.localEvent.findMany({ where: { title: { contains: query, mode: 'insensitive' }, status: 'ACTIVE' }, take: 10, orderBy: { startAt: 'asc' } }), prisma.business.findMany({ where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }], isActive: true }, take: 10 })]); return context.json({ communities, events, businesses }) })
  return app
}
