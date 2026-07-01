---
title: task-intake
category: process
appliesTo:
  - workflow
  - agent-onboarding
files: []
tasks:
  - start any new task
inclusion: agent-requested
priority: high
dependsOn:
  - docs/steering/_loading-strategy.md
governs:
  - the standard steps an agent takes when picking up a task
nonGoverns:
  - feature rules (see domain docs)
---

# Task Intake

> Read this at the START of a task if you're unsure how to scope context. It operationalizes
> `AGENTS.md` + `_loading-strategy.md`.

## 1. Intent
Ensure every agent begins with the *right, minimal* context and a clear plan.

## 2. The intake steps
1. **Classify the task** — which surface (field/admin/owner), which feature(s), which layer
   (schema/action/UI/test)?
2. **Load the always-on foundation** (it's already global): product-goal, non-goals,
   architecture-principles, code-quality, decision-log-policy.
3. **Open `_loading-strategy.md`** and find the matching row in the **Task Routing Matrix**.
   Load exactly the docs it lists — no more.
4. **Do NOT bulk-load `docs/steering`.** If the matrix lacks your task, pick the nearest row,
   note the deviation, and load conservatively.
5. **Check dependencies**: each loaded doc's `dependsOn` may pull in one more doc — follow only
   those that are actually relevant to your change.
6. **Identify decision points** up front. If you'll have to guess something architectural/product,
   plan a decision-log entry (`decision-log-policy.md`).
7. **State your plan** (scope, files, docs consulted) before large changes.

## 3. Hard rules
- Never edit code before classifying the task and loading its routed docs.
- Never expand scope beyond the task without noting it.
- If steering docs conflict or are wrong, follow priority, then log a decision + fix the doc.

## 4. Failure modes to avoid
- Loading everything "to be safe" (defeats the whole system).
- Starting to code with no idea which domain rules apply.

## 5. Definition of completion
Intake is done when the task is classified, the routed docs (and only those) are loaded, decision
points are identified, and a scoped plan exists.
