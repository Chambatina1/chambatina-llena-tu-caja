# Task 1-7: LLC Service Configuration System

## Summary
Implemented a complete service configuration system for the Chambatina LLC platform, allowing admins to manage services and pricing dynamically through a database-backed configuration.

## Files Created
- `src/components/chambatina/llc/llc-services-config.tsx` — Full admin panel for managing services

## Files Modified
- `src/components/chambatina/llc/llc-admin.tsx` — Added tab toggle between Filing Management and Services Configuration
- `src/components/chambatina/llc/llc-wizard.tsx` — Updated Step 7 and Review to use API services with fallback
- `src/components/chambatina/llc/llc-client-page.tsx` — Updated payment breakdown to use API services with fallback
- `src/app/api/llc/filings/[id]/pay/route.ts` — Updated QB invoice creation to use service-based line items

## Key Design Decisions
- All components use backward compatibility: if no API services exist, fall back to hardcoded state data
- API services are loaded via `GET /api/llc/services?stateCode=XX&includeGlobal=true`
- Selected services stored as JSON array of service IDs in `optionalServices` field
- Categories: state_fee, expedited, required, optional — each rendered differently in wizard
- QB invoice routes services with qbItemRef to their own line items; others grouped as before
- Amber theme consistent with existing code style
- All text in Spanish
