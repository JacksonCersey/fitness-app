import React, { createContext, useContext, useMemo } from 'react';
import { getGameTheme, toWorkoutThemeShape } from '../../theme/gameTheme';
import { createThemedStyles } from '../../styles/createThemedStyles';
import { useAppStorage } from './AppStorageContext';

const ThemeStylesContext = createContext(null);

export function ThemeStylesProvider({ children }) {
  const { isLightTheme } = useAppStorage();
  const gameTheme = useMemo(() => getGameTheme(isLightTheme), [isLightTheme]);
  const styles = useMemo(() => createThemedStyles(gameTheme), [gameTheme]);
  const workoutTheme = useMemo(() => toWorkoutThemeShape(gameTheme), [gameTheme]);

  const value = useMemo(
    () => ({
      styles,
      gameTheme,
      workoutTheme,
      isLightTheme,
    }),
    [styles, gameTheme, workoutTheme, isLightTheme],
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
