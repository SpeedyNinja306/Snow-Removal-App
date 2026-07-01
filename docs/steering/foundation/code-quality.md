---
title: code-quality
category: foundation
appliesTo:
  - all-code
files:
  - "**/*.ts"
  - "**/*.tsx"
tasks:
  - any code-writing task
inclusion: always
priority: high
dependsOn:
  - foundation/architecture-principles.md
governs:
  - baseline code standards, typing, naming, and comment discipline
nonGoverns:
  - testing depth (see technical/testing-strategy.md, process/definition-of-done.md)
  - feature behavior (see domain/*)
---

# Code Quality

## 1. Intent
A single, small baseline so code from many agents reads like one team wrote it.

## 2. Hard rules
- **TypeScript strict**; no `any` unless justified with a comment. No `@ts-ignore` without a reason.
- **No unused exports, dead code, or commented-out blocks** left behind.
- **Validate all external input** with Zod before use.
- **No secrets in code** (see `technical/env-secrets-config.md`).
- **Errors are handled, not swallowed.** No empty `catch`. Surface actionable messages.
- **Comments explain WHY, not what.** Do not narrate obvious code. No change-explaining comments.
- **Naming:** `PascalCase` components/types, `camelCase` vars/functions, `SCREAMING_SNAKE` for
  constants/enums values where idiomatic, kebab-case file names for non-components.

## 3. Implementation guidance
- Prefer pure, testable functions in `lib/`; keep components thin.
- Small modules over large ones; one clear responsibility per file.
- Reuse shared Zod schemas and types; do not redefine the same shape twice.

## 4. Failure modes to avoid
- Copy-pasting logic across features instead of extracting it.
- Sprinkling `any`/casts to silence the compiler.
- Leaving TODOs without a decision-log or issue reference.

## 5. Definition of completion
Code passes typecheck + lint, has no dead code, validates inputs, handles errors, and follows
naming conventions.

## 6. Escalation / decision-log
If a rule here materially blocks a feature (e.g. a needed `any` at a library boundary), note the
exception inline and, if recurring, log a decision to amend this doc.
