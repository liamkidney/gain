# Gain — feature plan

**Purpose:** A fast, local-first resistance-training diary for experienced gym users. Gain records training and exposes useful analytics; it does not prescribe or adapt programmes.

**Working agreement:** Keep this file current as features are implemented, changed or explicitly requested. Add no speculative requirements. Development goes to `dev` only; promote to `main` after testing and explicit user approval, as set out in the App Launch Playbook.

## MVP scope

- [x] Workouts inbox: chronological records, date circles, divider above first row and between rows; swipe left for Repeat / Archive; archived records can be restored
- [x] Three bottom tabs: Workouts / Templates / Analytics
- [x] Empty workout and template-based workout, using the same editor as repeated workouts
- [x] Searchable curated exercise catalogue, instructions and original schematic illustrations; add custom exercises
- [x] Inline viewing/editing of workouts and templates, prefilling, one-tap logging of sets, add/remove/reorder exercises and sets; no finish workout step
- [x] Edit dates and old workouts; add backdated sessions; no special substitution data model
- [x] Templates create/edit/delete; use previous completed performance when starting
- [x] Exercise analytics: max weight, estimated 1RM, volume; date ranges and inspect individual sessions
- [x] IndexedDB local persistence, draft recovery, JSON export/import; offline PWA assets
- [x] Automated tests and dev/prod build configuration
- [ ] Deploy dev to GitHub Pages and test in an installed iPhone PWA
- [ ] Promote to production only after explicit approval and full dev verification

## UI refinements — 10 November 2026

- [x] Remove the workout completion/in-progress workflow and separate read-only view. Historical workouts open directly in the same editable screen as new/repeated sessions; changes auto-save.
- [x] Swipe left on a workout history row to reveal Repeat and Archive; show an Archived view with Restore. Archive removes workouts from statistics, graphs and previous-set suggestions without destroying the data.
- [x] Opening a workout from history animates the screen in from the left; respect reduced-motion preferences.
- [x] Replace the original green palette with restrained charcoal, cool greys and slate-blue accents; simplify workout layout.
- [ ] Validate swipe gestures, inline editing and archive behaviour on a real iPhone.

## Explicitly deferred

- Login and Supabase account-backed synchronisation, keeping the local-first data layer
- More advanced training analytics (frequency and muscle-group sets)
- Rest timer
- Social posting/shareable training graphics
- Advanced multi-week programmes

## Decisions

- Historical workouts represent actual activity; templates represent reusable planned sessions.
- Repeat copies the historical workout's exercises and set values, with all *set logging* flags reset. Workouts themselves have no completion status.
- Freely edit today's exercises without recording "substitutions" or "skips" as special events.
- Workout history remains fully editable in place, including retrospective entries. Archiving is reversible and excludes archived sets from analytics.
- Persist local records with stable UUIDs and timestamps; no cloud backend or login during MVP.
- dev and prod use separate IndexedDB databases to avoid test entries contaminating real history.
