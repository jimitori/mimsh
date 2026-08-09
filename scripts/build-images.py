#!/usr/bin/env python3
"""
Build WebP derivatives for every image on the site, and keep the gallery JSON in sync.

Masters in img/ are never modified and never served. For each one this writes two
derivatives into a mirror tree under img/derived/:

    img/photos/neon/DSC_1596.jpg                 master   3784 KB  (archive only)
    img/derived/photos/neon/DSC_1596.thumb.webp   400w        8 KB  (gallery grid)
    img/derived/photos/neon/DSC_1596.large.webp  1600w       44 KB  (lightbox, inline)

Work is skipped when a master's content hash and the encode settings both match what
.image-manifest.json recorded last time, so re-running is cheap. Change TIERS below and
everything re-encodes automatically.

Usage:
    scripts/build-images.py              # incremental build + gallery sync
    scripts/build-images.py --force      # re-encode everything
    scripts/build-images.py --dry-run    # report what would change, write nothing

Requires cwebp (brew install webp).
"""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SOURCE_ROOT = "img"
DERIVED_ROOT = "img/derived"
MANIFEST = ".image-manifest.json"

# Directory names skipped anywhere in the tree. `previews` covers the three legacy
# hand-made preview folders, which are kept on disk but are no longer referenced.
EXCLUDE_DIRS = {"derived", "logos", "icon-random", "previews"}
EXCLUDE_FILES = {"icon.png", "favicon.ico"}
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# name -> (max width in px, cwebp quality). Never upscales: a master narrower than the
# target is encoded at its own width.
TIERS = {
    "thumb": (400, 78),
    "large": (1600, 80),
}

# Gallery JSON file (data/galleries/<key>.json) -> the folder of masters feeding it.
# Explicit because the names don't map onto the folders uniformly: the `colour` gallery
# reads from a folder spelled `color`, and the poster folder carries a " - 1" suffix.
GALLERIES = {
    "black-and-white": "img/photos/black-and-white",
    "colour": "img/photos/color",
    "neon": "img/photos/neon",
    "poster-every-day": "img/poster-every-day - 1",
    "press-photos": "img/press-photos",
}

SETTINGS_KEY = "|".join(f"{n}:{w}q{q}" for n, (w, q) in sorted(TIERS.items()))


def find_masters():
    """Every image in scope, as repo-relative paths, sorted."""
    found = []
    for root, dirs, files in os.walk(os.path.join(REPO, SOURCE_ROOT)):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in files:
            if name in EXCLUDE_FILES:
                continue
            if os.path.splitext(name)[1].lower() not in EXTENSIONS:
                continue
            found.append(os.path.relpath(os.path.join(root, name), REPO))
    return sorted(found)


def derived_path(master, tier):
    """img/photos/neon/DSC_1596.jpg -> img/derived/photos/neon/DSC_1596.thumb.webp"""
    rel = os.path.relpath(master, SOURCE_ROOT)
    stem = os.path.splitext(rel)[0]
    return os.path.join(DERIVED_ROOT, f"{stem}.{tier}.webp")


def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def source_width(path):
    """Master width in px, or None if it can't be read."""
    try:
        out = subprocess.run(
            ["sips", "-g", "pixelWidth", path],
            capture_output=True, text=True, check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    for line in out.splitlines():
        if "pixelWidth:" in line:
            return int(line.split(":")[1].strip())
    return None


def encode(master, tier, dry_run):
    target_w, quality = TIERS[tier]
    src = os.path.join(REPO, master)
    dst = os.path.join(REPO, derived_path(master, tier))

    src_w = source_width(src)
    resize = [] if (src_w is not None and src_w <= target_w) else ["-resize", str(target_w), "0"]

    if dry_run:
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(
        ["cwebp", "-quiet", "-q", str(quality), *resize, src, "-o", dst],
        check=True,
    )


def url_for(path):
    """Repo-relative path -> absolute site URL. Spaces stay literal, matching the
    existing gallery JSON; browsers encode them."""
    return "/" + path


def sync_gallery(key, folder, masters_by_dir, dry_run):
    """Rewrite data/galleries/<key>.json to match the folder on disk.

    Existing entries keep their position and their hand-written alt/caption; new files
    are appended; entries whose master is gone are dropped. Entries are matched on
    `source`, falling back to `full` so the first run migrates cleanly from the old
    format (where `full` pointed at the master).
    """
    path = os.path.join(REPO, "data", "galleries", f"{key}.json")
    existing = []
    if os.path.exists(path):
        with open(path) as fh:
            existing = json.load(fh)

    by_source = {}
    for entry in existing:
        marker = entry.get("source") or entry.get("full", "")
        by_source[marker.lstrip("/")] = entry

    on_disk = masters_by_dir.get(folder, [])
    ordered = [m for m in existing_order(existing, on_disk, by_source)]

    result, added = [], []
    for master in ordered:
        old = by_source.get(master, {})
        if master not in by_source:
            added.append(master)
        result.append({
            "source": url_for(master),
            "full": url_for(derived_path(master, "large")),
            "preview": url_for(derived_path(master, "thumb")),
            "alt": old.get("alt", ""),
            "caption": old.get("caption", ""),
        })

    dropped = [m for m in by_source if m not in set(on_disk)]

    if not dry_run:
        with open(path, "w") as fh:
            json.dump(result, fh, indent=2, ensure_ascii=False)
            fh.write("\n")

    return added, dropped, len(result)


def existing_order(existing, on_disk, by_source):
    """Masters in their current JSON order, with new files appended alphabetically."""
    disk = set(on_disk)
    ordered = []
    for entry in existing:
        marker = (entry.get("source") or entry.get("full", "")).lstrip("/")
        if marker in disk and marker not in ordered:
            ordered.append(marker)
    ordered += sorted(m for m in on_disk if m not in ordered)
    return ordered


def prune_orphans(masters, dry_run):
    """Delete derivatives whose master no longer exists."""
    wanted = {derived_path(m, t) for m in masters for t in TIERS}
    removed = []
    root = os.path.join(REPO, DERIVED_ROOT)
    if not os.path.isdir(root):
        return removed
    for dirpath, _, files in os.walk(root):
        for name in files:
            rel = os.path.relpath(os.path.join(dirpath, name), REPO)
            if rel not in wanted:
                removed.append(rel)
                if not dry_run:
                    os.remove(os.path.join(REPO, rel))
    if not dry_run:
        # tidy up directories left empty by the removals
        for dirpath, dirnames, files in os.walk(root, topdown=False):
            if not dirnames and not files:
                os.rmdir(dirpath)
    return removed


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--force", action="store_true", help="re-encode every master")
    parser.add_argument("--dry-run", action="store_true", help="report changes, write nothing")
    args = parser.parse_args()

    if not shutil.which("cwebp"):
        sys.exit("cwebp not found. Install it with:  brew install webp")

    manifest_path = os.path.join(REPO, MANIFEST)
    manifest = {"settings": "", "sources": {}}
    if os.path.exists(manifest_path):
        with open(manifest_path) as fh:
            manifest = json.load(fh)

    settings_changed = manifest.get("settings") != SETTINGS_KEY
    if settings_changed and manifest.get("settings"):
        print(f"encode settings changed ({manifest['settings']} -> {SETTINGS_KEY}); rebuilding all")

    masters = find_masters()
    recorded = manifest.get("sources", {})
    new_sources = {}
    built = 0

    for master in masters:
        digest = file_hash(os.path.join(REPO, master))
        new_sources[master] = digest

        outputs_present = all(
            os.path.exists(os.path.join(REPO, derived_path(master, t))) for t in TIERS
        )
        up_to_date = (
            not args.force
            and not settings_changed
            and recorded.get(master) == digest
            and outputs_present
        )
        if up_to_date:
            continue

        for tier in TIERS:
            encode(master, tier, args.dry_run)
        built += 1
        print(f"  built  {master}")

    removed = prune_orphans(masters, args.dry_run)
    for rel in removed:
        print(f"  pruned {rel}")

    masters_by_dir = {}
    for master in masters:
        masters_by_dir.setdefault(os.path.dirname(master), []).append(master)

    for key, folder in sorted(GALLERIES.items()):
        added, dropped, total = sync_gallery(key, folder, masters_by_dir, args.dry_run)
        if added or dropped:
            print(f"  gallery {key}: {total} entries "
                  f"(+{len(added)} new, -{len(dropped)} removed)")
            for m in added:
                print(f"    + {m}  (alt/caption blank — fill in by hand)")
            for m in dropped:
                print(f"    - {m}")

    if not args.dry_run:
        with open(manifest_path, "w") as fh:
            json.dump({"settings": SETTINGS_KEY, "sources": new_sources}, fh, indent=2)
            fh.write("\n")

    verb = "would build" if args.dry_run else "built"
    print(f"\n{verb} {built} of {len(masters)} masters "
          f"({len(TIERS)} tiers each), pruned {len(removed)}")


if __name__ == "__main__":
    main()
