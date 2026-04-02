# Campaign: Find Help Page — COMPLETED

## Work Plan
`.planning/plans/find-help-page.json`

## Decisions
1. `/support` page remains but gets cross-link banner to `/find-help` (decision-001)
2. `/find-help` is the canonical helplines destination for all nav/cross-links (decision-002)
3. `/mental-health-professionals` remains as full directory, linked from `/find-help` preview (decision-003)

## Task Progress

| Task | Phase | Layer | Status | Files |
|------|-------|-------|--------|-------|
| task-001: Add filter params to getAllMentalHealthProfessionals | P0 | data | complete | `lib/getAllMentalHealthProfessionals.ts` |
| task-003: Create /find-help page.tsx | P1 | integration | complete | `app/find-help/page.tsx` |
| task-004: HeroSection component | P1 | ui | complete | `app/find-help/HeroSection.tsx` |
| task-005: CrisisSection component | P1 | ui | complete | `app/find-help/CrisisSection.tsx` |
| task-006: TherapistPreviewSection | P1 | ui | complete | `app/find-help/TherapistPreviewSection.tsx` |
| task-007: GuidanceSection component | P1 | ui | complete | `app/find-help/GuidanceSection.tsx` |
| task-008: DirectoriesSection component | P1 | ui | complete | `app/find-help/DirectoriesSection.tsx` |
| task-009: Update Header nav link | P2 | navigation | complete | `components/Header.tsx` |
| task-010: Update CrisisBanner link | P2 | navigation | complete | `components/CrisisBanner.tsx` |
| task-011: Update Footer link | P2 | navigation | complete | `components/Footer.tsx` |
| task-012: Add to sitemap | P2 | integration | complete | `app/sitemap.ts` |
| task-014: Cross-link banner on /support | P2 | navigation | complete | `app/support/page.tsx` |
| task-013a: Cross-link audit (5 pages) | P2 | navigation | complete | `start-here, about, privacy, terms, resources` |
| task-013b: Build verification | P2 | integration | complete | `pnpm build` exit 0 |

## Verification
- TypeScript: `tsc --noEmit` passes (0 errors)
- Build: `pnpm build` passes (exit 0)
- Routes confirmed: /find-help, /support, /mental-health-professionals, /mental-health-professionals/[slug]
- Cross-link audit: 0 remaining `/support#helplines` references in codebase

## Status: COMPLETED
