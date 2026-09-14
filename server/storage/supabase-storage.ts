import { createClient } from '@supabase/supabase-js'
import { ApiError } from '../lib/errors'
import { createObjectKey, validateUpload } from './validation'
import { storageBuckets, type StorageProvider, type UploadInput, type UploadedObject, type StorageBucketName } from './types'

export function createSupabaseStorageProvider(config: { url: string; secretKey: string }): StorageProvider {
  const client = createClient(config.url, config.secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const assertPublic = (bucket: StorageBucketName) => {
    if (!storageBuckets[bucket].public) throw new ApiError(403, 'Private files do not have public URLs', 'PRIVATE_OBJECT')
  }
  return {
    validateUpload,
    async upload(input: UploadInput) {
      validateUpload(input)
      const objectKey = createObjectKey(input.bucket, input.ownerId, input.contentType)
      const { error } = await client.storage.from(storageBuckets[input.bucket].id).upload(objectKey, input.bytes, { contentType: input.contentType, upsert: false })
      if (error) throw new ApiError(500, 'File upload failed', 'STORAGE_UPLOAD_FAILED')
      return { bucket: input.bucket, objectKey }
    },
    async delete(object: UploadedObject) {
      const { error } = await client.storage.from(storageBuckets[object.bucket].id).remove([object.objectKey])
      if (error) throw new ApiError(500, 'File deletion failed', 'STORAGE_DELETE_FAILED')
    },
    getPublicUrl(object: UploadedObject) {
      assertPublic(object.bucket)
      return client.storage.from(storageBuckets[object.bucket].id).getPublicUrl(object.objectKey).data.publicUrl
    },
    async createSignedUrl(object: UploadedObject, expiresInSeconds: number) {
      if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 600) throw new ApiError(400, 'Invalid signed URL expiry', 'INVALID_SIGNED_URL_EXPIRY')
      const { data, error } = await client.storage.from(storageBuckets[object.bucket].id).createSignedUrl(object.objectKey, expiresInSeconds)
      if (error || !data?.signedUrl) throw new ApiError(500, 'Signed URL creation failed', 'STORAGE_SIGN_FAILED')
      return data.signedUrl
    },
    async moveFile(source, destination) {
      if (source.bucket !== destination.bucket) throw new ApiError(400, 'Files can only move within their storage bucket', 'STORAGE_MOVE_FAILED')
      const { error } = await client.storage.from(storageBuckets[source.bucket].id).move(source.objectKey, destination.objectKey)
      if (error) throw new ApiError(500, 'File move failed', 'STORAGE_MOVE_FAILED')
      return destination
    },
  }
}
