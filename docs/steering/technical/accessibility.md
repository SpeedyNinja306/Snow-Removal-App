---
title: accessibility
category: technical
appliesTo:
  - a11y
  - mobile-usability
files:
  - "app/**"
  - "components/**"
tasks:
  - build UI components
  - review accessibility
inclusion: agent-requested
priority: medium
dependsOn:
  - domain/field-agent-mobile-flow.md
governs:
  - accessibility + real-world usability baseline (esp. gloved/cold/outdoor field use)
nonGoverns:
  - visual design system specifics
---

# Accessibility & Field Usability

> `inclusion: agent-requested` — pull in when building/reviewing UI.

## 1. Intent
Usable by everyone, and specifically **usable in the field**: cold hands, gloves, glare, one-handed,
small screen. Accessibility and field usability overlap heavily here.

## 2. Hard rules
- **Semantic HTML + ARIA where needed**; forms have labels; interactive elements are real buttons/links.
- **Large touch targets** (min ~44px) for all primary field actions; generous spacing to avoid mis-taps.
- **Keyboard operable** and focus-visible on admin surfaces.
- **Sufficient color contrast** (WCAG AA); never rely on color alone (e.g. job status + text label,
  location freshness + text).
- **Readable outdoors**: high-contrast defaults; avoid low-contrast gray-on-white for critical info.
- Respect `prefers-reduced-motion`; don't gate critical actions behind hover.
- Error/validation messages are text, associated with fields, not color-only.

## 3. Implementation guidance
- Lean on shadcn/ui accessible primitives; don't hand-roll unlabeled controls.
- Test the field flow on an actual small viewport; verify one-handed reach of the action bar.

## 4. Failure modes to avoid
- Tiny tap targets / dense controls on the field surface.
- Status/freshness conveyed by color only.
- Icon-only buttons with no accessible label.

## 5. Definition of completion
Complete when UI uses semantic/labeled controls, meets AA contrast, has field-sized touch targets,
conveys state with text not just color, and the field action bar is reachable one-handed.

## 6. Escalation / decision-log
Adopting a formal a11y audit gate or WCAG AAA target REQUIRES a decision-log entry.
