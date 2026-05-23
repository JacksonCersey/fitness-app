import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

/** Matches `weekdayBarLetterActiveWorkout` / streak flame accent on the home week strip. */
const DEFAULT_STREAK_ORANGE = '#F59E0B';

/**
 * Circular progress for “completed vs planned” training days.
 * @param {{ completed: number; target: number; trackColor: string; progressColor: string; centerTextColor: string; workoutsLabelColor?: string; size?: number; strokeWidth?: number; isComplete?: boolean }} props
 */
function WeeklySplitProgressRing({
  completed,
  target,
  trackColor,
  progressColor,
  centerTextColor,
  workoutsLabelColor,
  size = 168,
  strokeWidth = 14,
  isComplete = false,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = target > 0 ? Math.min(1, Math.max(0, completed / target)) : 0;
  const strokeDashoffset = circumference * (1 - frac);

  const arcColor = isComplete ? DEFAULT_STREAK_ORANGE : progressColor;
  const textColor = isComplete ? DEFAULT_STREAK_ORANGE : centerTextColor;
  const captionColor = workoutsLabelColor ?? textColor;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {target > 0 ? (
          <G transform={`rotate(-90 ${cx} ${cy})`}>
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={arcColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        ) : null}
      </Svg>
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: textColor }}>
          {completed}
          <Text style={{ fontSize: 19, fontWeight: '700', color: textColor }}>{` / ${target > 0 ? target : '—'}`}</Text>
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: captionColor, marginTop: 2, letterSpacing: 0.3 }}>
          workouts
        </Text>
      </View>
    </View>
  );
}

export default memo(WeeklySplitProgressRing);
