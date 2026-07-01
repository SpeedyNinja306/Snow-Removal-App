---
title: decision-log-policy
category: foundation
appliesTo:
  - governance
  - all-features
files:
  - "docs/decision-log.md"
tasks:
  - any task that makes an architectural/product decision or resolves ambiguity
inclusion: always
priority: critical
dependsOn: []
governs:
  - when and how decisions must be recorded in docs/decision-log.md
nonGoverns:
  - the technical content of the decisions themselves
---

# Decision-Log Policy

## 1. Intent
Prevent silent architectural drift across many independent agents by recording every meaningful
choice in one append-only place: `docs/decision-log.md`.

## 2. Hard rules — you MUST add a decision-log entry when you:
- Change or interpret the **locked stack** or architecture principles.
- Reverse or bend a **non-goal**.
- Introduce a new **dependency**, external service, or data store.
- Make a **schema** change beyond a pure additive column (see `process/schema-change-policy.md`).
- Choose between materially different approaches where a future agent could reasonably pick the other.
- **Resolve an ambiguity** in the spec or steering docs by guessing.
- Discover the steering docs are **wrong or incomplete** (log it, then fix the doc).

## 3. Entry format (append-only, never edit past entries)
```
### ADR-<NNN>: <short title>
- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded-by ADR-XXX
- Context: what forced a decision
- Decision: what we chose
- Alternatives: what we rejected and why
- Consequences: trade-offs, follow-ups, affected steering docs
```

## 4. Implementation guidance
- Reference the ADR id in the PR/description that implements it.
- If an ADR supersedes another, mark the old one `superseded-by`, do not delete it.

## 5. Failure modes to avoid
- Making a stack/schema/scope decision with no ADR.
- Editing history instead of appending a superseding entry.

## 6. Definition of completion
A decision is "logged" when it has a numbered ADR with all fields filled and any affected
steering doc updated.

## 7. Escalation
If you cannot make a decision safely (needs product owner input), record it as `proposed` and
flag it in your task summary rather than guessing silently.
