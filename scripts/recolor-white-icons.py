#!/usr/bin/env python3
"""Recolor white pixels in app icon PNGs to candy colors (white-only rule)."""
from PIL import Image
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

SOLID_WHITE_ICONS = {
    'houseicon.png': (255, 107, 107),
    'progressicon.png': (14, 165, 233),
    'weighticon.png': (132, 204, 22),
}
PARTIAL_WHITE_ICONS = {
    'targetlogo.png': (245, 158, 11),  # gold — visible on light nav highlight
}
# More hub icons are user-designed colored squares — do NOT recolor.
MORE_ICONS = {}


def is_white(r, g, b, a, threshold=200):
    return a >= 128 and r >= threshold and g >= threshold and b >= threshold


def is_bright_white(r, g, b, a, threshold=235):
    return a >= 128 and r >= threshold and g >= threshold and b >= threshold


def recolor_solid(path, rgb):
    img = Image.open(path).convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0:
                px[x, y] = (*rgb, a)
    img.save(path)


def recolor_white_only(path, rgb, bright_only=False):
    img = Image.open(path).convert('RGBA')
    px = img.load()
    w, h = img.size
    checker = is_bright_white if bright_only else is_white
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if checker(r, g, b, a):
                px[x, y] = (*rgb, a)
    img.save(path)


def main():
    for name, rgb in SOLID_WHITE_ICONS.items():
        recolor_solid(os.path.join(ROOT, name), rgb)
    for name, rgb in PARTIAL_WHITE_ICONS.items():
        recolor_white_only(os.path.join(ROOT, name), rgb)
    for name, rgb in MORE_ICONS.items():
        recolor_white_only(os.path.join(ROOT, name), rgb, bright_only=True)
    print('Recolored white icon pixels (More hub icons excluded).')


if __name__ == '__main__':
    main()
