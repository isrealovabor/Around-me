import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const locations = [['nigeria', 'Nigeria', 'COUNTRY']] as const
const states = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara']
const businessCategories = ['Electricians', 'Plumbers', 'Mechanics', 'Phone repair', 'Generator repair', 'AC technicians', 'Barbers', 'Hairdressers', 'Tailors', 'Cleaners', 'Food vendors', 'Delivery / logistics', 'Security', 'Car wash', 'Computer repair', 'Tutors', 'Other']
const marketplaceCategories = ['Phones', 'Electronics', 'Furniture', 'Fashion', 'Cars / parts', 'Home items', 'Food', 'Services', 'Other']
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-')

async function main() {
  for (const [slug, name, type] of locations) await prisma.location.upsert({ where: { slug }, update: { name, type, source: 'development_seed' }, create: { slug, name, type, source: 'development_seed' } })
  const nigeria = await prisma.location.update({ where: { slug: 'nigeria' }, data: { source: 'nigeria_state_seed', sourceReference: 'State-level administrative seed', verificationStatus: 'VERIFIED' } })
  for (const name of [...states, 'Federal Capital Territory']) {
    const slug = name === 'Federal Capital Territory' ? 'fct' : `${slugify(name)}-state`
    await prisma.location.upsert({ where: { slug }, update: { name: name === 'Lagos' ? 'Lagos State' : name, type: name === 'Federal Capital Territory' ? 'FCT' : 'STATE', parentId: nigeria.id, source: 'nigeria_state_seed', sourceReference: 'State-level administrative seed', verificationStatus: 'VERIFIED' }, create: { slug, name: name === 'Lagos' ? 'Lagos State' : name, type: name === 'Federal Capital Territory' ? 'FCT' : 'STATE', parentId: nigeria.id, source: 'nigeria_state_seed', sourceReference: 'State-level administrative seed', verificationStatus: 'VERIFIED' } })
  }
  const lagos = await prisma.location.findUniqueOrThrow({ where: { slug: 'lagos-state' } })
  const ojoLga = await prisma.location.upsert({ where: { slug: 'ojo-lga' }, update: { name: 'Ojo LGA', parentId: lagos.id, type: 'LGA', source: 'ojo_pilot_seed', sourceReference: 'Pilot locality list — requires local verification', verificationStatus: 'NEEDS_REVIEW' }, create: { slug: 'ojo-lga', name: 'Ojo LGA', parentId: lagos.id, type: 'LGA', source: 'ojo_pilot_seed', sourceReference: 'Pilot locality list — requires local verification', verificationStatus: 'NEEDS_REVIEW' } })
  for (const [slug, name] of [['ojo', 'Ojo'], ['iba', 'Iba'], ['okokomaiko', 'Okokomaiko'], ['alaba', 'Alaba'], ['ajangbadi', 'Ajangbadi'], ['shibiri', 'Shibiri'], ['ijanikin', 'Ijanikin'], ['satellite-town', 'Satellite Town'], ['trade-fair', 'Trade Fair'], ['agaja', 'Agaja']] as const) {
    const location = await prisma.location.upsert({ where: { slug }, update: { name, parentId: ojoLga.id, type: 'AREA', source: 'ojo_pilot_seed', sourceReference: 'Pilot locality list — requires local verification', verificationStatus: 'NEEDS_REVIEW', boundaryAvailable: false }, create: { slug, name, parentId: ojoLga.id, type: 'AREA', source: 'ojo_pilot_seed', sourceReference: 'Pilot locality list — requires local verification', verificationStatus: 'NEEDS_REVIEW', boundaryAvailable: false } })
    await prisma.community.upsert({ where: { slug }, update: { name, locationId: location.id }, create: { slug, name, locationId: location.id, description: 'Ojo pilot development seed — named local area, boundary not yet verified.' } })
  }
  for (const name of businessCategories) await prisma.businessCategory.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } })
  for (const name of marketplaceCategories) await prisma.marketplaceCategory.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } })
  const ojo = await prisma.community.findUniqueOrThrow({ where: { slug: 'ojo' } })
  const demoUser = await prisma.user.upsert({ where: { email: 'demo-ojo-host@aroundme.example' }, update: { name: 'Around Me Demo Host' }, create: { email: 'demo-ojo-host@aroundme.example', name: 'Around Me Demo Host', passwordHash: 'development-seed-only' } })
  const demoPosts = [
    ['demo-ojo-welcome', 'Welcome to the fictional Ojo launch demo. Share helpful local updates and use approximate locations only.', 'GENERAL'],
    ['demo-ojo-market-day', 'Demo reminder: the fictional Ojo Community Market Day is this weekend. This is sample development content, not a real event notice.', 'EVENTS'],
  ] as const
  for (const [key, body, category] of demoPosts) if (!await prisma.post.findFirst({ where: { authorId: demoUser.id, communityId: ojo.id, body } })) await prisma.post.create({ data: { authorId: demoUser.id, communityId: ojo.id, body, category, imageUrls: [], locationLabel: 'Ojo demo area', visibility: 'COMMUNITY' } })
  if (!await prisma.localEvent.findFirst({ where: { communityId: ojo.id, title: 'Demo Ojo Community Market Day' } })) await prisma.localEvent.create({ data: { communityId: ojo.id, organizerId: demoUser.id, title: 'Demo Ojo Community Market Day', description: 'Fictional development event for testing local discovery. Not a real-world listing.', category: 'COMMUNITY', venueName: 'Demo Community Square', locationLabel: 'Ojo demo area', startAt: new Date('2027-01-17T10:00:00.000Z') } })
  const food = await prisma.businessCategory.findUniqueOrThrow({ where: { slug: 'food-vendors' } })
  await prisma.business.upsert({ where: { slug: 'demo-ojo-sunrise-kitchen' }, update: { name: 'Demo Ojo Sunrise Kitchen', description: 'Fictional demo food listing for Around Me development.', communityId: ojo.id, categoryId: food.id, serviceArea: 'Ojo demo area', claimStatus: 'UNCLAIMED' }, create: { slug: 'demo-ojo-sunrise-kitchen', name: 'Demo Ojo Sunrise Kitchen', description: 'Fictional demo food listing for Around Me development.', communityId: ojo.id, categoryId: food.id, serviceArea: 'Ojo demo area', imageUrls: [], claimStatus: 'UNCLAIMED' } })
}

main().then(() => prisma.$disconnect()).catch(async error => { console.error(error); await prisma.$disconnect(); process.exit(1) })
