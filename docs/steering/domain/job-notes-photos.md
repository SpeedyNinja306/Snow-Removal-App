---
title: job-notes-photos
category: domain
appliesTo:
  - notes
  - photos
  - media
files:
  - "**/notes/**"
  - "**/photos/**"
  - "**/media/**"
tasks:
  - add job notes
  - add photo uploads
  - build note/media schema
inclusion: auto
priority: high
dependsOn:
  - domain/jobs-lifecycle.md
  - domain/auth-roles.md
  - technical/file-upload-strategy.md
  - domain/audit-logging.md
governs:
  - job notes and photo/media attachments (content, ownership, lifecycle)
nonGoverns:
  - upload mechanics/storage (see technical/file-upload-strategy.md)
---

# Job Notes & Photos

## 1. Intent
Let field agents (and admins) attach the **evidence and context** of a job: text notes and
photos of the work, the machine, the site, and completion state.

## 2. Hard rules
- A **Note** belongs to a Job: author, body text, `createdAt`, optional type tag
  (`GENERAL | INTERNAL | CUSTOMER_VISIBLE` — default `GENERAL`). Notes are **append-only**;
  corrections are new notes, not edits of history (a soft-edit with edit trail is allowed if
  audited).
- A **Photo/Media** belongs to a Job: uploaded via presigned URL (see
  `technical/file-upload-strategy.md`), storing object key, content type, size, thumbnail
  reference, author, `createdAt`, optional caption.
- **Binaries never pass through the app server** — client uploads directly to storage via
  presigned URL; the server stores only metadata.
- **Authorization**: field agents attach/read notes+photos only on **their own** jobs; admin/owner
  on any. `INTERNAL` notes are never surfaced to customer-facing outputs (e.g. invoices).
- **Validate uploads**: accepted image types + max size enforced server-side when issuing the
  presigned URL and recorded in metadata. Reject executables/unexpected types.
- **No hard deletes** of media tied to a job by default; support soft-delete/hide with audit if
  removal is needed. Deleting a note/photo is an audited action.
- Offline: photo capture + note creation are part of the supported offline write set and must
  queue with the real capture time (per `pwa-offline-behavior.md`).

## 3. Implementation guidance
- Generate and store a thumbnail/downscaled variant for list rendering; lazy-load full images.
- Strip or ignore untrusted client-supplied timestamps except the honest capture time from the
  offline queue.
- Keep note entry to a single quick field on mobile; photo = camera-first.

## 4. Failure modes to avoid
- Routing image bytes through Server Actions/handlers.
- Letting an agent read another agent's job media.
- Leaking `INTERNAL` notes onto customer-visible invoice output.
- Trusting client-provided file type/size without server validation.

## 5. Definition of completion
Complete when notes and photos attach to jobs with correct authorship/scoping, photos upload via
presigned URLs with server-side type/size validation and thumbnails, internal notes stay internal,
offline capture queues with real timestamps, and deletions are soft + audited.

## 6. Escalation / decision-log
Adding video, PDF forms/checklists, or customer-visible media galleries REQUIRES a decision-log
entry.
