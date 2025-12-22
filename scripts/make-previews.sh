#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/make-previews.sh <input_dir> <output_dir>

Creates previews for images in <input_dir> with the longest side set to 200px.
Uses ImageMagick (magick/convert) if available, otherwise macOS sips.
When using sips, outputs JPEG files with .jpg extension.
Mirrors subfolders from <input_dir> into <output_dir>.
Skips files that already have a preview.

Example:
  scripts/make-previews.sh img/photos img/photos/previews
EOF
}

if [[ $# -ne 2 ]]; then
  usage
  exit 1
fi

input_dir=$1
output_dir=$2
input_dir=${input_dir%/}
output_dir=${output_dir%/}

if [[ ! -d "$input_dir" ]]; then
  echo "Input directory not found: $input_dir" >&2
  exit 1
fi

mkdir -p "$output_dir"

has_magick=false
if command -v magick >/dev/null 2>&1; then
  has_magick=true
elif command -v convert >/dev/null 2>&1; then
  has_magick=true
fi

find "$input_dir" -type f \( \
  -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \
\) -print0 | while IFS= read -r -d '' src; do

  rel_path=${src#"$input_dir"/}
  rel_dir=$(dirname "$rel_path")
  filename=$(basename "$src")
  out_dir="$output_dir/$rel_dir"
  mkdir -p "$out_dir"

  if $has_magick; then
    dst="$out_dir/$filename"
    if [[ -f "$dst" ]]; then
      continue
    fi
    if command -v magick >/dev/null 2>&1; then
      magick "$src" -auto-orient -resize 200x200 "$dst"
    else
      convert "$src" -auto-orient -resize 200x200 "$dst"
    fi
  else
    dst="$out_dir/${filename%.*}.jpg"
    if [[ -f "$dst" ]]; then
      continue
    fi
    # Scale so the longest side is 200px, keep aspect ratio.
    tmp="$out_dir/.tmp_$filename"
    sips -s format "jpeg" -s formatOptions 85 -Z 200 "$src" --out "$tmp" >/dev/null
    mv -f "$tmp" "$dst"
    rm -f "$tmp"
  fi
done
