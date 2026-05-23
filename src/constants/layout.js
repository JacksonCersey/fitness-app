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
export const SCREEN_TRANSITION_MS = 200;

/** Bottom-tab root screens — instant switch (no opacity fade) to avoid background flash. */
export const MAIN_TAB_SCREEN_KEYS = new Set(['menu', 'history', 'settings', 'muscles']);

/** Shell background for all main-tab screens (matches menu body). */
export const MAIN_TAB_SHELL_BG = '#1A1A1C';
