# FTF Static Site Repo

This repo hosts the public static pages for Food Truck Finder.

## Repo Layout

- `index.html`
  Main privacy policy page served at the site root.
- `delete-account.html`
  Account deletion instructions page.
- `open/index.html`
  Deep-link handoff page that tries to open the mobile app.
- `docs/ftfowners/index.html`
  Owner landing page for Food Truck Finder.
- `docs/ftfowners/assets/`
  CSS, JavaScript, and image assets used by the owner landing page.
- `docs/index.html`
  Redirect shim that forwards old `/docs/` traffic to `/docs/ftfowners/`.
- `docs/_legacy/`
  Previous root-level docs assets kept for reference during the reorganization.
- `privacy-policy.md`
  Lightweight markdown draft/reference copy for the privacy policy.
- `CNAME`
  Custom domain configuration for static hosting.

## Editing Notes

- Update the owner landing page in `docs/ftfowners/index.html`.
- Update owner page styles in `docs/ftfowners/assets/styles.css`.
- Update owner page behavior and store/support links in `docs/ftfowners/assets/script.js`.
- Keep `docs/index.html` as a redirect unless the public docs route changes again.

## Published Paths

- `/`
  Privacy policy
- `/delete-account.html`
  Delete account page
- `/open/`
  App open / deep-link page
- `/docs/ftfowners/`
  Owner landing page
- `/docs/`
  Redirects to `/docs/ftfowners/`
