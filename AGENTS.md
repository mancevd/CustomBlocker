# AGENTS.md

This file defines how contributors (human or AI) should work in this repository.

## Project Summary

- Project type: Chrome extension (Manifest V3).
- Current extension version: `5.0.0` (see `extension/manifest.json`).
- Primary behavior: user-defined page element filtering/blocking using XPath/keywords/rules.

## Source Of Truth

Edit source files, not generated outputs, unless noted.

- TypeScript source: `ts/src/**`
- SCSS source: `scss/**`
- Pug templates: `pug/**`
- i18n Pug templates: `pug-i18n/**`
- Locale data for i18n templates: `pug-locale/**`

Generated targets:

- `ts/src/**` -> `extension/src/**` via `tsc` (`ts/tsconfig.json`)
- `scss/**` -> `extension/css/**` via `gulp sass`
- `pug/**` and `pug-i18n/**` -> `extension/**/*.html` via `gulp pug` and `gulp pugI18n`

Direct-edit JS exceptions (no TS source exists in `ts/src`):

- `extension/src/analytics.js`
- `extension/src/pref/import.js`
- `extension/src/pref/export.js`
- `extension/src/pref/import_export.js`

## Build Commands

Run from repo root:

```powershell
gulp
cd ts
tsc
cd ..
```

Equivalent combined command (from `.atom-build.yml`):

```powershell
gulp; cd ts; tsc; cd ..;
```

Notes:

- There is no checked-in root `package.json`; tool dependencies may be installed globally or managed outside this repo.
- TypeScript target is ES5 (`ts/tsconfig.json`), so avoid introducing syntax that will not compile cleanly to this target.

## Editing Rules

- Keep English and Japanese user-facing content in sync where applicable.
- If you change rule/storage shape, verify persistence/import/export paths still work.
- If you change extension permissions, storage behavior, or data handling, update `extension/PRIVACY.md` accordingly.
- Preserve MV3 constraints (service worker background, no MV2-only APIs).

## Validation Checklist

Before finishing changes:

1. Run build commands (`gulp` and `tsc`) and resolve errors.
2. Confirm generated files reflect source edits.
3. Spot-check key flows in unpacked extension:
   - Popup opens
   - Options page loads
   - Rule creation/editing works
   - Content script blocking still applies on test pages

## Release Hygiene

When shipping a user-visible release, update relevant files together:

- `extension/manifest.json` version
- `README.md` (if behavior/setup changed)
- `whats_new.txt` (if you continue using it for release notes)
