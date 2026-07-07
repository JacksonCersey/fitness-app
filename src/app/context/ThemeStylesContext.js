import React, { createContext, useContext, useMemo } from 'react';
import { getGameTheme, toWorkoutThemeShape } from '../../theme/gameTheme';
import { createThemedStyles } from '../../styles/createThemedStyles';

const ThemeStylesContext = createContext(null);

export function ThemeStylesProvider({ children }) {
  const gameTheme = useMemo(() => getGameTheme(), []);
  const styles = useMemo(() => createThemedStyles(gameTheme), [gameTheme]);
  const workoutTheme = useMemo(() => toWorkoutThemeShape(gameTheme), [gameTheme]);

  const value = useMemo(
    () => ({
      styles,
      gameTheme,
      workoutTheme,
    }),
    [styles, gameTheme, workoutTheme],
  );

  return <ThemeStylesContext.Provider value={value}>{children}</ThemeStylesContext.Provider>;
}

export function useThemeStyles() {
  const ctx = useContext(ThemeStylesContext);
  if (!ctx) {
    throw new Error('useThemeStyles must be used within ThemeStylesProvider');
  }
  return ctx;
}

export function useStyles() {
  return useThemeStyles().styles;
}

export function useGameTheme() {
  return useThemeStyles().gameTheme;
}

export function useWorkoutTheme() {
  return useThemeStyles().workoutTheme;
}
