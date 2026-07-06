import React, { memo, useId } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';

const GLOW_HEIGHT = 280;

/**
 * Soft red glow behind the home dashboard body panel (sits under the sheet, bleeds upward).
 */
function HomeBodyPanelGlow() {
  const styles = useStyles();
  const theme = useGameTheme();
  const { width } = useWindowDimensions();
  const gradId = useId().replace(/:/g, '_');
  const glowWidth = Math.max(1, width);
  const accent = theme.navAccent;

  return (
    <View style={styles.homeBodyPanelGlow} pointerEvents="none" accessibilityElementsHidden>
      <Svg width={glowWidth} height={GLOW_HEIGHT}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="88%" rx="62%" ry="56%">
            <Stop offset="0%" stopColor={accent} stopOpacity="0.92" />
            <Stop offset="32%" stopColor={accent} stopOpacity="0.58" />
            <Stop offset="58%" stopColor={accent} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={glowWidth} height={GLOW_HEIGHT} fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
}

export default memo(HomeBodyPanelGlow);
