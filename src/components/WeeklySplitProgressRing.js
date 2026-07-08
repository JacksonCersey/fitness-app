import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { SHARED_ACCENTS } from '../theme/gameTheme';

/** Matches `weekdayBarLetterActiveWorkout` / streak flame accent on the home week strip. */
const DEFAULT_STREAK_ORANGE = SHARED_ACCENTS.streakGold;

/**
 * Circular progress for “completed vs planned” training days.
 * @param {{ completed: number; target: number; trackColor: string; progressColor: string; centerTextColor: string; workoutsLabelColor?: string; size?: number; strokeWidth?: number; isComplete?: boolean; isPerfectStreakActive?: boolean }} props
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
  isPerfectStreakActive = false,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = target > 0 ? Math.min(1, Math.max(0, completed / target)) : 0;
  const strokeDashoffset = circumference * (1 - frac);

  const perfectGradientId = 'weeklySplitRingPerfectGradient';
  const arcColor = isPerfectStreakActive
    ? `url(#${perfectGradientId})`
    : isComplete
      ? DEFAULT_STREAK_ORANGE
      : progressColor;
  const textColor = isPerfectStreakActive ? SHARED_ACCENTS.navAccent : isComplete ? DEFAULT_STREAK_ORANGE : centerTextColor;
  const captionColor = workoutsLabelColor ?? textColor;
  const workoutWord = target === 1 ? 'workout' : 'workouts';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        {isPerfectStreakActive ? (
          <Defs>
            <LinearGradient id={perfectGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={SHARED_ACCENTS.gradientStart} />
              <Stop offset="48%" stopColor={SHARED_ACCENTS.gradientMid} />
              <Stop offset="100%" stopColor={SHARED_ACCENTS.gradientEnd} />
            </LinearGradient>
          </Defs>
        ) : null}
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
          {workoutWord}
        </Text>
      </View>
    </View>
  );
}

export default memo(WeeklySplitProgressRing);
