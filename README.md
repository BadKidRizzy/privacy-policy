# FTF Static Site Repo

This repo hosts the public static pages for Food Truck Finder.

## Repo Layout

- `index.html`
  Main public marketing site served at the site root.
- `claim-your-food-truck/index.html`
  Public owner claim landing page served at `/claim-your-food-truck/`.
- `claim-success/index.html`
  Owner claim success page served at `/claim-success/`.
- `food-trucks/baltimore/index.html`
  Baltimore city SEO landing page served at `/food-trucks/baltimore/`.
- `food-trucks/washington-dc/index.html`
  Washington DC city SEO landing page served at `/food-trucks/washington-dc/`.
- `data/public-growth-pages.json`
  Source data for generated city and truck preview pages.
- `scripts/generate_public_growth_pages.py`
  Regenerates `/food-trucks/{city}/`, `/truck/{slug}/`, and `sitemap.xml`.
- `robots.txt`
  Search crawler rules and sitemap pointer.
- `sitemap.xml`
  Static sitemap for root, claim, city, truck, flyer, privacy, and delete-account pages.
- `site.webmanifest`
  App/site manifest for installable metadata and icons.
- `privacy-policy/index.html`
  Canonical public privacy policy page served at `/privacy-policy/`.
- `privacy.html`
  Legacy redirect to `/privacy-policy/`.
- `delete-account.html`
  Account deletion instructions page.
- `admin/index.html`
  Private management console served at `/admin/`.
- `admin/growth-agent/index.html`
  Private Growth Agent console served at `/admin/growth-agent/`.
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
- Add the real Google Search Console verification meta tag only after it is generated in Search Console.
- When adding seeded truck or city pages, avoid live/open-now/verified/partner claims unless the app has evidence.
- Add generated public truck/city pages by editing `data/public-growth-pages.json`, then running `python3 scripts/generate_public_growth_pages.py`.
- Generated truck pages must use "profile awaiting owner claim" style wording for seeded trucks.
- Generated claim links prefill `/claim-your-food-truck/?truck=TruckName&city=City&profile=/truck/slug/`.
- The claim form posts to the Firebase HTTPS function `submitOwnerClaimRequest`.
- The backend records `claim_started`, `claim_submitted`, and later management updates for `claim_verified`, `rejected`, or `needs_more_info`.
- Claim auto-response email drafts are created by the backend, but real email sending remains disabled until a provider is intentionally connected.
- The `/admin/growth-agent/` console calls `https://food-truck-growth-agent-xmel35gaya-uc.a.run.app` with the signed-in Firebase Auth ID token from `food-truck-finder-prod`.
- Growth Agent access is still enforced server-side; admin emails must match the configured Cloud Run admin email fragment.

## Published Paths

- `/`
  Public marketing site
- `/privacy-policy/`
  Privacy policy
- `/claim-your-food-truck/`
  Owner claim landing page
- `/claim-success/`
  Owner claim success page
- `/food-trucks/baltimore/`
  Baltimore food truck SEO page
- `/food-trucks/washington-dc/`
  Washington DC food truck SEO page
- `/food-trucks/arlington/`
  Arlington food truck SEO page
- `/food-trucks/alexandria/`
  Alexandria / Northern Virginia food truck SEO page
- `/food-trucks/gaithersburg/`
  Gaithersburg food truck SEO page
- `/food-trucks/germantown/`
  Germantown food truck SEO page
- `/truck/{slug}/`
  Crawlable/shareable seeded truck preview pages
- `/sitemap.xml`
  Search sitemap
- `/robots.txt`
  Search crawler rules
- `/privacy.html`
  Legacy redirect to `/privacy-policy/`
- `/delete-account.html`
  Delete account page
- `/admin/`
  Private management console
- `/admin/growth-agent/`
  Private Growth Agent console
- `/open/`
  App open / deep-link page
- `/docs/ftfowners/`
  Owner landing page
- `/docs/`
  Redirects to `/docs/ftfowners/`
