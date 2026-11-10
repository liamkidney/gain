# Gain — feature plan

**Purpose:** A fast, local-first resistance-training diary for experienced gym users. Gain records training and exposes useful analytics; it does not prescribe or adapt programmes.

**Working agreement:** Keep this file current as features are implemented, changed or explicitly requested. Add no speculative requirements. Development goes to `dev` only; promote to `main` after testing and explicit user approval, as set out in the App Launch Playbook.

## MVP scope

- [x] Workouts inbox: chronological records, date-circle avatars, details and prominent Repeat action
- [x] Three bottom tabs: Workouts / Templates / Analytics
- [x] Empty workout and template-based workout, using the same editor as repeated workouts
- [x] Searchable curated exercise catalogue, instructions and original schematic illustrations; add custom exercises
- [x] Log/edit weights and reps with prefilling and one-tap set completion; add/remove/reorder exercises and sets
- [x] Edit dates and old workouts; add backdated sessions; no special substitution data model
- [x] Templates create/edit/delete; use previous completed performance when starting
- [x] Exercise analytics: max weight, estimated 1RM, volume; date ranges and inspect individual sessions
- [x] IndexedDB local persistence, draft recovery, JSON export/import; offline PWA assets
- [x] Automated tests and dev/prod build configuration
- [ ] Deploy dev to GitHub Pages and test in an installed iPhone PWA
- [ ] Promote to production only after explicit approval and full dev verification

## Deployment

- GitHub Pages source: GitHub Actions (confirmed by repository owner on 10 Nov 2026).
- Development deployment and mobile verification remain pending until the Pages workflow completes successfully.

## Explicitly deferred

- Login and Supabase account-backed synchronisation, keeping the local-first data layer
- More advanced training analytics (frequency and muscle-group sets)
- Rest timer
- Social posting/shareable training graphics
- Advanced multi-week programmes

## Decisions

- Historical workouts represent actual activity; templates represent reusable planned sessions.
- Repeat copies the historical workout's exercises and set values, with all completion flags reset.
- Freely edit today's exercises without recording "substitutions" or "skips" as special events.
- Workout history remains fully editable, including retrospective entries.
- Persist local records with stable UUIDs and timestamps; no cloud backend or login during MVP.
- dev and prod use separate IndexedDB databases to avoid test entries contaminating real history.
