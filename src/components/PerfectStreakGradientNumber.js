import React, { memo, useId } from 'react';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { SHARED_ACCENTS } from '../theme/gameTheme';

/** Matches `dashboardWeekProgressStreakNumber` */
const DIGIT_FONT_SIZE = 26;

/** Width reserved for gradient digit(s) only (tight left cluster). */
function widthForDigits(value) {
  const len = String(Math.max(0, Math.floor(value))).length;
  return Math.max(20, 8 + len * 16);
}

const BASELINE_Y = 28;

/**
 * Gradient number only, used next to plain text labels.
 * @param {{ value: number }} props
 */
function PerfectStreakGradientNumber({ value }) {
  const digitW = widthForDigits(value);
  const h = 34;
  const rawId = useId().replace(/[^a-zA-Z0-9-_]/g, '');
  const gradId = `perfectStreakGrad-${rawId}`;

  return (
    <Svg width={digitW} height={h}>
      <Defs>
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={SHARED_ACCENTS.gradientStart} />
          <Stop offset="48%" stopColor={SHARED_ACCENTS.gradientMid} />
          <Stop offset="100%" stopColor={SHARED_ACCENTS.gradientEnd} />
        </LinearGradient>
      </Defs>
      <SvgText fill={`url(#${gradId})`} fontSize={DIGIT_FONT_SIZE} fontWeight="800" x="0" y={BASELINE_Y}>
        {String(value)}
      </SvgText>
    </Svg>
  );
}

export default memo(PerfectStreakGradientNumber);
