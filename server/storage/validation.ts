import { randomUUID } from 'node:crypto'
import { ApiError } from '../lib/errors'
import { storageBuckets, type StorageBucketName, type UploadInput } from './types'

const signatures: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
}

function hasExpectedSignature(contentType: string, bytes: Uint8Array) {
  if (contentType === 'image/webp') return bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  const signature = signatures[contentType]
  return signature ? signature.every((byte, index) => bytes[index] === byte) : false
}

export function validateUpload(input: UploadInput) {
  const policy = storageBuckets[input.bucket]
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(input.ownerId)) throw new ApiError(400, 'Invalid upload owner', 'INVALID_UPLOAD_OWNER')
  if (!input.filename || input.filename.length > 255 || /[\\/\u0000-\u001f]/.test(input.filename)) throw new ApiError(400, 'Invalid file name', 'INVALID_FILE_NAME')
  if (!policy.mimeTypes.includes(input.contentType as never)) throw new ApiError(400, 'Unsupported file type', 'INVALID_FILE_TYPE')
  if (!input.bytes.length || input.bytes.length > policy.maxBytes) throw new ApiError(400, 'File is empty or exceeds the size limit', 'INVALID_FILE_SIZE')
  if (!hasExpectedSignature(input.contentType, input.bytes)) throw new ApiError(400, 'File content does not match its declared type', 'INVALID_FILE_SIGNATURE')
}

export function createObjectKey(bucket: StorageBucketName, ownerId: string, contentType: string) {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[contentType]
  if (!extension) throw new ApiError(400, 'Unsupported file type', 'INVALID_FILE_TYPE')
  return `${bucket}/${ownerId}/${randomUUID()}.${extension}`
}
