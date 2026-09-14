import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  const extensions = await prisma.$queryRaw`
    SELECT extname FROM pg_extension WHERE extname = 'postgis'
  `
  const coreConstraints = await prisma.$queryRaw`
    SELECT table_name, constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name IN ('User', 'Profile', 'CommunityMembership', 'Community', 'Post', 'CommunityAlert', 'MarketplaceListing', 'Business', 'Notification', 'SavedPost', 'AlertConfirmation')
      AND constraint_type IN ('FOREIGN KEY', 'UNIQUE')
    ORDER BY table_name, constraint_name
  `
  const seededLocations = await prisma.$queryRaw`
    SELECT slug, name, type, "verificationStatus"
    FROM "Location"
    WHERE slug IN ('nigeria', 'lagos-state', 'ojo-lga', 'ojo', 'iba', 'okokomaiko', 'alaba', 'ajangbadi', 'shibiri', 'ijanikin', 'satellite-town', 'trade-fair', 'agaja')
    ORDER BY slug
  `
  const uniqueIndexes = await prisma.$queryRaw`
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN ('User_email_key', 'CommunityMembership_userId_communityId_key', 'SavedPost_userId_postId_key', 'AlertConfirmation_alertId_userId_type_key')
    ORDER BY indexname
  `
  const [businessCategories, marketplaceCategories] = await Promise.all([
    prisma.businessCategory.count(),
    prisma.marketplaceCategory.count(),
  ])
  console.log(JSON.stringify({ publicTables: tables.map(row => row.table_name), postgisEnabled: extensions.length > 0, coreConstraints, uniqueIndexes, seededLocations, businessCategories, marketplaceCategories }))
} catch {
  // Keep connection/driver details out of normal operational output.
  console.error(JSON.stringify({ error: 'DATABASE_UNREACHABLE' }))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
