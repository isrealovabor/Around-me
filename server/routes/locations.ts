import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { ApiError } from '../lib/errors'

/** Public geographic hierarchy used by the onboarding selector. Database records are the source of truth. */
export function createLocationRoutes() {
  const app = new Hono()

  app.get('/states', async context => {
    const states = await prisma.location.findMany({
      where: { parent: { slug: 'nigeria' }, type: { in: ['STATE', 'FCT'] } },
      select: { id: true, name: true, slug: true, type: true },
      orderBy: { name: 'asc' },
    })
    return context.json({ locations: states })
  })

  app.get('/states/:stateId/lgas', async context => {
    const state = await prisma.location.findFirst({ where: { id: context.req.param('stateId'), type: { in: ['STATE', 'FCT'] } }, select: { id: true } })
    if (!state) throw new ApiError(404, 'State not found', 'NOT_FOUND')
    const locations = await prisma.location.findMany({
      where: { parentId: state.id, type: 'LGA' },
      select: { id: true, name: true, slug: true, type: true },
      orderBy: { name: 'asc' },
    })
    return context.json({ locations })
  })

  app.get('/lgas/:lgaId/areas', async context => {
    const lga = await prisma.location.findFirst({ where: { id: context.req.param('lgaId'), type: 'LGA' }, select: { id: true } })
    if (!lga) throw new ApiError(404, 'Local government area not found', 'NOT_FOUND')
    const locations = await prisma.location.findMany({
      where: { parentId: lga.id, type: 'AREA' },
      select: { id: true, name: true, slug: true, type: true, verificationStatus: true },
      orderBy: { name: 'asc' },
    })
    return context.json({ locations })
  })

  return app
}
