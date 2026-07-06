import { GAME_THEME_LIGHT, getGameTheme, toWorkoutThemeShape } from './gameTheme';

/** @deprecated Use useGameTheme() or getGameTheme(isLightTheme) instead. */
export const WORKOUT_THEME = toWorkoutThemeShape(GAME_THEME_LIGHT);

export { getGameTheme, toWorkoutThemeShape };
