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

## Navigation polish — 10 Nov 2026

- [x] Remove the three-dot action from history rows; swipe left remains the mechanism for Repeat / Archive.
- [x] Opening a workout slides its screen in from the right (~360 ms); Back slides it out to the right to reveal the prior page.
- [ ] Confirm the transitions and swipe behaviour on an actual iPhone.

## Branding — 11 Nov 2026

- [x] Apply Graphite & Copper across the UI, charts, exercise diagrams and installed-app chrome on `dev`.
- [x] Keep the existing blue dev and red production app icons.
- [ ] Check the new dark theme on a real iPhone before promotion.

## Inbox and navigation refinements — 11 Nov 2026

- [x] Use locally vendored, licensed Lucide icons for Workouts, Templates, Analytics and Settings.
- [x] Inbox dividers begin after the circular dates, including the divider above the first entry.
- [x] Remove the redundant History heading and the Archived counter.
- [x] Enable a rightward edge-swipe to return from an open workout, with the previous page revealed underneath.
- [ ] Test the gesture and visual alignment on a physical iPhone before production release.

## Keyboard and navigation — 11 Nov 2026

- [x] Add a native-keyboard accessory toolbar for weight (−5, −2.5, +2.5, +5 kg) and reps (−1, +1), plus Done; preserve focus while shortcuts update and save values.
- [x] Isolate entire incoming/outgoing pages so history dividers and headers cannot overpaint the animated workout screen, including swipe back.
- [ ] Verify keyboard toolbar placement and transition behaviour in an installed iPhone PWA.

## Keyboard toolbar correction — 11 Nov 2026

- [x] Fix the numeric shortcut toolbar being covered by iOS's native keyboard by positioning from the visible viewport in document coordinates rather than using `position: fixed` and a bottom inset.
- [x] Recalculate on visual viewport and page scroll, including a delayed pass while the iOS keyboard opens.
- [ ] Confirm toolbar sits immediately above the keyboard in installed Gain Dev on a physical iPhone.

## Custom numeric keypad — 11 Nov 2026

- [x] Replace native number inputs and the temporary numeric toolbar with a single in-app keypad for weights and reps; native iOS keyboard and its accessory bar do not appear for those fields.
- [x] Weight quick adjustments: −5, −2.5, +2.5, +5 kg. Rep quick adjustments: −1, +1. Support decimal weights, backspace, clear, Done, external keyboards and focus trapping.
- [x] Keep autosaving every edit without rerendering the workout; cache the keypad for offline PWA use.
- [ ] Test the keypad's layout, scrolling, tap targets and accessibility on a physical iPhone before promoting.

## Numeric keypad refinement — 11 Nov 2026

- [x] Remove the keypad's duplicated title, context and value display; show buttons only.
- [x] Write each keystroke directly into the selected workout weight/reps cell, including intermediate decimals.
- [x] Highlight the selected cell and automatically scroll the page enough to keep it above the keypad.
- [x] Remove the backdrop; allow changing to another numeric cell without dismissing the keypad.
- [ ] Confirm keypad placement and field visibility on a physical iPhone.

## Keypad Done placement — 11 Nov 2026

- [x] Place the Done control at the right of the quick-adjustment row as a copper tick button, removing the full-width bottom button.
- [ ] Verify compact keypad layout on iPhone before production.

## Done icon refinement — 11 Nov 2026

- [x] Replace the Unicode keypad tick with the vendored Lucide Check icon.
- [x] Use a 38 × 38 px borderless copper face inside a 44 × 44 px touch target to reduce its visual size without reducing tap accessibility.
- [ ] Confirm sizing on a physical iPhone.

## Olympic bar loading calculator — 11 Nov 2026

- [x] Add a barbell icon to the weight keypad (not repetition keypad) to inspect how to rack the entered total without changing it.
- [x] Show a graphical side elevation of one Olympic bar sleeve with the plates in descending size from the collar outward; mirror on the other side.
- [x] Assume a 20 kg bar with 25, 20, 15, 10, 5, 2.5 and 1.25 kg plates; show the plate count per side, bar weight and total.
- [x] Explain impossible weights or values below the bar weight rather than guessing a load.
- [x] Keep the loading guide read-only, with Back to keypad and Done actions; provide tests and offline PWA support.
- [ ] Verify sizing and interaction on a real iPhone before release.
