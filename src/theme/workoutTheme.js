import { GAME_THEME_DARK, getGameTheme, toWorkoutThemeShape } from './gameTheme';

/** @deprecated Use useGameTheme() or getGameTheme() instead. */
export const WORKOUT_THEME = toWorkoutThemeShape(GAME_THEME_DARK);

export { getGameTheme, toWorkoutThemeShape };
