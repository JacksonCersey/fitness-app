import React, { memo, useCallback, useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

/** Matches `dashboardWeekProgressStreakNumber` */
const DIGIT_FONT_SIZE = 26;
/** Matches `dashboardWeekProgressStreakWords` */
const SUFFIX_FONT_SIZE = 15;

/** Width reserved for gradient digit(s) only (tight left cluster). */
function widthForDigits(value) {
  const len = String(Math.max(0, Math.floor(value))).length;
  return Math.max(20, 8 + len * 16);
}

const BASELINE_Y = 28;
const SUFFIX_COLOR = 'rgba(238, 241, 255, 0.9)';

/**
 * Gradient digit + suffix; stretches with parent so streak sub-boxes can match width.
 * @param {{ value: number; suffix: string }} props
 */
function PerfectStreakGradientNumber({ value, suffix }) {
  const [svgW, setSvgW] = useState(0);
  const digitW = widthForDigits(value);
  const h = 34;
  const rawId = useId().replace(/[^a-zA-Z0-9-_]/g, '');
  const gradId = `perfectStreakGrad-${rawId}`;

  const onLayout = useCallback((e) => {
    const nw = Math.round(e.nativeEvent.layout.width);
    if (nw > 0) {
      setSvgW((prev) => (prev === nw ? prev : nw));
    }
  }, []);

  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: h }} onLayout={onLayout}>
      {svgW > 0 ? (
        <Svg width={svgW} height={h}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FEF9C3" />
              <Stop offset="32%" stopColor="#FDE047" />
              <Stop offset="62%" stopColor="#FBBF24" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
          </Defs>
          <SvgText
            fill={`url(#${gradId})`}
            fontSize={DIGIT_FONT_SIZE}
            fontWeight="800"
            x="0"
            y={BASELINE_Y}>
            {String(value)}
          </SvgText>
          <SvgText
            fill={SUFFIX_COLOR}
            fontSize={SUFFIX_FONT_SIZE}
            fontWeight="700"
            x={digitW}
            y={BASELINE_Y}>
            {suffix}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height: h }} />
      )}
    </View>
  );
}

export default memo(PerfectStreakGradientNumber);
