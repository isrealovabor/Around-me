import { Hono } from 'hono'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import type { ServerEnv } from '../config/env'
import { readSessionToken } from '../auth/session'
import { requireActiveUser } from '../auth/authorization'
import { ApiError, forbidden } from '../lib/errors'
import type { NotificationService } from '../notifications/service'
import type { BackgroundJobQueue } from '../jobs/job-queue'
import { trendingScore } from '../content/ranking'

const category = z.enum(['GENERAL', 'QUESTION', 'SAFETY', 'TRAFFIC', 'EMERGENCY', 'LOST_FOUND', 'MARKETPLACE', 'SERVICES', 'EVENTS', 'JOBS', 'LOCAL_ISSUES'])
const postInput = z.object({ body: z.string().trim().min(1).max(5_000), communityId: z.string().min(1), category: category.default('GENERAL'), visibility: z.enum(['COMMUNITY', 'NEARBY', 'NIGERIA']).default('COMMUNITY'), locationLabel: z.string().trim().max(120).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), imageObjectKeys: z.array(z.string().min(1).max(300)).max(4).default([]) }).refine(value => (value.latitude === undefined) === (value.longitude === undefined), 'Location coordinates must be supplied together')
const commentInput = z.object({ body: z.string().trim().min(1).max(2_000), parentId: z.string().optional() })
const reportInput = z.object({ reason: z.enum(['SPAM', 'HARASSMENT', 'MISINFORMATION', 'SCAM', 'UNSAFE_CONTENT', 'DUPLICATE', 'OTHER']), details: z.string().trim().max(1_000).optional() })
const reaction = z.enum(['LIKE', 'HELPFUL', 'THANKS'])

async function principal(context: Context, env: ServerEnv) { const token = getCookie(context, 'around_me_session'); if (!token) throw new ApiError(401, 'Please sign in to continue', 'UNAUTHENTICATED'); try { return requireActiveUser(await readSessionToken(token, env.AUTH_SESSION_SECRET)) } catch { throw new ApiError(401, 'Please sign in to continue', 'UNAUTHENTICATED') } }
const publicPost = { author: { select: { id: true, name: true, imageUrl: true, verificationStatus: true } }, community: { select: { id: true, name: true, locationId: true } }, _count: { select: { comments: true, reactions: true } }, images: { orderBy: { position: 'asc' as const }, select: { objectKey: true, altText: true, position: true } } }

export function createPostRoutes(dependencies: { env: ServerEnv; notifications?: NotificationService; jobs?: BackgroundJobQueue }) {
  const app = new Hono()
  app.post('/', async context => {
    const user = await principal(context, dependencies.env); const input = postInput.parse(await context.req.json())
    const membership = await prisma.communityMembership.findFirst({ where: { userId: user.userId, communityId: input.communityId, status: 'ACTIVE' } })
    if (!membership) throw forbidden('Join this community before posting')
    const post = await prisma.post.create({ data: { authorId: user.userId, communityId: input.communityId, body: input.body, category: input.category, visibility: input.visibility, locationLabel: input.locationLabel, latitudeApprox: input.latitude === undefined ? undefined : Math.round(input.latitude * 100) / 100, longitudeApprox: input.longitude === undefined ? undefined : Math.round(input.longitude * 100) / 100, imageUrls: [], images: { create: input.imageObjectKeys.map((objectKey, position) => ({ objectKey, position })) } }, include: publicPost })
    void dependencies.jobs?.enqueue({ name: 'process_post', idempotencyKey: `post:${post.id}:process`, payload: { postId: post.id } })
    return context.json({ post }, 201)
  })
  app.get('/', async context => {
    const scope = context.req.query('scope') ?? 'community'; const communityId = context.req.query('communityId'); const locationId = context.req.query('locationId'); const cursor = context.req.query('cursor'); const take = Math.min(Math.max(Number(context.req.query('limit') ?? 20), 1), 50)
    const locationFilter = locationId ? { community: { location: { OR: [{ id: locationId }, { parentId: locationId }, { parent: { parentId: locationId } }, { parent: { parent: { parentId: locationId } } }] } } } : {}
    const where = { isRemoved: false, moderationStatus: 'ACTIVE', ...(scope === 'community' && communityId ? { communityId } : {}), ...(scope === 'nigeria' ? {} : locationFilter) }
    const posts = await prisma.post.findMany({ where, include: publicPost, orderBy: scope === 'trending' ? [{ trendingScore: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' }, take: take + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
    const nextCursor = posts.length > take ? posts.pop()!.id : undefined
    return context.json({ posts, nextCursor, ranking: scope === 'trending' ? 'recent engagement, freshness, and verified-alert priority' : 'recent and location-relevant' })
  })
  app.patch('/:id', async context => { const user = await principal(context, dependencies.env); const input = postInput.partial().omit({ communityId: true }).parse(await context.req.json()); const updated = await prisma.post.updateMany({ where: { id: context.req.param('id'), authorId: user.userId, isRemoved: false }, data: { ...(input.body ? { body: input.body } : {}), ...(input.category ? { category: input.category } : {}), ...(input.visibility ? { visibility: input.visibility } : {}), ...(input.locationLabel !== undefined ? { locationLabel: input.locationLabel } : {}) } }); if (!updated.count) throw forbidden('You can only edit your own active posts'); return context.json({ status: 'updated' }) })
  app.delete('/:id', async context => { const user = await principal(context, dependencies.env); const deleted = await prisma.post.updateMany({ where: { id: context.req.param('id'), authorId: user.userId, isRemoved: false }, data: { isRemoved: true, moderationStatus: 'REMOVED', deletedAt: new Date() } }); if (!deleted.count) throw forbidden('You can only delete your own active posts'); return context.body(null, 204) })
  app.post('/:id/comments', async context => { const user = await principal(context, dependencies.env); const input = commentInput.parse(await context.req.json()); const post = await prisma.post.findFirst({ where: { id: context.req.param('id'), isRemoved: false, moderationStatus: 'ACTIVE' } }); if (!post) throw new ApiError(404, 'Post not found', 'NOT_FOUND'); if (input.parentId) { const parent = await prisma.comment.findFirst({ where: { id: input.parentId, postId: post.id, isRemoved: false } }); if (!parent) throw new ApiError(400, 'Invalid reply target', 'INVALID_INPUT') }; const comment = await prisma.comment.create({ data: { postId: post.id, authorId: user.userId, parentId: input.parentId, body: input.body } }); if (post.authorId !== user.userId) void dependencies.notifications?.create({ userId: post.authorId, type: input.parentId ? 'REPLY' : 'COMMENT', title: input.parentId ? 'New reply to your discussion' : 'New comment on your post', body: 'Someone replied in your community.', entityType: 'post', entityId: post.id, idempotencyKey: `comment:${comment.id}` }); return context.json({ comment }, 201) })
  app.put('/:id/reactions/:type', async context => { const user = await principal(context, dependencies.env); const type = reaction.parse(context.req.param('type')); const post = await prisma.post.findFirst({ where: { id: context.req.param('id'), isRemoved: false } }); if (!post) throw new ApiError(404, 'Post not found', 'NOT_FOUND'); const item = await prisma.reaction.upsert({ where: { postId_userId_type: { postId: post.id, userId: user.userId, type } }, create: { postId: post.id, userId: user.userId, type }, update: {} }); if (post.authorId !== user.userId) void dependencies.notifications?.create({ userId: post.authorId, type: 'REACTION', title: 'New reaction to your post', body: 'A neighbour reacted to your post.', entityType: 'post', entityId: post.id, idempotencyKey: `reaction:${item.id}` }); return context.json({ reaction: item }, 201) })
  app.delete('/:id/reactions/:type', async context => { const user = await principal(context, dependencies.env); const type = reaction.parse(context.req.param('type')); await prisma.reaction.deleteMany({ where: { postId: context.req.param('id'), userId: user.userId, type } }); return context.body(null, 204) })
  app.post('/:id/reports', async context => { const user = await principal(context, dependencies.env); const input = reportInput.parse(await context.req.json()); const post = await prisma.post.findFirst({ where: { id: context.req.param('id') } }); if (!post) throw new ApiError(404, 'Post not found', 'NOT_FOUND'); const report = await prisma.contentReport.create({ data: { reporterId: user.userId, targetType: 'POST', postId: post.id, reason: input.reason, details: input.details } }); return context.json({ report }, 201) })
  app.patch('/comments/:id', async context => { const user = await principal(context, dependencies.env); const input = z.object({ body: z.string().trim().min(1).max(2_000) }).parse(await context.req.json()); const result = await prisma.comment.updateMany({ where: { id: context.req.param('id'), authorId: user.userId, isRemoved: false }, data: { body: input.body } }); if (!result.count) throw forbidden('You can only edit your own active comments'); return context.json({ status: 'updated' }) })
  app.delete('/comments/:id', async context => { const user = await principal(context, dependencies.env); const result = await prisma.comment.updateMany({ where: { id: context.req.param('id'), authorId: user.userId, isRemoved: false }, data: { isRemoved: true, moderationStatus: 'REMOVED', deletedAt: new Date() } }); if (!result.count) throw forbidden('You can only delete your own active comments'); return context.body(null, 204) })
  return app
}
