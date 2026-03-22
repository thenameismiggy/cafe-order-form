# Focus Visible — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

Add `:focus-visible` styles to all interactive elements that currently have none, so keyboard users can see which element is focused.

---

## Context

The app currently has focus styles only on form inputs and selects via `.form-group input:focus` and `.form-group select:focus` (line 94). These use `:focus` rather than `:focus-visible`, meaning form inputs show a focus ring on mouse click. This pre-existing inconsistency is out of scope — after this change, newly styled elements will correctly suppress the ring on mouse click while form inputs will not. This inconsistency is accepted and deferred.

`:focus-visible` is used for all new rules so the focus ring only appears during keyboard navigation — not on mouse or touch interactions.

---

## Elements Affected

| Selector | Notes |
|---|---|
| `.btn` | Covers all general buttons including `#btn-modal-done`, `#btn-back-mobile`, and any other element with the `.btn` class |
| `.tab-btn` | Tab navigation buttons |
| `.btn-new-order` | New Order button (no `.btn` class) |
| `.status-select` | Status dropdown on ticket cards. Lives in `.ticket-meta`, not inside `.form-group` — the existing `.form-group select:focus` rule does not apply to it. |
| `.stepper-minus`, `.stepper-plus` | Quantity stepper buttons in the order panel (no `.btn` class) |
| `.draft-banner` | Draft resume button — targeted by class selector for consistency with other rules |

Note: `#btn-back-mobile` has class `.btn` and is already covered by the `.btn` rule.

---

## Style

A single rule added to the `/* === BUTTONS === */` section of the stylesheet. `.status-select` is grouped here because this rule covers all keyboard-interactive elements that lack focus styles — buttons and the status dropdown share this concern regardless of semantic element type.

```css
.btn:focus-visible,
.tab-btn:focus-visible,
.btn-new-order:focus-visible,
.status-select:focus-visible,
.stepper-minus:focus-visible,
.stepper-plus:focus-visible,
.draft-banner:focus-visible {
  outline: 2px solid #4a90e2;
  outline-offset: 2px;
}
```

---

## Out of Scope

- Updating existing `:focus` rules on form inputs to `:focus-visible` (pre-existing inconsistency, deferred)
- ARIA roles or screen reader improvements
- WCAG compliance audit
- Focus management (e.g., moving focus on tab switch or modal open)
