import React, { memo, useMemo, useState } from 'react';
import { Image, View } from 'react-native';

/**
 * Shows the full multi-panel exercise diagram strip (start → end poses),
 * scaled to fit the available width.
 *
 * @param {{
 *   source: number;
 *   style?: object;
 * }} props
 */
function ExerciseDiagramFull({ source, style }) {
  const [containerWidth, setContainerWidth] = useState(0);

  const layout = useMemo(() => {
    if (!source || containerWidth <= 0) {
      return { width: 0, height: 0 };
    }
    const resolved = Image.resolveAssetSource(source);
    const natW = resolved?.width > 0 ? resolved.width : 2;
    const natH = resolved?.height > 0 ? resolved.height : 1;
    const width = containerWidth;
    const height = Math.max(1, (width * natH) / natW);
    return { width, height };
  }, [source, containerWidth]);

  if (!source) return null;

  return (
    <View
      style={[{ width: '100%', alignItems: 'center', overflow: 'hidden' }, style]}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        if (next > 0 && next !== containerWidth) setContainerWidth(next);
      }}
      accessibilityIgnoresInvertColors
      accessibilityRole="image"
      accessibilityLabel="Exercise form diagram">
      {layout.width > 0 ? (
        <Image
          source={source}
          style={{ width: layout.width, height: layout.height }}
          resizeMode="contain"
        />
      ) : null}
    </View>
  );
}

export default memo(ExerciseDiagramFull);
