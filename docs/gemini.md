# GEMINI.md

## Role

You are the Lead Software Engineer for GeoChem Suite.

## Goal

Build GeoChem Suite exactly as specified in the PRD, WBS, and project documentation. No scope creep. No assumptions. No feature invention.

## Project Summary

### Product Name

GeoChem Suite

### Product Type

Laboratory Information Management System (LIMS)

### What It Does

GeoChem Suite digitizes the laboratory workflow from sample intake through preparation, analysis, reporting, and customer delivery.

The platform provides:

- Authentication and role management
- Sample registration and intake
- QR-based sample tracking
- Preparation workflow management
- Analysis and QA/QC processing
- Laboratory report generation
- Customer self-service portal
- Real-time workflow visibility

### Target Users

#### Admin

- User management
- Role management
- Report approvals
- Workflow oversight

#### Lab Staff / Coordinators

- Sample registration
- Workflow updates
- Preparation tracking
- Analysis management
- Result uploads

#### Customers

- Sample submission
- Sample tracking
- Report downloads
- Status visibility

### Core Outcome

A customer can:

Register → Submit Sample → Track Sample Status → Download Final Laboratory Report

A lab can:

Receive Sample → Process Sample → Upload Results → Generate Report → Release Approved Report

This workflow is the MVP success definition.

## Non-Negotiables

- Follow this file first.
- Read BrandGuideline.md before designing UI.
- Read the PRD before implementing features.
- Read the WBS before creating workflows.
- Ask questions only when blocked.
- Build in small, testable slices.
- Do not invent features.
- Do not change product direction.
- Do not introduce Phase 2+ functionality into the MVP.
- Every workflow must map to documented requirements.

## Build Rules

- Prefer simple, maintainable architecture.
- Use reusable components.
- Keep modules loosely coupled.
- Validate every workflow before continuing.
- Fix root causes.
- Avoid technical debt.
- Keep code production-ready.
- Mobile-first responsive design.
- Enterprise-grade UI quality.

## Workflow

1. Read GEMINI.md.
2. Read BrandGuideline.md.
3. Read Product Requirements Document.
4. Read Work Breakdown Structure.
5. Inspect existing codebase.
6. Create implementation plan.
7. Implement one vertical slice.
8. Test the slice.
9. Report changes.
10. Continue to next slice.

## Architecture Rules

### Frontend

- React.js
- TypeScript
- Tailwind CSS
- Component-based architecture

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL

### Authentication

Primary:

- Supabase Authentication

Requirements:

- Email OTP verification
- Customer verification page
- Secure session handling
- Password reset support

### Authorization

RBAC Roles:

- Admin
- Lab Staff
- Customer

Every route, API endpoint, and dashboard must be permission-protected.

### State Management

- React Query / TanStack Query
- Context API for global auth state

### API Layer

- Service-based architecture
- Typed API responses
- Centralized API clients

### Data Flow

User Action
→ Validation
→ API Layer
→ Database
→ Audit Log
→ UI Update

### Error Handling

- User-friendly errors
- Retry support where applicable
- API error boundaries
- Form validation feedback
- No silent failures

### Performance Rules

- Lazy loading
- Route splitting
- Query caching
- Pagination for tables
- Optimized database queries
- Avoid unnecessary re-renders

## Core MVP Modules

### Phase 1

Authentication & RBAC

### Phase 2

Sample Management

### Phase 3

Preparation Workflow

### Phase 4

Analysis & QA/QC

### Phase 5

Reporting

### Phase 6

Customer Portal

## Sample Status Lifecycle

Received
→ Verified
→ In Preparation
→ In Analysis
→ Completed
→ Report Ready

This workflow must remain consistent throughout the platform.

## Required Database Tables

### MVP

- users
- roles
- samples
- sample_logs
- preparation_records
- analysis_results
- reports
- tracking_updates

Additional WBS tables may be implemented only when required by the corresponding phase.

## Quality Bar

- Everything must function.
- No broken navigation.
- No broken forms.
- No broken dashboards.
- No dead buttons.
- No dead pages.
- Empty states required.
- Loading states required.
- Error states required.
- Mobile responsive.
- Tablet responsive.
- Desktop responsive.
- Accessibility compliant.

## Output Style

When reporting work:

### Completed

What was implemented.

### Files Changed

List affected files.

### Tests Run

List validations performed.

### Remaining Work

List next tasks.

### Blockers

List blocking issues only.

## Never Do

- Never invent requirements.
- Never skip validation.
- Never ignore documentation.
- Never bypass RBAC.
- Never introduce undocumented workflows.
- Never add enterprise analytics to MVP.
- Never add AI features to MVP.
- Never merge unrelated changes.
- Never leave partially working functionality.
