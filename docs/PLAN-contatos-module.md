# PLAN: Módulo Contatos

## Overview

**What:** A new **Contatos** module — a central registry of people (PF) and companies (PJ) that can hold MULTIPLE roles (tenant, owner, guarantor, supplier, lawyer, agency, broker, etc.) and is deeply integrated with Imóveis (properties), Contratos (contracts), Documentos, Finanças, and Agenda.

**Why:** Today, party data lives denormalized as free text inside `contracts` (`tenant_*`, `agency_*`), with no single source of truth, no dedup, no cross-module 360° view, and no reusable picker. Contatos centralizes this, enables N:N links, a per-contact 360 view, and a reusable combobox + quick-create across forms — without breaking existing flows (additive, backward-compatible, dual-write during transition).

**Approach:** Extend the existing stack and house patterns. Ship in **4 milestone-driven phases**, each ending in a working, shippable state. No new visual language; no Node server; no breaking schema changes. Finance stays user-scoped in Phase 1 (with a UI disclaimer) — a finance-wide `client_id` migration is explicitly OUT OF SCOPE.

## Project Type

**WEB** — React 18 + Vite + TypeScript SPA over Supabase (Postgres + RLS + supabase-js). Primary agents: `database-architect`, `backend-specialist`, `frontend-specialist`, `security-auditor`, `test-engineer`. NO `mobile-developer`.

## Success Criteria (Measurable)

1. **Migrations apply cleanly** forward and roll back: 4 new migration files apply with no error; 5 new tables exist (`contacts`, `contact_roles`, `contact_property_links`, `contact_contract_links`, `contact_interactions`); all carry `user_id`, `client_id`, `created_at`, `updated_at`, `deleted_at`.
2. **RLS isolation holds:** a contact created by org A is invisible to org B and to a user in no client scope; verified by an automated two-user isolation test. `system_admin` is permission-allowed but RLS-blocked from other orgs' contacts.
3. **Permissions enforced:** 9 `contacts.*` permission strings seeded into `public.permissions` + `role_permissions`; routes and gated tabs hidden/blocked without them; `admin`/`system_admin` bypass granular perms (documented, not a bug).
4. **CRUD works end-to-end:** create PF and PJ contacts with ≥1 role each, edit, soft-delete (sets `deleted_at`, row hidden, not destroyed), list filters `deleted_at IS NULL`.
5. **360 view loads:** `/contacts/:id` renders hero + tabs; Visão Geral populated; cross-module tabs (Phase 4) load via `Promise.allSettled` with one failing source not blanking the page.
6. **Cross-module linking (Phase 2):** link/unlink a contact to a property and to a contract; `LinkedContactsSection` shows linked contacts inside property-detail and ContractDetailPage; `ContactCombobox` + quick-create returns a usable id without navigation.
7. **Backward compatibility:** existing contract create/edit/list/detail and properties flows unchanged; `tenant_*`/`agency_*` text columns remain authoritative during transition (dual-write).
8. **Dedup is non-blocking:** duplicate CPF/CNPJ/email/phone shows a warning + "Ver contato" but never prevents save.
9. **Quality gates green per phase:** `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass; manual smoke per phase passes.

## Tech Stack (EXTENDS existing — no new choices)

| Layer | Technology | Rationale (why reuse, not introduce) |
|---|---|---|
| DB | Supabase Postgres, text+CHECK enums, partial indexes, RLS `user_can_access_row(user_id, client_id)` | House dual-scope multi-tenancy pattern; new tables must match exactly to inherit isolation guarantees. Template: `supabase/migrations/20260531023000_agenda_operational_events.sql`. |
| Data access | `src/api/*.ts` thin wrappers over `supabase-js` | No Node server exists; all access is client-side with `getCurrentUserClientId()` + `logger`. Mirror `src/api/contracts.ts`. |
| Auth/perms | `public.permissions` + `role_permissions`, `hasPermission()`, `COMMON_PERMISSIONS` prefetch | `src/components/auth/auth-provider.tsx` line 22 already prefetches a permission list; add `contacts.*` for warm cache. |
| State | TanStack Query, flat string-array keys, staleTime 5min | Matches `use-contracts.ts` split convention (queries + mutations). No query-key factory exists — do not introduce one. |
| Routing | React Router v6, `React.lazy`, `<ProtectedRoute requiredPermission>` | `src/routes/AppRoutes.tsx` already lazy-loads every page and gates per route. |
| UI | shadcn/ui + Tailwind + Radix + lucide-react | Reuse premium-* tokens, `rounded-[2rem]` tab shells, SnapshotCard + status-badge from `property-detail.tsx`. No new visual language. |
| Forms | react-hook-form + zod via `ui/form` | Matches contract/property forms. |
| Reused utils | `<CEPLookup>` (`src/components/properties/cep-lookup.tsx` + `src/utils/cep-lookup.ts`), `ui/multi-select.tsx`, `ui/command.tsx` + `ui/popover` | Address autofill and multi-select/combobox already exist. |

## File Structure

### New — Database (`supabase/migrations/`, placed AFTER `20260531113000`)
```
2026XXXX01_contacts_core.sql            # contacts + contact_roles + RLS + indexes + permissions seed
2026XXXX02_contact_links.sql            # contact_property_links + contact_contract_links + contact_interactions + RLS
2026XXXX03_contact_alter_existing.sql   # nullable contact_id on financial_transactions/documents/agenda_events; optional primary_contact_id on contracts
2026XXXX04_contact_backfill_optional.sql# idempotent, DISABLED-by-default callable routine (tenant_*/agency_* text -> contacts)
```

### New — API (`src/api/`)
```
contacts.ts             # fetchContacts/ById/360, create/update/softDelete, add/removeRole, findDuplicateContacts
contact-links.ts        # linkContactToProperty/Contract(+unlink), fetchPropertyContacts/ContractContacts, linkContactToDocument/Transaction
contact-interactions.ts # fetch/create/update/softDelete
```

### New — Types (`src/types/`)
```
contact.ts  # Contact, ContactRole, ContactLink, ContactInteraction types + role->pt-BR label map + status->color map
```

### New — Hooks (`src/hooks/`)
```
use-contacts.ts            # orchestrator re-export
use-contact-queries.ts     # list/detail/360 queries
use-contact-mutations.ts   # create/update/softDelete/roles
use-contact-links.ts       # link/unlink + linked lists
use-contact-interactions.ts
```

### New — Pages (`src/pages/`) — thin wrappers (mirror `Properties.tsx`/`ContractDetailPage.tsx`)
```
ContactsPage.tsx
ContactDetailPage.tsx
ContactFormPage.tsx        # shared new/edit
```

### New — Components (`src/components/contacts/`)
```
contact-list.tsx contact-summary-cards.tsx contact-filter-panel.tsx
contact-table.tsx contact-card.tsx contact-row-actions.tsx
contact-status-badge.tsx contact-role-chips.tsx
contact-combobox.tsx contact-quick-create-dialog.tsx linked-contacts-section.tsx
form/contact-form.tsx form/person-type-toggle.tsx form/basic-info-section.tsx
form/contact-info-section.tsx form/address-section.tsx form/roles-section.tsx
detail/contact-detail.tsx detail/contact-hero-header.tsx
detail/tabs/overview-tab.tsx detail/tabs/properties-tab.tsx detail/tabs/contracts-tab.tsx
detail/tabs/documents-tab.tsx detail/tabs/financial-tab.tsx detail/tabs/agenda-tab.tsx detail/tabs/history-tab.tsx
```

### Modified
```
src/routes/AppRoutes.tsx                       # 4 lazy routes (:id LAST)
src/components/layout/animated-sidebar.tsx     # menu item between Locações and Agenda (~line 403); ACTIVE sidebar
src/components/auth/auth-provider.tsx          # add contacts.* to COMMON_PERMISSIONS (line 22)
src/components/properties/property-detail.tsx  # inject LinkedContactsSection (Phase 2)
src/pages/ContractDetailPage.tsx               # inject LinkedContactsSection as a Card (Phase 2)
src/components/contracts/contract-form.tsx     # ContactCombobox for proprietário/inquilino (Phase 3, dual-write)
# Phase 4 wiring: transaction form, document form, agenda activity-form.tsx (contact_id combobox)
```

> ⚠️ Do NOT edit `src/components/layout/app-sidebar.tsx` — it is **legacy**. The active export `AppSidebar` lives in `animated-sidebar.tsx`.

---

## Task Breakdown (Phased)

> **Agents:** `database-architect`, `backend-specialist`, `frontend-specialist`, `security-auditor`, `test-engineer`.
> **Task size:** 2–10 min, one outcome each. **Dependencies are hard blockers only.**

---

### PHASE 1 — Foundation + Core CRUD (shippable: contacts list/create/edit/detail-overview, sidebar, RLS, permissions; NO cross-module)

> 🔴 **USER DECISION before Phase 1 (D7 below):** lock the `kind` field name to `'pf'`/`'pj'` and the role taxonomy. These are CHECK constraints → changing later = a migration.

#### P1-T1 — Migration: contacts_core
- **agent:** database-architect • **skill:** clean-code • **priority:** P0 • **deps:** none
- **INPUT:** template `20260531023000_agenda_operational_events.sql`; backend spec column list.
- **OUTPUT:** `2026XXXX01_contacts_core.sql` creating `contacts` (id, user_id NOT NULL, client_id NULL→clients, kind CHECK('pf','pj') default 'pf', display_name NOT NULL, legal_name, document_type CHECK('cpf','cnpj','other'), document_number, email, phone, secondary_phone, address, city, state, zip_code, country, notes, metadata jsonb, status CHECK('active','inactive','archived') default 'active', created_at, updated_at, deleted_at) and `contact_roles` (contact_id→contacts CASCADE, user_id, client_id, role CHECK(...12 values...), is_primary bool, deleted_at; UNIQUE(contact_id, role) WHERE deleted_at IS NULL). Indexes: user_id; partial client_id; partial NON-UNIQUE dedup indexes on document_number, lower(email), phone. updated_at trigger if house pattern uses one.
- **VERIFY:** `supabase db reset` (or `db push`) applies with no error; `\d contacts` shows all columns + CHECKs; partial indexes present; dedup indexes are NOT unique.
- **ROLLBACK:** delete migration file; re-reset. No dependents yet.

#### P1-T2 — RLS policies for contacts + contact_roles
- **agent:** security-auditor • **skill:** clean-code • **priority:** P0 • **deps:** P1-T1
- **INPUT:** house policy `<table>_access_own_or_client` using `public.user_can_access_row(user_id, client_id)`.
- **OUTPUT:** in same migration (or appended): `ENABLE ROW LEVEL SECURITY` + `FOR ALL` policy `contacts_access_own_or_client` and `contact_roles_access_own_or_client` with `USING` + `WITH CHECK`.
- **VERIFY:** `pg_policies` lists both; insert as user A then switch to user B (no shared client) → 0 rows visible. (Formalized in P1-T11.)
- **ROLLBACK:** drop policies + disable RLS.

#### P1-T3 — Permissions seed
- **agent:** security-auditor • **skill:** clean-code • **priority:** P0 • **deps:** P1-T1
- **INPUT:** dotted convention; existing permissions/role_permissions rows.
- **OUTPUT:** seed (in core migration) of `contacts.view`, `.create`, `.edit`, `.delete`, `.links.manage`, `.interactions.view`, `.interactions.manage`, `.financial.view`, `.documents.view` into `public.permissions`; grant to `manager` (all), `user` (view/create/edit/links/interactions), `viewer` (view + read-only). `admin`/`system_admin` bypass granular perms (no rows needed; documented).
- **VERIFY:** `SELECT` shows 9 new permission rows; `role_permissions` joins return expected grants per role.
- **ROLLBACK:** delete seeded rows.

#### P1-T4 — Types + label/color maps
- **agent:** frontend-specialist • **skill:** clean-code • **priority:** P1 • **deps:** P1-T1
- **INPUT:** final column list + role taxonomy.
- **OUTPUT:** `src/types/contact.ts` with `Contact`, `ContactRole`, `ContactStatus`, `ContactKind` types; `ROLE_LABELS` (pt-BR) and `STATUS_COLORS` (ativo→emerald, inativo→stone, em análise→amber, bloqueado/arquivado→red) centralized.
- **VERIFY:** `npx tsc --noEmit` passes; `kind` union is exactly `'pf' | 'pj'`.
- **ROLLBACK:** delete file.

#### P1-T5 — API: contacts.ts
- **agent:** backend-specialist • **skill:** clean-code • **priority:** P1 • **deps:** P1-T1, P1-T4
- **INPUT:** house style from `src/api/contracts.ts` (auth.getUser→throw 'Usuario nao autenticado', `getCurrentUserClientId()`, `logger`, `.select().single()`).
- **OUTPUT:** `src/api/contacts.ts`: `fetchContacts(filters)` (filters `deleted_at IS NULL`), `fetchContactById`, `fetchContact360` (parallel `Promise.allSettled`), `createContact` (sets user_id+client_id, then inserts roles), `updateContact`, `softDeleteContact` (sets `deleted_at`, NOT delete), `addContactRole`/`removeContactRole`, `findDuplicateContacts` (normalize digits/lowercase, `.or()` across document_number/email/phone — warn not block).
- **VERIFY:** `tsc --noEmit` passes; manual call createContact returns row with non-null user_id and client_id matching `getCurrentUserClientId()`; softDelete leaves row present with `deleted_at` set.
- **ROLLBACK:** delete file (no consumers yet).

#### P1-T6 — Hooks: queries + mutations
- **agent:** frontend-specialist • **skill:** clean-code • **priority:** P1 • **deps:** P1-T5
- **INPUT:** split convention from `use-contracts.ts`; flat keys `['contacts']`, `['contacts',filters]`, `['contact',id]`.
- **OUTPUT:** `use-contact-queries.ts` (staleTime 5min, `enabled:!!id`), `use-contact-mutations.ts` (invalidate `['contacts']` + `['contact',id]` on success, sonner toasts), `use-contacts.ts` orchestrator re-export.
- **VERIFY:** `tsc --noEmit`; mutating then refetch reflects change; toast fires.
- **ROLLBACK:** delete the 3 files.

#### P1-T7 — Contact form (PF/PJ) + sections
- **agent:** frontend-specialist • **skill:** app-builder • **priority:** P1 • **deps:** P1-T6
- **INPUT:** `ui/form`, react-hook-form+zod; reuse `<CEPLookup>` + `src/utils/cep-lookup.ts`; `ui/multi-select.tsx`.
- **OUTPUT:** `form/contact-form.tsx` switching on `kind`; `person-type-toggle.tsx` (radio-group), `basic-info-section.tsx` (conditional PF/PJ fields), `contact-info-section.tsx`, `address-section.tsx` (CEP autofill), `roles-section.tsx` (multi-select papéis + per-role notes; form value `{role, notes}[]`). Debounced dedup warning on blur of CPF/CNPJ/email/phone → `ui/alert` + "Ver contato" (non-blocking).
- **VERIFY:** create a PF and a PJ each with ≥1 role; zod blocks empty `display_name`; CEP fills address; duplicate input warns but still saves.
- **ROLLBACK:** delete `form/` dir.

#### P1-T8 — List page (cards + filter + table/card toggle)
- **agent:** frontend-specialist • **skill:** app-builder • **priority:** P1 • **deps:** P1-T6
- **OUTPUT:** `contact-list.tsx`, `contact-summary-cards.tsx` (SnapshotCard pattern), `contact-filter-panel.tsx`, `contact-table.tsx`, `contact-card.tsx`, `contact-row-actions.tsx` (dropdown: ver/editar/vincular/excluir AlertDialog), `contact-status-badge.tsx`, `contact-role-chips.tsx`. Skeleton/empty/error states. Responsive table→card `<md`.
- **VERIFY:** list renders, search + role/status filter work, soft-delete via AlertDialog removes row from list; below `md` switches to cards.
- **ROLLBACK:** delete listed components.

#### P1-T9 — Detail page + Visão Geral tab (shell only)
- **agent:** frontend-specialist • **skill:** app-builder • **priority:** P1 • **deps:** P1-T6
- **INPUT:** Tabs shell + hero from `property-detail.tsx` (lines ~140–166); reuse `property-hero-header`.
- **OUTPUT:** `detail/contact-detail.tsx` (hero + Tabs grid-cols-2 md:grid-cols-7), `contact-hero-header.tsx`, `detail/tabs/overview-tab.tsx` populated. Other 6 tab triggers rendered but placeholder/"em breve"; Financeiro & Documentos triggers gated by `hasPermission` (hidden if absent).
- **VERIFY:** `/contacts/:id` renders hero + overview; gated tabs hidden for a viewer lacking perms.
- **ROLLBACK:** delete `detail/` dir.

#### P1-T10 — Routes + sidebar + permission prefetch
- **agent:** frontend-specialist • **skill:** clean-code • **priority:** P1 • **deps:** P1-T7, P1-T8, P1-T9
- **INPUT:** `AppRoutes.tsx` lazy pattern; `animated-sidebar.tsx` ~line 403; `auth-provider.tsx` line 22.
- **OUTPUT:** 3 thin pages (`ContactsPage`, `ContactDetailPage`, `ContactFormPage`); lazy routes `/contacts` (contacts.view), `/contacts/new` (contacts.create), `/contacts/edit/:id` (contacts.edit), `/contacts/:id` (contacts.view) with **`:id` declared LAST** to avoid shadowing `/new`; sidebar item `{ label:'Contatos', href:'/contacts', icon:<Users/> }` between Locações and Agenda, gated `hasPermission('contacts.view')`, with `startsWith('/contacts')` active clause; add `contacts.view`/`create`/`edit` to `COMMON_PERMISSIONS`.
- **VERIFY:** sidebar shows Contatos for permitted user, hidden otherwise; `/contacts/new` does NOT resolve to detail; direct nav to a gated route → Unauthorized.
- **ROLLBACK:** revert the 3 modified files + delete 3 pages.

#### P1-T11 — RLS isolation + permission test (automated)
- **agent:** test-engineer • **skill:** clean-code • **priority:** P0 • **deps:** P1-T2, P1-T3, P1-T5
- **OUTPUT:** script/test creating contacts as user A (org 1) and asserting user B (org 2) sees 0; user in no client scope sees only own; `system_admin` permission-allowed yet RLS-blocked from org 1's contacts.
- **VERIFY:** test passes (cross-org leakage = FAIL).
- **ROLLBACK:** n/a (test artifact).

---

### PHASE 2 — Property & Contract Links + reusable combobox (shippable: link contacts to properties/contracts, see them in those detail pages, pick/quick-create from forms)

> Depends on Phase 1 complete. Additive only — no existing column changes.

#### P2-T1 — Migration: contact_links
- **agent:** database-architect • **skill:** clean-code • **priority:** P0 • **deps:** P1-T1
- **OUTPUT:** `2026XXXX02_contact_links.sql`: `contact_property_links` (contact_id CASCADE, property_id→properties CASCADE, user_id, client_id, link_role CHECK('tenant','owner','guarantor','manager','other'), notes, deleted_at; UNIQUE(contact_id,property_id,link_role) WHERE deleted_at IS NULL), `contact_contract_links` (link_role CHECK('tenant','guarantor','owner','agency','agency_responsible','lawyer','other'), same shape), `contact_interactions` (interaction_type CHECK(...), subject, body, occurred_at default now(), property_id NULL, contract_id NULL, metadata jsonb, deleted_at; index (contact_id, occurred_at DESC)). Partial client_id indexes.
- **VERIFY:** migration applies; 3 tables + UNIQUE partial constraints + interaction index exist.
- **ROLLBACK:** delete migration file.

#### P2-T2 — RLS for the 3 link/interaction tables
- **agent:** security-auditor • **priority:** P0 • **deps:** P2-T1
- **OUTPUT:** `_access_own_or_client` FOR ALL policy on each; RLS enabled.
- **VERIFY:** `pg_policies` lists all 3; isolation test extended (P2-T8).
- **ROLLBACK:** drop policies.

#### P2-T3 — API: contact-links.ts
- **agent:** backend-specialist • **priority:** P1 • **deps:** P2-T1, P1-T5
- **OUTPUT:** `linkContactToProperty`/`unlink`, `linkContactToContract`/`unlink`, `fetchPropertyContacts`, `fetchContractContacts` (each insert sets user_id+client_id denormalized; filter `deleted_at IS NULL`).
- **VERIFY:** link then fetch returns row; duplicate same (contact,entity,role) blocked by UNIQUE; unlink soft-deletes.
- **ROLLBACK:** delete file.

#### P2-T4 — API: contact-interactions.ts
- **agent:** backend-specialist • **priority:** P2 • **deps:** P2-T1
- **OUTPUT:** `fetch/create/update/softDelete` interactions; create sets user_id+client_id.
- **VERIFY:** create + fetch ordered by occurred_at DESC works.
- **ROLLBACK:** delete file.

#### P2-T5 — Hook: use-contact-links
- **agent:** frontend-specialist • **priority:** P1 • **deps:** P2-T3
- **OUTPUT:** `use-contact-links.ts` with keys `['contact-links',entityType,entityId]` and `['contact-links','contact',id]`; mutations invalidate both sides.
- **VERIFY:** linking from a property view updates both property's and contact's linked lists.
- **ROLLBACK:** delete file.

#### P2-T6 — ContactCombobox + QuickCreate dialog
- **agent:** frontend-specialist • **skill:** app-builder • **priority:** P1 • **deps:** P1-T7, P1-T6
- **INPUT:** `ui/command` + `ui/popover`; trimmed `contact-form.tsx`.
- **OUTPUT:** `contact-combobox.tsx` (props `value/onChange/roleFilter/allowCreate`; no-match → "Criar contato '<termo>'") + `contact-quick-create-dialog.tsx` (`ui/dialog` wrapping trimmed form, returns id, `setQueryData`/invalidate `['contacts']`, NO navigation).
- **VERIFY:** typing a new name → quick-create → dialog returns id and combobox shows it selected without leaving the page.
- **ROLLBACK:** delete both files.

#### P2-T7 — LinkedContactsSection injected into property + contract detail
- **agent:** frontend-specialist • **skill:** app-builder • **priority:** P1 • **deps:** P2-T5, P2-T6
- **INPUT:** `property-detail.tsx` (tabs), `ContractDetailPage.tsx` (card-based, no tabs).
- **OUTPUT:** generic `linked-contacts-section.tsx` (`entityType: 'property' | 'contract'`); injected into property-detail (8th tab or in Visão geral) and into ContractDetailPage as a Card; uses ContactCombobox to add links; "contrato sem contato vinculado" `ui/alert` nudge.
- **VERIFY:** add/remove a linked contact from each detail page; gated by `contacts.links.manage` for edit actions; read still works with view-only perms.
- **ROLLBACK:** revert the 2 modified detail files; delete `linked-contacts-section.tsx`.

#### P2-T8 — Extend isolation test to link tables
- **agent:** test-engineer • **priority:** P0 • **deps:** P2-T2, P2-T3
- **OUTPUT:** assert org B cannot read org A's property/contract links or interactions.
- **VERIFY:** test passes.

---

### PHASE 3 — Contract compatibility / dual-write transition (shippable: contract forms write contacts AND keep legacy text; optional manual backfill)

> 🔴 **USER DECISION before Phase 3 (D5 below):** confirm **dual-write with legacy text authoritative** during transition (recommended), and that backfill is **manual, per-record, disabled by default**. Replacing free-text fields outright is HIGHER blast radius — do not do it without explicit approval.

#### P3-T1 — Migration: alter contracts (optional primary_contact_id)
- **agent:** database-architect • **priority:** P1 • **deps:** P2-T1
- **OUTPUT:** part of `2026XXXX03_contact_alter_existing.sql` — add nullable `primary_contact_id uuid → contacts ON DELETE SET NULL` + partial index to `contracts` (N:N stays in `contact_contract_links`). No drop of `tenant_*`/`agency_*`.
- **VERIFY:** column added nullable; existing contract reads/writes unaffected.
- **ROLLBACK:** drop column (nothing depends on it yet).

#### P3-T2 — Backfill routine (idempotent, DISABLED by default)
- **agent:** database-architect • **priority:** P2 • **deps:** P3-T1
- **OUTPUT:** `2026XXXX04_contact_backfill_optional.sql` — a callable routine that converts `tenant_*`/`agency_*` text → `contacts` + `contact_contract_links`, idempotent (re-runnable), NOT auto-executed; documented "run manually per org".
- **VERIFY:** routine defined; running twice on the same data produces no duplicates; text columns untouched.
- **ROLLBACK:** drop routine.

#### P3-T3 — Wire ContactCombobox into contract-form (dual-write)
- **agent:** frontend-specialist • **skill:** app-builder • **priority:** P1 • **deps:** P2-T6, P3-T1
- **INPUT:** `src/components/contracts/contract-form.tsx` (proprietário/inquilino fields).
- **OUTPUT:** ContactCombobox AUGMENTS (does not remove) the free-text fields: selecting a contact links it (`contact_contract_links`) + sets `primary_contact_id`, AND keeps writing `tenant_*`/`agency_*` text (text stays authoritative). "Vincular contato" per-record action on existing contracts.
- **VERIFY:** saving a contract with a selected contact writes BOTH the link row and the legacy text; existing contracts without a contact still save unchanged.
- **ROLLBACK:** revert `contract-form.tsx` (links table untouched, harmless).

#### P3-T4 — Contracts tab on contact detail
- **agent:** frontend-specialist • **priority:** P2 • **deps:** P2-T3, P1-T9
- **OUTPUT:** `detail/tabs/contracts-tab.tsx` + `properties-tab.tsx` populated from `fetchContractContacts`/`fetchPropertyContacts` (reverse lookup).
- **VERIFY:** a contact linked to a contract appears under its Contratos tab.
- **ROLLBACK:** revert tab files to placeholder.

---

### PHASE 4 — Peripherals: contact_id on FT/documents/agenda + remaining tabs (shippable: full 360 view, optional links from finance/docs/agenda)

> 🔴 **USER DECISION before Phase 4 (D1 below):** accept that the **Financeiro tab is USER-SCOPED** (shows only the current user's transactions; `financial_transactions` has NO `client_id`) and ship with a UI disclaimer. A finance-wide `client_id` migration is OUT OF SCOPE here (separate future migration, large blast radius across `financial-dashboard.ts` etc.).

#### P4-T1 — Migration: contact_id on financial_transactions, documents, agenda_events
- **agent:** database-architect • **priority:** P1 • **deps:** P2-T1
- **OUTPUT:** in `2026XXXX03_contact_alter_existing.sql` — add nullable `contact_id uuid → contacts ON DELETE SET NULL` + partial index to each of `financial_transactions`, `documents`, `agenda_events`. (Documents = single FK, NOT a polymorphic link table — see D2.)
- **VERIFY:** 3 nullable columns added; existing flows for those tables unaffected.
- **ROLLBACK:** drop the 3 columns.

#### P4-T2 — API: document/transaction link helpers
- **agent:** backend-specialist • **priority:** P2 • **deps:** P4-T1
- **OUTPUT:** `linkContactToDocument`, `linkContactToTransaction` in `contact-links.ts`; reverse fetchers for the contact tabs.
- **VERIFY:** setting contact_id on a document then fetching by contact returns it.
- **ROLLBACK:** revert added functions.

#### P4-T3 — Financeiro tab (user-scoped + disclaimer)
- **agent:** frontend-specialist • **priority:** P2 • **deps:** P4-T1, P1-T9
- **OUTPUT:** `detail/tabs/financial-tab.tsx` gated `contacts.financial.view` (trigger hidden + query `enabled: hasPermission && !!id`); prominent `ui/alert` disclaimer "mostra apenas suas transações" reflecting user-scope asymmetry.
- **VERIFY:** tab hidden without perm; disclaimer visible; only current user's contact-linked transactions shown.
- **ROLLBACK:** revert tab to placeholder.

#### P4-T4 — Documentos, Agenda, Histórico tabs
- **agent:** frontend-specialist • **priority:** P2 • **deps:** P4-T1, P2-T4
- **OUTPUT:** `documents-tab.tsx` (gated `contacts.documents.view`), `agenda-tab.tsx` (from `agenda_events.contact_id`), `history-tab.tsx` (interactions timeline via `use-contact-interactions`, with create-interaction action gated `contacts.interactions.manage`).
- **VERIFY:** each tab loads its source; one failing source (Promise.allSettled) does not blank the page; gated tabs hidden without perm.
- **ROLLBACK:** revert tab files to placeholder.

#### P4-T5 — Wire combobox into transaction/document/agenda forms
- **agent:** frontend-specialist • **priority:** P3 • **deps:** P2-T6, P4-T1
- **OUTPUT:** ContactCombobox added (optional field) to the transaction form, document form, and agenda `activity-form.tsx`, writing `contact_id`.
- **VERIFY:** selecting a contact persists contact_id; leaving it null still saves.
- **ROLLBACK:** revert those forms.

#### P4-T6 — Final cross-module isolation + 360 smoke test
- **agent:** test-engineer • **priority:** P0 • **deps:** P4-T2, P4-T4
- **OUTPUT:** assert FT/document/agenda contact links respect RLS; `fetchContact360` returns partial data when one source errors.
- **VERIFY:** test passes; 360 resilient to a single-source failure.

---

## Dependency Graph (summary)

```
P1-T1 ─┬─ P1-T2 ─┬─ P1-T11
       ├─ P1-T3 ─┘
       ├─ P1-T4 ─ P1-T5 ─ P1-T6 ─┬─ P1-T7 ─┐
       │                          ├─ P1-T8 ─┼─ P1-T10
       │                          └─ P1-T9 ─┘
P2-T1 ─┬─ P2-T2 ─ P2-T8
       ├─ P2-T3 ─ P2-T5 ─┐
       ├─ P2-T4           ├─ P2-T7
       └─ (P2-T6 needs P1-T6/T7)
P3-T1 ─ P3-T2 ; P3-T3 (needs P2-T6) ; P3-T4 (needs P2-T3)
P4-T1 ─ P4-T2 ─ P4-T6 ; P4-T3/T4/T5 (need P4-T1, P2-T6)
```
Cross-phase blocker: every phase requires the prior phase's migrations applied. Within a phase, different-file/different-agent tasks may run in parallel.

---

## Risks & Open Decisions

| # | Decision / Risk | Recommendation | USER decision needed? | Gate |
|---|---|---|---|---|
| **D1** | **Finance user-scope asymmetry** — `financial_transactions` has no `client_id`; Financeiro tab shows only current user's data while rest of 360 is org-wide. | Ship Phase 4 user-scoped **with UI disclaimer**. Do NOT bundle a finance-wide `client_id` migration (huge blast radius). | **YES** | Before Phase 4 |
| **D2** | Documents: single FK vs polymorphic `document_links`. | Single nullable `contact_id` FK on `documents` (over-engineering otherwise). Escalate only if one doc must link to multiple contacts at once. | Optional | Phase 4 |
| **D3** | Soft-delete (`deleted_at`) diverges from rest-of-app hard-delete. | Use soft-delete for contacts/links; filter in app layer (`.is('deleted_at', null)`), not RLS. Accept divergence (safer for a shared registry). | No (note in plan) | Phase 1 |
| **D4** | Dedup warn-not-block (NON-UNIQUE indexes). | Warn only; never block save. Same person may legitimately recur. | No | Phase 1 |
| **D5** | **Dual-write source-of-truth** during contract transition. | Legacy `tenant_*`/`agency_*` text stays authoritative; contacts dual-written; backfill manual + disabled by default. Do NOT replace free-text fields outright. | **YES** | Before Phase 3 |
| **D6** | `client_id` denormalization sync drift. | Make `contacts.client_id` **immutable post-create**; link rows copy it on insert. | No (enforce in API) | Phase 1 |
| **D7** | Role taxonomy + `kind` lock-in (text+CHECK → migration per new value). | Confirm 12-role list and `kind ∈ {'pf','pj'}` now. `person_type` UI naming MUST map to backend `kind`. | **YES** | Before Phase 1 |
| **D8** | `activities` vs `contact_interactions`. | Keep separate (activities = operational/user-scoped, no contact_id). | No | Phase 2 |
| **D9** | Permission bypass: `admin`/`system_admin` skip granular `contacts.*`. | Expected; only manager/user/viewer differentiated. `system_admin` still RLS-blocked from other orgs (correct). | No (document) | Phase 1 |
| **D10** | Detail full-page vs modal. | Full page (consistent with Imóveis/Locações). | Confirm if disputed | Phase 1 |
| **D11** | Sidebar visibility for `system_admin`. | Show normally; gate by `contacts.view`. | Optional | Phase 1 |

---

## Phase X — Verification Checklist (run at the end of EACH phase)

### Automated gates (all phases)
- [ ] `npm run lint` → no new errors
- [ ] `npx tsc --noEmit` → clean
- [ ] `npm run build` → success, no new warnings
- [ ] Migrations apply cleanly forward (`supabase db push`/`reset`) AND each new migration is individually reversible

### Phase 1
- [ ] RLS isolation test (P1-T11) passes: org A contact invisible to org B; no-client user sees only own
- [ ] 9 `contacts.*` permissions seeded; viewer/manager/user grants correct; admin/system_admin bypass confirmed
- [ ] Smoke: create PF + PJ (each ≥1 role), edit, soft-delete (row hidden not destroyed), list filters, `/contacts/new` not shadowed by `/contacts/:id`, sidebar item visible only with `contacts.view`, dedup warns non-blocking

### Phase 2
- [ ] Link tables isolation test (P2-T8) passes
- [ ] Smoke: link/unlink contact to a property and a contract; LinkedContactsSection renders in both detail pages; ContactCombobox quick-create returns id with no navigation; UNIQUE prevents duplicate link

### Phase 3
- [ ] Smoke: contract save dual-writes (link row + legacy text); contracts WITHOUT a contact still save unchanged; backfill routine idempotent and disabled-by-default; Contratos/Imóveis reverse tabs populate
- [ ] Regression: existing contract list/detail/create/edit untouched

### Phase 4
- [ ] Final cross-module isolation + 360 resilience test (P4-T6) passes
- [ ] Smoke: contact_id optional on FT/document/agenda forms (null still saves); Financeiro tab user-scope disclaimer visible + perm-gated; Documentos/Agenda/Histórico tabs load; one failing 360 source does not blank the page

### Phase X Completion Marker (append after ALL phase checks pass)
```markdown
## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Type check: ✅ Pass
- Security/RLS isolation: ✅ No cross-org leakage
- Build: ✅ Success
- Date: <fill on completion>
```

> 🔴 EXIT GATE: This marker must be present in this file before the Contatos module is considered complete. Do NOT mark `[x]` without actually running the check.

---

**Plan grounding note:** All referenced paths were verified against the live repo on branch `feature/agenda-operacional` — `src/routes/AppRoutes.tsx` (lazy + `<ProtectedRoute>`), `src/components/layout/animated-sidebar.tsx` (active sidebar; `app-sidebar.tsx` legacy), `src/components/auth/auth-provider.tsx` line 22 `COMMON_PERMISSIONS`, `src/api/contracts.ts` (house style), `src/hooks/use-contracts.ts` (split convention), `src/components/properties/cep-lookup.tsx` + `src/utils/cep-lookup.ts`, `src/components/properties/property-detail.tsx` (Tabs/SnapshotCard/status-badge), `src/components/ui/{multi-select,command}.tsx`, and migration template `supabase/migrations/20260531023000_agenda_operational_events.sql` (latest is `20260531113000_agenda_operational_hardening.sql`, so new migrations sort after it).
