import React, { memo, useMemo } from 'react';
import { Image, View } from 'react-native';

/**
 * Shows one panel from a horizontal multi-panel exercise diagram strip.
 * Most strips are 2 panels; walking lunges are 4, incline bench is 3.
 *
 * Uses the asset’s real pixel size so short/wide strips (e.g. lunges at
 * 1024×220) don’t get `cover`-cropped into empty black.
 *
 * @param {{
 *   source: number;
 *   size?: number;
 *   panels?: number;
 *   panelIndex?: number;
 *   style?: object;
 * }} props
 */
function ExerciseDiagramIcon({ source, size = 48, panels = 2, panelIndex = 0, style }) {
  const panelCount = Number.isFinite(panels) && panels >= 1 ? Math.floor(panels) : 2;
  const index = Math.max(0, Math.min(panelCount - 1, Math.floor(panelIndex)));

  const layout = useMemo(() => {
    if (!source) {
      return { stripWidth: size * panelCount, translateX: 0 };
    }
    const resolved = Image.resolveAssetSource(source);
    const natW = resolved?.width > 0 ? resolved.width : panelCount;
    const natH = resolved?.height > 0 ? resolved.height : 1;

    // Fit full strip height into the icon; each panel keeps its true aspect.
    const scale = size / natH;
    const stripWidth = natW * scale;
    const panelWidth = stripWidth / panelCount;

    return {
      stripWidth,
      // Shift so the chosen panel is centered in the square clip when possible.
      translateX: size / 2 - (index + 0.5) * panelWidth,
    };
  }, [source, size, panelCount, index]);

  if (!source) return null;

  return (
    <View style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      <Image
        source={source}
        style={{
          width: layout.stripWidth,
          height: size,
          transform: [{ translateX: layout.translateX }],
        }}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export default memo(ExerciseDiagramIcon);
