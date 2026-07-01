---
title: file-upload-strategy
category: technical
appliesTo:
  - uploads
  - media-storage
files:
  - "**/upload/**"
  - "**/lib/storage/**"
  - "app/api/upload/**"
tasks:
  - implement photo upload
  - mint presigned URLs
inclusion: auto
priority: high
dependsOn:
  - domain/job-notes-photos.md
  - technical/server-client-boundaries.md
  - technical/env-secrets-config.md
governs:
  - how binaries are uploaded, stored, validated, and referenced
nonGoverns:
  - note/photo domain rules (see domain/job-notes-photos.md)
---

# File Upload Strategy

## 1. Intent
Move image bytes to object storage safely and cheaply, keeping the app server out of the binary path.

## 2. Hard rules
- **Direct-to-storage via presigned URLs.** The client requests a presigned upload URL from a
  server action/handler (which authorizes + validates intended type/size), uploads directly to
  **S3-compatible storage**, then confirms; the server stores only **metadata** (key, type, size,
  thumbnail ref, author, jobId).
- **Server-side validation when minting the URL**: allowed content types (images for MVP), max
  size, and a server-generated object key namespaced by job (`jobs/<jobId>/<uuid>`). Never accept
  a client-chosen storage path.
- **Private buckets.** Reads go through **presigned, short-lived download URLs** or an authorized
  proxy — no public bucket listing, no permanent public URLs for job media.
- **No secrets client-side** — storage credentials live only on the server (`env-secrets-config.md`).
- Generate a **thumbnail/downscaled variant** (server or on-demand) for list views.
- Enforce the same **authorization** as the underlying job (field agents: own jobs only).
- Handle orphans: if the client never confirms an upload, the metadata record isn't created (or is
  marked pending and swept).

## 3. Implementation guidance
- `lib/storage` wraps the S3 client and URL signing; features call it, never the raw SDK.
- Keep max size/type limits in one config module reused by mint + confirm.
- For offline capture, queue the file locally and upload on reconnect (per `pwa-offline-behavior.md`).

## 4. Failure modes to avoid
- Streaming uploads through Server Actions/Route Handlers.
- Public buckets or long-lived public URLs for private job photos.
- Trusting client-provided content type/size/path.
- Storage keys/credentials leaking to the client.

## 5. Definition of completion
Complete when uploads go direct-to-private-storage via server-minted presigned URLs with
server-side type/size validation and job-scoped keys, only metadata + thumbnails are stored,
reads are access-controlled, and authorization matches the job.

## 6. Escalation / decision-log
Choosing the specific storage provider, allowing non-image files (PDF/video), or serving media via
a CDN REQUIRES a decision-log entry.
