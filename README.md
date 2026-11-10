# Gain

A mobile-first resistance training diary for people who know how to train. Log sets, repeat previous workouts, save templates and inspect exercise progression. No coaching algorithm, no login in MVP.

## Getting started

Requires Node 22+; no npm packages to install.

```sh
npm run dev
```

Open http://localhost:4173. To run tests/build separately:

```sh
npm run check
npm run build:prod
npm run build:dev
```

## Deployment

Target GitHub repository: `liamkidney/gain`

- Production: https://liamkidney.github.io/gain/
- Development: https://liamkidney.github.io/gain/dev/

Follow the [App Launch Playbook](https://docs.google.com/document/d/19ahc5h3Ffos-NiHdSMScGlMpPcMIBDzgkPJ938F5JCk/edit): `dev` branch for changes, GitHub Actions validates dev and builds both channels into one Pages artifact; `main` is advanced by a gated fast-forward after explicit approval.

**Repository:** Source changes are made on `dev` first. Enable Settings → Pages → Build and deployment → GitHub Actions. Never promote untested dev changes to main. Until first approved production release, `main` contains only an unreleased baseline.

App icons are red for production and blue for development. SW caching and IndexedDB storage are channel-isolated. A build marker in Settings identifies each deployed revision.

## Local data

Records are stored in IndexedDB (`gain-dev-v1` or `gain-prod-v1`) with logical collections for `workouts`, `templates` and `customExercises`. Each record has a UUID and modification timestamp. Only completed sets count towards analytics. An interrupted workout remains in the inbox for easy recovery.

**Important:** Local browser storage can be cleared or lost when the browser/PWA is removed. Use Settings → Export backup to save a portable JSON backup. JSON import merges by identifier; take a backup first before importing.

## Structure

- `app/src/model.js` — pure workout and analytics domain logic
- `app/src/storage.js` — replaceable IndexedDB repository adapter
- `app/src/catalog.js` — curated static exercise catalogue
- `app/src/charts.js` — responsive SVG performance charts
- `app/src/app.js` — shared workout/template editor and screens
- `app/assets/exercises/` — original exercise movement illustrations
- `scripts/build-pages.mjs` — channel and revision-aware build
- `app/sw.js` — network-first PWA cache scoped per channel
- `PLAN.md` — live agreed feature plan and decision record
