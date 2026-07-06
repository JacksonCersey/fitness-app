import { GAME_THEME_DARK } from '../theme/gameTheme';

/** @type {Record<string, string>} */
const SPLIT_DAY_COLOR_MAP = {
  rest: GAME_THEME_DARK.splitRest,
  push: GAME_THEME_DARK.pplPush,
  pull: GAME_THEME_DARK.pplPull,
  legs: GAME_THEME_DARK.pplLegs,
  upper: GAME_THEME_DARK.splitUpper,
  lower: GAME_THEME_DARK.splitLower,
  full: GAME_THEME_DARK.splitFull,
  mixed: GAME_THEME_DARK.splitMixed,
};

/**
 * Accent color for a split day type (gamified circles, chips).
 * @param {string | undefined | null} type
 * @param {import('../theme/gameTheme').GAME_THEME_DARK | import('../theme/gameTheme').GAME_THEME_LIGHT} [theme]
 */
export function getSplitDayAccentColor(type, theme = GAME_THEME_DARK) {
  const key = typeof type === 'string' ? type : 'rest';
  const fromTheme = {
    rest: theme.splitRest,
    push: theme.pplPush,
    pull: theme.pplPull,
    legs: theme.pplLegs,
    upper: theme.splitUpper,
    lower: theme.splitLower,
    full: theme.splitFull,
    mixed: theme.splitMixed,
  };
  return fromTheme[key] ?? theme.splitRest ?? SPLIT_DAY_COLOR_MAP.rest;
}

/**
 * Muted accent for adjacent (unselected) gamified circles — same workout color, greyed out.
 * @param {string | undefined | null} type
 * @param {typeof GAME_THEME_DARK} [theme]
 * @param {number} [blend] 0–1 how much accent vs inactive gray
 */
export function getSplitDayMutedAccentColor(type, theme = GAME_THEME_DARK, blend = 0.42) {
  const accent = getSplitDayAccentColor(type, theme);
  const inactive = theme.homeGamifiedInactive ?? '#4B5563';
  return blendHexColors(accent, inactive, blend);
}

/** @param {string} hex @param {string} hex2 @param {number} t */
function blendHexColors(hex, hex2, t) {
  const a = parseHex(hex);
  const b = parseHex(hex2);
  if (!a || !b) return hex;
  const mix = (x, y) => Math.round(x + (y - x) * (1 - t));
  const r = mix(a.r, b.r);
  const g = mix(a.g, b.g);
  const bl = mix(a.b, b.b);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** @param {string} hex */
function parseHex(hex) {
  const raw = String(hex || '').replace('#', '');
  if (raw.length !== 6) return null;
  const n = Number.parseInt(raw, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
