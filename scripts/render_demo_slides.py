#!/usr/bin/env python3

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


WIDTH = 1280
HEIGHT = 720
ROOT = Path(__file__).resolve().parents[1]
BRAND_LOGO = ROOT / "assets" / "brand" / "IconLogo.png"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

SLIDES = [
    {
        "name": "01-title.png",
        "kind": "title",
        "eyebrow": "Food Truck Finder",
        "headline": "Help more people find your truck.",
        "body": "One app for discovery, owner updates, and event planning.",
        "cta": "Request owner setup or download the app",
    },
    {
        "name": "02-foodies-map.png",
        "kind": "image",
        "tag": "Foodies",
        "headline": "Foodies find nearby trucks faster.",
        "body": "Start with the map and reduce the time it takes to pick a stop.",
        "image": ROOT / "assets" / "media" / "foodies" / "explore-live-simulator.png",
    },
    {
        "name": "03-foodies-home.png",
        "kind": "image",
        "tag": "Foodies",
        "headline": "Check before you go.",
        "body": "Give people a faster path from craving to a real lunch plan.",
        "image": ROOT / "assets" / "media" / "foodies" / "home-feed.png",
    },
    {
        "name": "04-owner-overview.png",
        "kind": "image",
        "tag": "Owners",
        "headline": "Owners keep the basics current.",
        "body": "Location visibility, truck details, and a stronger customer view.",
        "image": ROOT / "assets" / "media" / "owners" / "owner-overview-explained.png",
    },
    {
        "name": "05-owner-schedule.png",
        "kind": "image",
        "tag": "Owners",
        "headline": "Update stops and hours.",
        "body": "Make it easier for customers to know where the truck will be next.",
        "image": ROOT / "assets" / "media" / "owners" / "owner-schedule-explained.png",
    },
    {
        "name": "06-owner-menu.png",
        "kind": "image",
        "tag": "Owners",
        "headline": "Show the menu before they choose.",
        "body": "Menus and specials help people decide before they drive elsewhere.",
        "image": ROOT / "assets" / "media" / "owners" / "owner-menu-explained.png",
    },
    {
        "name": "07-organizer-flow.png",
        "kind": "image",
        "tag": "Organizers",
        "headline": "Organizers get a cleaner planning flow.",
        "body": "Discover trucks and move toward better event coordination.",
        "image": ROOT / "assets" / "media" / "organizers" / "invites-explained.png",
    },
    {
        "name": "08-end-card.png",
        "kind": "end",
        "eyebrow": "Food Truck Finder",
        "headline": "Get your truck live faster.",
        "body": "For foodies | owners | organizers",
        "cta": "Foodtruckfinderinfo@gmail.com",
    },
]


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = image.size
    scale = max(target_w / src_w, target_h / src_h)
    resized = image.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def fit_contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = image.size
    scale = min(target_w / src_w, target_h / src_h)
    return image.resize((int(src_w * scale), int(src_h * scale)), Image.Resampling.LANCZOS)


def draw_wrapped_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    x: int,
    y: int,
    max_width: int,
    line_gap: int,
) -> int:
    words = text.split()
    lines: list[str] = []
    current = ""

    for word in words:
        candidate = word if not current else f"{current} {word}"
        box = draw.textbbox((0, 0), candidate, font=font)
        if box[2] - box[0] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    cursor_y = y
    for line in lines:
        draw.text((x, cursor_y), line, font=font, fill=fill)
        box = draw.textbbox((x, cursor_y), line, font=font)
        cursor_y = box[3] + line_gap

    return cursor_y


def add_logo(canvas: Image.Image, size: int, x: int, y: int) -> None:
    logo = Image.open(BRAND_LOGO).convert("RGBA")
    logo = fit_contain(logo, (size, size))
    canvas.alpha_composite(logo, (x, y))


def make_gradient_card(canvas: Image.Image, top_color: tuple[int, int, int], bottom_color: tuple[int, int, int]) -> None:
    gradient = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    pixels = gradient.load()
    for row in range(HEIGHT):
      mix = row / max(HEIGHT - 1, 1)
      r = int(top_color[0] * (1 - mix) + bottom_color[0] * mix)
      g = int(top_color[1] * (1 - mix) + bottom_color[1] * mix)
      b = int(top_color[2] * (1 - mix) + bottom_color[2] * mix)
      for col in range(WIDTH):
        pixels[col, row] = (r, g, b, 255)
    canvas.alpha_composite(gradient)


def add_orb(canvas: Image.Image, box: tuple[int, int, int, int], color: tuple[int, int, int, int], blur: int) -> None:
    layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(box, fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(layer)


def add_shadow_box(canvas: Image.Image, box: tuple[int, int, int, int], radius: int = 30) -> None:
    shadow = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.rounded_rectangle(box, radius=radius, fill=(20, 14, 12, 130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(shadow)


def make_title_slide(data: dict, out_path: Path) -> None:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (28, 21, 18, 255))
    make_gradient_card(canvas, (28, 21, 18), (48, 33, 26))
    add_orb(canvas, (-120, -80, 480, 420), (238, 108, 63, 120), 34)
    add_orb(canvas, (860, 300, 1420, 860), (15, 124, 130, 100), 42)

    add_logo(canvas, 124, 78, 76)

    draw = ImageDraw.Draw(canvas)
    eyebrow_font = load_font(FONT_BOLD, 18)
    headline_font = load_font(FONT_BOLD, 68)
    body_font = load_font(FONT_REG, 30)
    cta_font = load_font(FONT_BOLD, 28)

    draw.rounded_rectangle((76, 188, 318, 234), radius=22, fill=(255, 232, 221, 240))
    draw.text((98, 199), data["eyebrow"], font=eyebrow_font, fill=(196, 77, 36, 255))
    draw_wrapped_text(draw, data["headline"], headline_font, (255, 255, 255, 255), 76, 258, 760, 10)
    draw_wrapped_text(draw, data["body"], body_font, (245, 238, 233, 230), 76, 430, 700, 8)
    draw.rounded_rectangle((76, 534, 686, 610), radius=28, fill=(238, 108, 63, 230))
    draw.text((110, 554), data["cta"], font=cta_font, fill=(255, 255, 255, 255))

    canvas.convert("RGB").save(out_path, quality=95)


def make_image_slide(data: dict, out_path: Path) -> None:
    source = Image.open(data["image"]).convert("RGBA")
    background = fit_cover(source, (WIDTH, HEIGHT)).filter(ImageFilter.GaussianBlur(18))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (18, 13, 11, 110))
    background.alpha_composite(overlay)

    add_orb(background, (760, 70, 1320, 640), (238, 108, 63, 56), 48)

    draw = ImageDraw.Draw(background)
    eyebrow_font = load_font(FONT_BOLD, 17)
    headline_font = load_font(FONT_BOLD, 54)
    body_font = load_font(FONT_REG, 26)

    draw.rounded_rectangle((50, 42, 1228, 218), radius=28, fill=(24, 18, 15, 180))
    draw.rounded_rectangle((76, 68, 218, 112), radius=20, fill=(255, 232, 221, 235))
    draw.text((99, 79), data["tag"], font=eyebrow_font, fill=(196, 77, 36, 255))
    draw_wrapped_text(draw, data["headline"], headline_font, (255, 255, 255, 255), 76, 118, 820, 8)
    draw_wrapped_text(draw, data["body"], body_font, (244, 237, 232, 232), 76, 178, 760, 6)

    device = fit_contain(source, (520, 560))
    device_x = WIDTH - device.width - 92
    device_y = HEIGHT - device.height - 52
    add_shadow_box(background, (device_x - 8, device_y + 10, device_x + device.width + 8, device_y + device.height + 18))

    device_mask = Image.new("L", device.size, 0)
    ImageDraw.Draw(device_mask).rounded_rectangle((0, 0, device.width, device.height), radius=32, fill=255)
    framed = Image.new("RGBA", device.size, (255, 255, 255, 0))
    framed.paste(device, (0, 0), device_mask)
    background.alpha_composite(framed, (device_x, device_y))

    draw.rounded_rectangle((76, 576, 392, 638), radius=26, fill=(15, 124, 130, 222))
    draw.text((102, 596), "Built for real app use", font=load_font(FONT_BOLD, 25), fill=(255, 255, 255, 255))

    background.convert("RGB").save(out_path, quality=95)


def make_end_slide(data: dict, out_path: Path) -> None:
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (15, 124, 130, 255))
    make_gradient_card(canvas, (15, 124, 130), (21, 79, 84))
    add_orb(canvas, (-180, 240, 420, 860), (255, 231, 221, 72), 42)
    add_orb(canvas, (840, -40, 1460, 520), (238, 108, 63, 110), 36)
    add_logo(canvas, 132, WIDTH - 220, 82)

    draw = ImageDraw.Draw(canvas)
    eyebrow_font = load_font(FONT_BOLD, 18)
    headline_font = load_font(FONT_BOLD, 66)
    body_font = load_font(FONT_REG, 30)
    cta_font = load_font(FONT_BOLD, 30)

    draw.rounded_rectangle((76, 164, 318, 210), radius=22, fill=(255, 255, 255, 48))
    draw.text((98, 175), data["eyebrow"], font=eyebrow_font, fill=(255, 246, 240, 255))
    draw_wrapped_text(draw, data["headline"], headline_font, (255, 255, 255, 255), 76, 236, 760, 10)
    draw_wrapped_text(draw, data["body"], body_font, (241, 249, 250, 235), 76, 408, 820, 8)
    draw.rounded_rectangle((76, 520, 590, 598), radius=28, fill=(238, 108, 63, 230))
    draw.text((106, 542), data["cta"], font=cta_font, fill=(255, 255, 255, 255))

    canvas.convert("RGB").save(out_path, quality=95)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: render_demo_slides.py <output-dir>")

    out_dir = Path(sys.argv[1]).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    for slide in SLIDES:
        out_path = out_dir / slide["name"]
        if slide["kind"] == "title":
            make_title_slide(slide, out_path)
        elif slide["kind"] == "end":
            make_end_slide(slide, out_path)
        else:
            make_image_slide(slide, out_path)


if __name__ == "__main__":
    main()
