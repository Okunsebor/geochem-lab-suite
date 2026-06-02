# RBAC Matrix (Phase 1)

Source requirements: `docs/WBS.md` + project RBAC hardening work.

## Roles (required)

- **Admin**
- **Lab Coordinator** (covers �Lab Coordinator / Lab Staff� in WBS)
- **Customer**

## Enforcement layers implemented

- **Frontend**: TanStack Router `beforeLoad` session gates on `/app`, `/coordinator`, `/portal` (pre-render).
- **Backend (server runtime)**: request middleware enforces auth for any future `/api/*` endpoints.
- **Database**: Supabase Postgres **RLS policies** are the source of truth for authorization; role escalation is blocked by DB trigger.

## Route access

| Route / Area | Customer | Lab Coordinator | Admin |
|---|---:|---:|---:|
| Public landing (`/`) | ? | ? | ? |
| Login/Register/Forgot/Verify | ? | ? | ? |
| Customer Portal (`/portal/*`) | ? | ?? (redirect) | ?? (redirect) |
| Lab Coordinator Workspace (`/coordinator/*`) | ?? | ? | ? (redirect to Admin) |
| Admin Workspace (`/app/*`) | ?? | ?? | ? |

## Feature access (WBS + your requirements)

| Feature | Customer | Lab Coordinator | Admin |
|---|---:|---:|---:|
| Customer dashboard | ? | ?? | ?? |
| Sample submission | ? | ?? | ?? |
| Sample tracking | ? (own org only) | ? | ? |
| Reports (view/download) | ? (delivered only; own org) | ? | ? |
| Sample management | ?? | ? | ? |
| Verification | ?? | ? | ? |
| Preparation workflows | ?? | ? | ? |
| Analysis workflows | ?? | ? | ? |
| User management | ?? | ?? | ? |
| System settings | ?? | ?? | ? |
| Report approval | ?? | ?? | ? |

## Database (RLS) access summary

Notation: **S/I/U/D** = Select/Insert/Update/Delete.

| Table | Customer | Lab Coordinator | Admin |
|---|---:|---:|---:|
| `public.users` | S/U (self; **no role/org change**) | S (per existing base policies) | S/U (admin-only role changes) |
| `public.organizations` | S (own org) | S | S |
| `public.projects` | S (own org) | S | S |
| `public.samples` | S (own org) | S/I/U/D | S/I/U/D |
| `public.custody_logs` | S (own org) | S/I/U/D | S/I/U/D |
| `public.sample_notes` | S (own org) | S/I/U/D | S/I/U/D |
| `public.analytical_results` | S (passed only; own org) | S/I/U/D | S/I/U/D |
| `public.sample_attachments` | S (own org) | S/I/U/D | S/I/U/D |
| `public.reports` | **S (Delivered only; own org)** | S/I/U/D | S/I/U/D |
| `public.report_logs` | ?? | S/I/U/D | S/I/U/D |
| `public.preparation_jobs` | ?? | S/I/U/D | S/I/U/D |
| `public.preparation_steps` | ?? | S/I/U/D | S/I/U/D |
| `public.analytical_runs` | ?? | S/I/U/D | S/I/U/D |
| `public.calibration_records` | ?? | S/I/U/D | S/I/U/D |
| `public.qa_flags` | ?? | S/I/U/D | S/I/U/D |
| `public.analytical_methods` | ?? | S | S |
| `public.auth_audit_events` | I (self login/logout only) | I (via triggers only) | S/I (via triggers only) |
| `public.audit_logs` (row change audit) | ?? | ?? | S (admin/manager per base policy) |

## Audit logging coverage

| Event | How logged | Where |
|---|---|---|
| Login | client best-effort insert after successful verified sign-in | `public.auth_audit_events` |
| Logout | client best-effort insert immediately before sign-out | `public.auth_audit_events` |
| Role changes | DB trigger on `public.users` update | `public.auth_audit_events` |
| User creation | DB trigger on `public.users` insert | `public.auth_audit_events` |
| User deletion | DB trigger on `public.users` delete | `public.auth_audit_events` |

## Anti-escalation guarantees

- **DB trigger** blocks non-admin updates to `public.users.role` and `public.users.organization_id`.
- Permissive �`auth.role() = 'authenticated'`� RLS policies were removed and replaced with role/org-aware policies.

