import { createClient } from '@supabase/supabase-js'

const required = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY']
if (required.some(name => !process.env[name])) {
  console.error(JSON.stringify({ error: 'STORAGE_NOT_CONFIGURED', required }))
  process.exit(1)
}
const buckets = [
  ['avatars', true, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']],
  ['post-images', true, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']],
  ['marketplace-images', true, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']],
  ['business-images', true, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']],
  ['verification-documents', false, 10 * 1024 * 1024, ['application/pdf', 'image/jpeg', 'image/png']],
]
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const { data: existing, error: listError } = await client.storage.listBuckets()
if (listError) throw new Error('Unable to inspect storage buckets')
const existingIds = new Set(existing.map(bucket => bucket.id))
const actions = []
for (const [id, isPublic, fileSizeLimit, allowedMimeTypes] of buckets) {
  const options = { public: isPublic, fileSizeLimit, allowedMimeTypes }
  if (existingIds.has(id)) {
    const { error } = await client.storage.updateBucket(id, options)
    if (error) throw new Error(`Unable to update bucket ${id}`)
    actions.push({ id, action: 'updated' })
    continue
  }
  const { error } = await client.storage.createBucket(id, options)
  if (error) throw new Error(`Unable to create bucket ${id}`)
  actions.push({ id, action: 'created' })
}
console.log(JSON.stringify({ status: 'ok', buckets: actions }))
