---
title: gap-reporting
category: process
appliesTo:
  - honesty
  - ambiguity-handling
files: []
tasks:
  - report blockers/ambiguity
  - flag missing steering
inclusion: agent-requested
priority: high
dependsOn:
  - foundation/decision-log-policy.md
governs:
  - how agents surface gaps, ambiguities, and things they could not do
nonGoverns:
  - the decision record format (see foundation/decision-log-policy.md)
---

# Gap Reporting

## 1. Intent
Guarantee agents **surface what they didn't/couldn't do** and where the spec/steering is missing —
the antidote to fake completion and silent drift.

## 2. Hard rules — you MUST report a gap when:
- A requirement is **ambiguous** and you had to guess (also log an ADR if architectural).
- You **stubbed/mocked/deferred** anything (name exactly what is not real).
- A **steering doc is missing, wrong, or conflicting** for your task.
- You hit a **blocker** needing product-owner input (record as `proposed` ADR).
- A task implies a **non-goal** — flag it instead of quietly building it.

## 3. How to report
- In the task summary, include a **"Gaps & Assumptions"** section listing: what's incomplete,
  what was assumed, what needs a human decision, and any ADRs raised.
- For a missing/wrong steering doc: propose the fix (or add it) and note it.
- Never present incomplete work as finished (`AGENTS.md` / `definition-of-done.md`).

## 4. Failure modes to avoid
- Silent guessing on ambiguous requirements.
- Shipping a stub with no note that it's a stub.
- Building toward a non-goal without flagging it.

## 5. Definition of completion
A task's gap reporting is complete when every assumption, stub, blocker, and steering gap is
explicitly listed in the summary, with ADRs raised where required.
