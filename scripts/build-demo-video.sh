#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIDEO_DIR="$ROOT_DIR/assets/media/video"
TEMP_DIR="$(mktemp -d)"
FFMPEG_BIN="${FFMPEG_BIN:-$(command -v ffmpeg || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

if [[ -z "$FFMPEG_BIN" ]]; then
  echo "ffmpeg is required but was not found in PATH." >&2
  exit 1
fi

if [[ -z "$PYTHON_BIN" ]]; then
  echo "python3 is required but was not found in PATH." >&2
  exit 1
fi

SLIDE_DIR="$TEMP_DIR/slides"
mkdir -p "$VIDEO_DIR" "$SLIDE_DIR"

"$PYTHON_BIN" "$ROOT_DIR/scripts/render_demo_slides.py" "$SLIDE_DIR"

make_clip() {
  local input="$1"
  local output="$2"
  local duration="$3"
  local fade_out

  fade_out="$(python3 - <<PY
duration = float("$duration")
print(f"{duration - 0.35:.2f}")
PY
)"

  "$FFMPEG_BIN" -y \
    -loop 1 -i "$input" \
    -vf "fade=t=in:st=0:d=0.35,fade=t=out:st=$fade_out:d=0.35,format=yuv420p" \
    -t "$duration" -r 30 -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$output"
}

make_clip "$SLIDE_DIR/01-title.png" "$TEMP_DIR/clip-01.mp4" 4.2
make_clip "$SLIDE_DIR/02-foodies-map.png" "$TEMP_DIR/clip-02.mp4" 4.8
make_clip "$SLIDE_DIR/03-foodies-home.png" "$TEMP_DIR/clip-03.mp4" 4.8
make_clip "$SLIDE_DIR/04-owner-overview.png" "$TEMP_DIR/clip-04.mp4" 4.8
make_clip "$SLIDE_DIR/05-owner-schedule.png" "$TEMP_DIR/clip-05.mp4" 4.8
make_clip "$SLIDE_DIR/06-owner-menu.png" "$TEMP_DIR/clip-06.mp4" 4.8
make_clip "$SLIDE_DIR/07-organizer-flow.png" "$TEMP_DIR/clip-07.mp4" 4.8
make_clip "$SLIDE_DIR/08-end-card.png" "$TEMP_DIR/clip-08.mp4" 4.4

cat > "$TEMP_DIR/concat.txt" <<EOF
file '$TEMP_DIR/clip-01.mp4'
file '$TEMP_DIR/clip-02.mp4'
file '$TEMP_DIR/clip-03.mp4'
file '$TEMP_DIR/clip-04.mp4'
file '$TEMP_DIR/clip-05.mp4'
file '$TEMP_DIR/clip-06.mp4'
file '$TEMP_DIR/clip-07.mp4'
file '$TEMP_DIR/clip-08.mp4'
EOF

"$FFMPEG_BIN" -y \
  -f concat -safe 0 -i "$TEMP_DIR/concat.txt" \
  -c copy "$VIDEO_DIR/ftf-demo.mp4"

echo "Created demo video at $VIDEO_DIR/ftf-demo.mp4"
