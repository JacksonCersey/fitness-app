import { GAME_THEME_LIGHT } from '../theme/gameTheme';
import { createThemedStyles } from './createThemedStyles';

/** Static fallback for unmigrated imports — always light candy theme. */
export const styles = createThemedStyles(GAME_THEME_LIGHT);

export { createThemedStyles };
