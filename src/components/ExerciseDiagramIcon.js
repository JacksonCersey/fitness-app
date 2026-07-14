import React, { memo } from 'react';
import { Image, View } from 'react-native';

/**
 * Shows only the first (leftmost) panel of a horizontal multi-panel exercise diagram.
 * Most diagrams have 2 panels; some have 3 or 4.
 *
 * @param {{
 *   source: number;
 *   size?: number;
 *   panels?: number;
 *   style?: object;
 * }} props
 */
function ExerciseDiagramIcon({ source, size = 48, panels = 2, style }) {
  if (!source) return null;

  const panelCount = Number.isFinite(panels) && panels >= 1 ? panels : 2;

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      <Image
        source={source}
        style={{ width: size * panelCount, height: size }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export default memo(ExerciseDiagramIcon);
