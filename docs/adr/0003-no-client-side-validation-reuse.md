# No client-side validation reuse (Eden-only)

**Status:** accepted

Request validation lives **only** in the Elysia backend routes (native TypeBox). The
frontend performs **no** client-side schema validation and reuses **no** validation
schemas from the backend or a shared package. The frontend trusts the types Eden infers
and surfaces errors returned over the wire.

## Context

With Drizzle as the data-model source of truth and Elysia validating requests with native
TypeBox, Eden already carries fully-typed route signatures to the frontend for free.
Reusing the *schema objects* client-side (for instant form feedback, disabled-submit,
`aria-invalid`) is possible but would couple the frontend to the backend's validation
library at the schema layer — a second coupling on top of Eden's type coupling.

## Decision

Stay Eden-only. Do not introduce a shared validation package. Pay the round-trip cost and
show server-returned errors.

## Reconsider when

A specific form's UX genuinely demands instant client-side feedback. At that point, enable
schema reuse **per-form** — not project-wide — by extracting that one schema into
`packages/shared`. This is a deliberate, incremental escape hatch, not a project-wide
reversal.
