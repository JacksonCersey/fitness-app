import { getGameTheme, toLegacyAppColors } from '../../theme/gameTheme';

export function getAppThemeColors(isLightTheme) {
  return toLegacyAppColors(getGameTheme(isLightTheme));
}
