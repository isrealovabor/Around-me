export const storageBuckets = {
  avatars: { id: 'avatars', public: true, maxBytes: 5 * 1024 * 1024, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  postImages: { id: 'post-images', public: true, maxBytes: 5 * 1024 * 1024, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  marketplaceImages: { id: 'marketplace-images', public: true, maxBytes: 5 * 1024 * 1024, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  businessImages: { id: 'business-images', public: true, maxBytes: 5 * 1024 * 1024, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  verificationDocuments: { id: 'verification-documents', public: false, maxBytes: 10 * 1024 * 1024, mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
} as const

export type StorageBucketName = keyof typeof storageBuckets
export type UploadInput = { bucket: StorageBucketName; ownerId: string; filename: string; contentType: string; bytes: Uint8Array }
export type UploadedObject = { bucket: StorageBucketName; objectKey: string }

export interface StorageProvider {
  validateUpload(input: UploadInput): void
  upload(input: UploadInput): Promise<UploadedObject>
  delete(object: UploadedObject): Promise<void>
  getPublicUrl(object: UploadedObject): string
  createSignedUrl(object: UploadedObject, expiresInSeconds: number): Promise<string>
  moveFile(source: UploadedObject, destination: { bucket: StorageBucketName; objectKey: string }): Promise<UploadedObject>
}
