# Supabase Storage

## Server-only integration

`server/storage/supabase-storage.ts` is the only Supabase Storage adapter. It is created with `SUPABASE_SECRET_KEY`, which must remain server-only and must never be exposed through a `VITE_` environment variable or bundled into the client.

All upload routes should call the `StorageProvider` interface, rather than calling Supabase Storage directly. The provider validates file type, size, and file signatures, generates server-owned UUID keys, and provides deletion, public-URL, signed-URL, and same-bucket move operations.

## Buckets

| Bucket | Access | Accepted files | Maximum size |
| --- | --- | --- | --- |
| `avatars` | Public read | JPEG, PNG, WebP | 5 MB |
| `post-images` | Public read | JPEG, PNG, WebP | 5 MB |
| `marketplace-images` | Public read | JPEG, PNG, WebP | 5 MB |
| `business-images` | Public read | JPEG, PNG, WebP | 5 MB |
| `verification-documents` | Private | PDF, JPEG, PNG | 10 MB |

Public media may use public URLs. Verification documents must never use public URLs: authorized server handlers create signed URLs with a maximum lifetime of 10 minutes.

## Provisioning

Set `SUPABASE_SECRET_KEY` in the local server `.env`, then run:

```powershell
npm run storage:provision
```

The provisioning script is idempotent: it creates missing buckets and reapplies the access setting, size limit, and MIME restrictions to existing ones. It does not print secrets.

## Access controls

Keep all uploads server-mediated. Do not add anonymous or client-side `INSERT`, `UPDATE`, or `DELETE` Storage policies for these buckets. The server secret bypasses Storage RLS only inside the server process.

The verification-document access gate permits platform admins and super-admins. A community moderator requires an explicit subject-scope authorization check by the caller. Store only object keys in Prisma models; do not persist temporary signed URLs.

File-signature checks are intentionally a first gate, not a malware scanner. Add malware scanning and image dimension processing before accepting untrusted files at larger scale.
