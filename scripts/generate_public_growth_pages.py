from __future__ import annotations

import html
import json
import shutil
from datetime import date
from pathlib import Path
from urllib.parse import urlencode
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "public-growth-pages.json"
SITE_URL = "https://www.ftf-foodtruckfinder.com"
APP_STORE_URL = "https://apps.apple.com/us/app/ftf-food-truck-finder/id6742719545"
PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.innoryzen.foodtruckfinder"
LASTMOD = date.today().isoformat()


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def rel(path: str, depth: int = 2) -> str:
    return "../" * depth + path


def absolute(path: str) -> str:
    return f"{SITE_URL}/{path.lstrip('/')}"


def claim_url(truck: dict) -> str:
    profile_path = f"/truck/{truck['slug']}/"
    query = urlencode(
        {
            "truck": truck["name"],
            "city": truck["city"],
            "profile": profile_path,
        }
    )
    return f"../../claim-your-food-truck/?{query}"


def store_actions() -> str:
    return (
        '<a class="button button--primary" href="'
        f'{APP_STORE_URL}" target="_blank" rel="noreferrer">Download on the App Store</a>'
        '<a class="button button--secondary" href="'
        f'{PLAY_STORE_URL}" target="_blank" rel="noreferrer">Get it on Google Play</a>'
    )


def header(current_links: str = "") -> str:
    return f"""
    <header class="site-header">
      <a class="brand" href="../../" aria-label="Food Truck Finder home">
        <img src="../../assets/brand/IconLogo.png" alt="Food Truck Finder logo" width="44" height="44">
        <span>Food Truck Finder</span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
        Menu
      </button>

      <nav id="site-nav" class="site-nav" data-site-nav>
        <a href="../../#foodies">Foodies</a>
        <a href="../../#owners">Owners</a>
        <a href="../../claim-your-food-truck/">Claim</a>
        {current_links}
        <a class="nav-cta" href="{APP_STORE_URL}" target="_blank" rel="noreferrer">Download</a>
      </nav>
    </header>
"""


def footer(extra_links: str = "") -> str:
    return f"""
    <footer class="site-footer">
      <div>
        <p class="site-footer__brand">Food Truck Finder</p>
        <p class="site-footer__copy">Food truck discovery for foodies, owners, and event organizers.</p>
      </div>

      <div class="site-footer__links">
        <a href="../../">Home</a>
        <a href="../../claim-your-food-truck/">Claim Your Truck</a>
        {extra_links}
        <a href="../../privacy-policy/">Privacy Policy</a>
        <a href="mailto:Foodtruckfinderinfo@gmail.com">Foodtruckfinderinfo@gmail.com</a>
      </div>

      <p class="site-footer__year">&copy; <span id="year"></span> Food Truck Finder</p>
    </footer>
"""


def page_shell(
    *,
    title: str,
    description: str,
    canonical_path: str,
    image_path: str,
    image_alt: str,
    structured_data: dict,
    body: str,
) -> str:
    structured_json = json.dumps(structured_data, ensure_ascii=False, sort_keys=True).replace("</", "<\\/")
    canonical_url = absolute(canonical_path)
    image_url = absolute(image_path)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="#ee6c3f">
  <link rel="canonical" href="{esc(canonical_url)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{esc(canonical_url)}">
  <meta property="og:site_name" content="Food Truck Finder">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:image" content="{esc(image_url)}">
  <meta property="og:image:alt" content="{esc(image_alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{esc(image_url)}">
  <link rel="icon" type="image/png" href="../../assets/brand/favicon.png">
  <link rel="apple-touch-icon" href="../../assets/brand/icon.png">
  <link rel="manifest" href="../../site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap"
    rel="stylesheet"
  >
  <link rel="stylesheet" href="../../assets/site.css?v=4">
  <script type="application/ld+json">{structured_json}</script>
</head>
<body>
  <div class="site-shell">
{body}
  </div>

  <script src="../../assets/site.js?v=1"></script>
</body>
</html>
"""


def render_truck_page(truck: dict, city_links: str) -> str:
    title = f"{truck['name']} in {truck['city']} | Food Truck Finder"
    description = (
        f"View the Food Truck Finder preview profile for {truck['name']} in {truck['city']}. "
        "This seeded profile is awaiting owner claim and is not marked live or verified."
    )
    canonical_path = f"truck/{truck['slug']}/"
    image_path = truck["image"]
    page_url = absolute(canonical_path)
    body = f"""
{header(city_links)}
    <main>
      <section class="hero truck-preview-hero">
        <div class="hero__copy">
          <p class="eyebrow">Food Truck Preview</p>
          <h1>{esc(truck['name'])}</h1>
          <p class="hero__lede">
            {esc(truck['name'])} is listed as a seeded Food Truck Finder profile for {esc(truck['city'])}, {esc(truck['region'])}.
            This profile is awaiting owner claim and is not marked live, verified, or officially managed yet.
          </p>

          <div class="hero__pills">
            <span>Profile awaiting owner claim</span>
            <span>{esc(truck['city'])}</span>
            <span>{esc(truck['cuisine'])}</span>
          </div>

          <div class="hero__actions">
            <a class="button button--primary" href="{esc(claim_url(truck))}">Claim this truck</a>
            <a class="button button--secondary" href="{APP_STORE_URL}" target="_blank" rel="noreferrer">App Store</a>
            <a class="button button--ghost" href="{PLAY_STORE_URL}" target="_blank" rel="noreferrer">Google Play</a>
          </div>
        </div>

        <div class="hero__visual">
          <div class="hero-card hero-card--primary">
            <img src="../../{esc(image_path)}" alt="{esc(truck['name'])} food truck preview image">
          </div>
          <div class="hero-stat hero-stat--one">
            <strong>Awaiting owner claim</strong>
            <span>Owners can claim this profile to update menu, schedule, photos, and links.</span>
          </div>
          <div class="hero-stat hero-stat--two">
            <strong>Shareable page</strong>
            <span>Use this page when tagging or contacting the truck owner.</span>
          </div>
        </div>
      </section>

      <section class="section truck-preview-section">
        <div class="section-heading">
          <p class="eyebrow">Profile Status</p>
          <h2>Seeded profile awaiting owner claim.</h2>
          <p>
            Food Truck Finder is building public profile previews so owners can see their truck,
            claim it, and keep customer-facing details accurate. Until claimed, this page should not
            be treated as live location, verified ownership, or an official partnership.
          </p>
        </div>

        <div class="detail-grid">
          <article class="detail-card">
            <h3>For foodies</h3>
            <p>Download the app to follow trucks and check profiles as owners claim and update them.</p>
          </article>
          <article class="detail-card">
            <h3>For owners</h3>
            <p>Claim this truck to add schedule, menu, photos, website, social links, and contact details.</p>
          </article>
          <article class="detail-card">
            <h3>For outreach</h3>
            <p>Share this page with the truck owner instead of sending a generic claim link.</p>
          </article>
          <article class="detail-card">
            <h3>Claim proof</h3>
            <p>Website, Instagram, Facebook, business email, or photo proof can speed up manual review.</p>
          </article>
        </div>
      </section>

      <section class="cta-banner">
        <div>
          <p class="eyebrow">Own this truck?</p>
          <h2>Claim {esc(truck['name'])} and keep the profile accurate.</h2>
        </div>
        <div class="cta-banner__actions">
          <a class="button button--primary" href="{esc(claim_url(truck))}">Claim this truck</a>
          <a class="button button--secondary" href="{APP_STORE_URL}" target="_blank" rel="noreferrer">Download the app</a>
          <a class="button button--ghost" href="{PLAY_STORE_URL}" target="_blank" rel="noreferrer">Google Play</a>
        </div>
      </section>
    </main>
{footer('<a href="../../food-trucks/washington-dc/">DC Food Trucks</a>')}
"""
    structured_data = {
        "@context": "https://schema.org",
        "@type": "FoodEstablishment",
        "name": truck["name"],
        "url": page_url,
        "image": absolute(image_path),
        "servesCuisine": truck["cuisine"],
        "address": {
            "@type": "PostalAddress",
            "addressLocality": truck["city"],
            "addressRegion": truck["region"],
        },
        "additionalProperty": {
            "@type": "PropertyValue",
            "name": "Food Truck Finder profile status",
            "value": "Seeded profile awaiting owner claim; not live or verified.",
        },
    }
    return page_shell(
        title=title,
        description=description,
        canonical_path=canonical_path,
        image_path=image_path,
        image_alt=f"{truck['name']} food truck preview image",
        structured_data=structured_data,
        body=body,
    )


def truck_card(truck: dict) -> str:
    return f"""
          <article class="truck-preview-card">
            <a href="../../truck/{esc(truck['slug'])}/">
              <img src="../../{esc(truck['image'])}" alt="{esc(truck['name'])} food truck preview image" loading="lazy">
              <span class="truck-preview-card__body">
                <strong>{esc(truck['name'])}</strong>
                <span>{esc(truck['city'])}, {esc(truck['region'])}</span>
                <span>Profile awaiting owner claim</span>
              </span>
            </a>
            <a class="truck-preview-card__claim" href="{esc(claim_url(truck))}">Claim this truck</a>
          </article>
"""


def render_city_page(city: dict, trucks: list[dict], city_links: str) -> str:
    title = f"Food Trucks in {city['name']} | Food Truck Finder"
    description = (
        f"Discover {city['name']} food truck profiles on Food Truck Finder. "
        "Browse claimable seeded profiles, download the app, and help owners keep details accurate."
    )
    canonical_path = f"food-trucks/{city['slug']}/"
    hero_truck = trucks[0]
    cards = "".join(truck_card(truck) for truck in trucks)
    body = f"""
{header(city_links)}
    <main>
      <section class="hero">
        <div class="hero__copy">
          <p class="eyebrow">{esc(city['name'])} Food Trucks</p>
          <h1>{esc(city['headline'])}</h1>
          <p class="hero__lede">{esc(city['summary'])}</p>

          <div class="hero__pills">
            <span>Claimable truck profiles</span>
            <span>App download links</span>
            <span>Owner-updated when claimed</span>
          </div>

          <div class="hero__actions">
            {store_actions()}
            <a class="button button--ghost" href="../../claim-your-food-truck/">Owners: Claim Your Truck</a>
          </div>
        </div>

        <div class="hero__visual">
          <div class="hero-card hero-card--primary">
            <img src="../../{esc(hero_truck['image'])}" alt="{esc(hero_truck['name'])} food truck preview">
          </div>
          <div class="hero-card hero-card--secondary">
            <img src="../../assets/media/foodies/explore-screen.png" alt="Food Truck Finder explore screen">
          </div>
          <div class="hero-stat hero-stat--one">
            <strong>Honest status</strong>
            <span>Seeded profiles are shown as awaiting owner claim, not live or verified.</span>
          </div>
          <div class="hero-stat hero-stat--two">
            <strong>{esc(city['name'])} discovery</strong>
            <span>Download the app to follow trucks and check profile details.</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Known Truck Profiles</p>
          <h2>Claimable profiles connected to this market.</h2>
          <p>
            These pages are built from seeded Food Truck Finder profile assets. Owners can claim a
            profile to add accurate schedules, menus, photos, links, and customer-facing details.
          </p>
        </div>

        <div class="truck-preview-grid">
{cards}
        </div>
      </section>

      <section class="cta-banner">
        <div>
          <p class="eyebrow">Truck owners</p>
          <h2>Run a {esc(city['name'])}-area food truck? Claim your profile and keep it accurate.</h2>
        </div>
        <div class="cta-banner__actions">
          <a class="button button--primary" href="../../claim-your-food-truck/">Claim Your Truck</a>
          <a class="button button--secondary" href="{APP_STORE_URL}" target="_blank" rel="noreferrer">Download the app</a>
        </div>
      </section>
    </main>
{footer('<a href="../../food-trucks/washington-dc/">DC Food Trucks</a><a href="../../food-trucks/baltimore/">Baltimore Trucks</a>')}
"""
    structured_data = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": f"Food Trucks in {city['name']}",
        "url": absolute(canonical_path),
        "description": description,
        "about": {
            "@type": "Place",
            "name": f"{city['name']}, {city['region']}",
        },
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": absolute(f"truck/{truck['slug']}/"),
                    "name": truck["name"],
                }
                for index, truck in enumerate(trucks)
            ],
        },
    }
    return page_shell(
        title=title,
        description=description,
        canonical_path=canonical_path,
        image_path=hero_truck["image"],
        image_alt=f"{hero_truck['name']} food truck preview",
        structured_data=structured_data,
        body=body,
    )


def write_sitemap(cities: list[dict], trucks: list[dict]) -> None:
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", namespace)
    root = ET.Element(f"{{{namespace}}}urlset")
    entries = [
        ("", "weekly", "1.0"),
        ("claim-your-food-truck/", "weekly", "0.9"),
        ("truck/", "weekly", "0.7"),
        ("flyer/", "monthly", "0.6"),
        ("privacy-policy/", "yearly", "0.4"),
        ("delete-account.html", "yearly", "0.3"),
    ]
    entries.extend((f"food-trucks/{city['slug']}/", "weekly", "0.8") for city in cities)
    entries.extend((f"truck/{truck['slug']}/", "weekly", "0.7") for truck in trucks)

    for path, changefreq, priority in entries:
        node = ET.SubElement(root, f"{{{namespace}}}url")
        ET.SubElement(node, f"{{{namespace}}}loc").text = absolute(path)
        ET.SubElement(node, f"{{{namespace}}}lastmod").text = LASTMOD
        ET.SubElement(node, f"{{{namespace}}}changefreq").text = changefreq
        ET.SubElement(node, f"{{{namespace}}}priority").text = priority

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(ROOT / "sitemap.xml", encoding="utf-8", xml_declaration=True)


def remove_generated_dirs(data: dict) -> None:
    for truck in data["trucks"]:
        shutil.rmtree(ROOT / "truck" / truck["slug"], ignore_errors=True)
    for city in data["cities"]:
        shutil.rmtree(ROOT / "food-trucks" / city["slug"], ignore_errors=True)


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    trucks_by_slug = {truck["slug"]: truck for truck in data["trucks"]}
    city_links = (
        '<a href="../../food-trucks/baltimore/">Baltimore</a>'
        '<a href="../../food-trucks/washington-dc/">Washington DC</a>'
        '<a href="../../food-trucks/arlington/">Arlington</a>'
    )

    remove_generated_dirs(data)

    for truck in data["trucks"]:
        page_dir = ROOT / "truck" / truck["slug"]
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(
            render_truck_page(truck, city_links),
            encoding="utf-8",
        )

    for city in data["cities"]:
        page_dir = ROOT / "food-trucks" / city["slug"]
        page_dir.mkdir(parents=True, exist_ok=True)
        city_trucks = [trucks_by_slug[slug] for slug in city["truck_slugs"]]
        (page_dir / "index.html").write_text(
            render_city_page(city, city_trucks, city_links),
            encoding="utf-8",
        )

    write_sitemap(data["cities"], data["trucks"])


if __name__ == "__main__":
    main()
