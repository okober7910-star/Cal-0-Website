#!/usr/bin/env python3
"""Rebuild CAL-0's static group counts and order after editing store cards.

Edit store cards in both Cal-0 Website/index.html and where-to-buy-cal0.html,
then run python3 sort_store_locator.py before committing. In a new area, add
the matching group to both pages and its jump link to the directory page.
Use --check to verify the saved pages without changing them. Equal-count
areas keep the order already present in the dedicated directory.
"""

import argparse
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent / "Cal-0 Website"
GROUP = re.compile(
    r'(<details class="neighborhood-group"(?: id="([^"]+)")?><summary>)'
    r'([^<]+?) \(\d+\)(</summary>(?:(?!<details\b).)*?</details>)',
    re.S,
)
CARD = re.compile(r'<article class="store-card">.*?</article>', re.S)
NAV = re.compile(r'(<nav class="resource-area-nav"[^>]*><ul>\s*)(.*?)(\s*</ul></nav>)', re.S)
LINK = re.compile(r'(<li><a href="#([^"]+)">[^<]+?<span>)\d+(</span></a></li>)')


def read_groups(page):
    start = page.index("data-static-store-directory>")
    # These groups are siblings packed together in the static directory markup.
    source = page[start + len("data-static-store-directory>"):]
    groups = list(GROUP.finditer(source))
    if not groups or groups[0].start() != 0 or any(
            a.end() != b.start() for a, b in zip(groups, groups[1:])):
        raise ValueError("Unexpected neighborhood group markup")
    tail = source[groups[-1].end():]
    if not tail.startswith("</div>") or '<details class="neighborhood-group"' in tail:
        raise ValueError("Unparsed neighborhood group")
    result = {}
    for group in groups:
        name = group[3]
        cards = CARD.findall(group[4])
        if not cards or name in result:
            raise ValueError(f"Empty or duplicate neighborhood: {name}")
        result[name] = (group[2], cards, f"{group[1]}{name} ({len(cards)}){group[4]}")
    return page[:len(page) - len(source)], result, tail


def build(homepage, directory):
    home_prefix, home, home_tail = read_groups(homepage)
    dir_prefix, areas, dir_tail = read_groups(directory)
    if {name: value[1] for name, value in home.items()} != {
            name: value[1] for name, value in areas.items()}:
        raise ValueError("Homepage and resource directory cards are different")
    names = sorted(areas, key=lambda name: -len(areas[name][1]))
    ids = [areas[name][0] for name in names]
    if not all(ids) or len(set(ids)) != len(ids):
        raise ValueError("Missing or duplicate directory anchor")
    counts = {areas[name][0]: len(areas[name][1]) for name in names}
    nav = NAV.search(dir_prefix)
    if not nav:
        raise ValueError("Missing resource-area nav")
    links = {}
    for line in nav[2].splitlines():
        link = LINK.fullmatch(line)
        if not link or link[2] not in counts or link[2] in links:
            raise ValueError(f"Unexpected neighborhood link: {line}")
        links[link[2]] = f"{link[1]}{counts[link[2]]}{link[3]}"
    if set(links) != set(ids):
        raise ValueError("Directory nav does not cover every area")
    dir_prefix = (dir_prefix[:nav.start(2)] + "\n".join(links[id_] for id_ in ids)
                  + dir_prefix[nav.end(2):])
    return (
        home_prefix + "".join(home[name][2] for name in names) + home_tail,
        dir_prefix + "".join(areas[name][2] for name in names) + dir_tail,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    paths = [SITE / name for name in ["index.html", "where-to-buy-cal0.html"]]
    originals = [path.read_bytes().decode("utf-8") for path in paths]
    changed = False
    for path, before, after in zip(paths, originals, build(*originals)):
        if before != after:
            changed = True
            if not args.check:
                path.write_bytes(after.encode("utf-8"))
            print(f"{'Needs sorting' if args.check else 'Sorted'}: {path.name}")
    return int(args.check and changed)


if __name__ == "__main__":
    raise SystemExit(main())
