import { Dimensions } from 'react-native';

export const MAIN_NAV_TRACK_HEIGHT = 72;
/** Bottom tab bar vertical footprint (top padding + row + bottom padding, before home indicator). */
export const MAIN_TAB_NAV_BAR_HEIGHT = 12 + Math.max(MAIN_NAV_TRACK_HEIGHT, 72) + 12;
export const MUSCLE_DIAGRAM_WIDTH = 300;
export const MUSCLE_DIAGRAM_HEIGHT = 460;
/** Max height for muscle charts in the workout pullout so both fit comfortably on screen. */
export const MUSCLE_PULLOUT_DIAGRAM_HEIGHT = Math.min(
  200,
  Math.round(Dimensions.get('window').height * 0.24),
);

/** Workout muscles side panel: keep a margin from screen bottom; height hugs content up to this cap. */
export const MUSCLE_TAB_PANEL_TOP_INSET = 52;
export const MUSCLE_TAB_PANEL_BOTTOM_MARGIN = 24;
export const MUSCLE_TAB_PANEL_MAX_HEIGHT =
  Dimensions.get('window').height - MUSCLE_TAB_PANEL_TOP_INSET - MUSCLE_TAB_PANEL_BOTTOM_MARGIN;
/** Width of the workout muscle diagrams strip when pulled open */
export const MUSCLE_PULLOUT_DRAWER_WIDTH = 220;
/** Fade-in duration when navigating between screens (ms) */
export const SCREEN_TRANSITION_MS = 140;

/** Fade-out duration when switching bottom tabs (ms) */
export const MAIN_TAB_FADE_OUT_MS = 180;

/** More hub slide-in duration when opening a subscreen (ms) */
export const MORE_HUB_SLIDE_MS = 220;

/** More hub slide-out duration when closing back to More (ms) */
export const MORE_HUB_SLIDE_CLOSE_MS = 120;

/** Bottom nav fade when opening/closing a More hub subscreen (ms) */
export const MORE_HUB_NAV_BAR_FADE_MS = 120;

/** Subscreens opened from the More tab (no bottom nav) — slide in from the right. */
export const MORE_HUB_SUBSCREEN_KEYS = new Set([
  'profile',
  'moreGoals',
  'streak',
  'appearance',
  'strengthMovements',
  'splitPlanner',
]);

/** Subscreens opened from the Progress tab — slide in from the right. */
export const PROGRESS_SUBSCREEN_KEYS = new Set(['strengthScoreHistory']);

/** True when `screenKey` should slide over its parent tab (`returnTabKey`). */
export function shouldUseSubscreenSlideTransition(screenKey, returnTabKey = 'settings') {
  if (returnTabKey === 'settings') {
    return MORE_HUB_SUBSCREEN_KEYS.has(screenKey);
  }
  if (returnTabKey === 'history') {
    return PROGRESS_SUBSCREEN_KEYS.has(screenKey);
  }
  return false;
}

/** @deprecated Use shouldUseSubscreenSlideTransition */
export function shouldUseMoreHubSlideTransition(screenKey, returnTabKey = 'settings') {
  return shouldUseSubscreenSlideTransition(screenKey, returnTabKey);
}

/** Subscreen is sliding over a main tab (keep that tab visible underneath). */
export function isSubscreenSlideOverlay(screenKey, returnTabKey = 'settings') {
  if (MAIN_TAB_SCREEN_KEYS.has(screenKey)) return false;
  return shouldUseSubscreenSlideTransition(screenKey, returnTabKey);
}

/** More subscreen is sliding over the More tab (keep More visible underneath). */
export function isMoreHubSlideOverlay(screenKey, returnTabKey = 'settings') {
  return isSubscreenSlideOverlay(screenKey, returnTabKey);
}

/** Bottom-tab root screens — cross-fade handled in MainTabsRoot. */
export const MAIN_TAB_SCREEN_KEYS = new Set(['menu', 'history', 'settings', 'muscles']);

/** Number of slots in the bottom tab track (Home, Progress, Targets, More). */
export const MAIN_NAV_TAB_COUNT = 4;

/** Maps main-tab screen keys to bottom-nav tab keys. */
export const MAIN_SCREEN_TO_NAV_TAB = {
  menu: 'home',
  history: 'history',
  muscles: 'muscles',
  settings: 'settings',
};

/** @deprecated Use useGameTheme().screenBg — kept for legacy static references. */
export const MAIN_TAB_SHELL_BG = '#FFF5FB';
