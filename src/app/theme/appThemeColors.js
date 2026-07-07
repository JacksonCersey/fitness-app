import { getGameTheme, toLegacyAppColors } from '../../theme/gameTheme';

export function getAppThemeColors() {
  return toLegacyAppColors(getGameTheme());
}
