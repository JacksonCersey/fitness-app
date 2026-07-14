import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { computeBestTrainingWeekStreak } from '../../utils/consecutiveWeekStreak';
import { formatVolumeCompact } from '../../../utils/workoutStats';

const STREAK_LOGO = require('../../../assets/images/icons/streaklogo.png');
const PERFECT_STREAK_LOGO = require('../../../assets/images/icons/perfectstreaklogo.png');
const WEIGHT_ICON = require('../../../assets/images/icons/weighticon.png');

const RING_SIZE = 140;
const RING_STROKE = 10;

/**
 * @param {{
 *   rate: number | null;
 *   trackColor: string;
 *   progressColor: string;
 *   centerTextColor: string;
 *   mutedTextColor: string;
 *   percentLabel: string;
 *   captionLabel: string;
 *   emptyHint?: string | null;
 * }} props
 */
function AdherenceHeroRing({
  rate,
  trackColor,
  progressColor,
  centerTextColor,
  mutedTextColor,
  percentLabel,
  captionLabel,
  emptyHint,
}) {
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = rate == null ? 0 : Math.min(1, Math.max(0, rate));
  const strokeDashoffset = circumference * (1 - frac);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={RING_STROKE} fill="none" />
          {rate != null ? (
            <G transform={`rotate(-90 ${cx} ${cy})`}>
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                stroke={progressColor}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          ) : null}
        </Svg>
        <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 34, fontWeight: '800', color: centerTextColor, fontVariant: ['tabular-nums'] }}>
            {percentLabel}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: mutedTextColor, marginTop: 2 }}>{captionLabel}</Text>
        </View>
      </View>
      {emptyHint ? (
        <Text style={{ fontSize: 12, fontWeight: '600', color: mutedTextColor, marginTop: 8, textAlign: 'center' }}>
          {emptyHint}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * @param {{
 *   adherence: { completed: number; target: number; rate: number | null };
 *   workoutHistory: unknown[];
 *   consecutivePerfectWeekStreak: number;
 *   lifetimeVolumeLb: number;
 * }} props
 */
function ProgressOverviewAdherencePanel({
  adherence,
  workoutHistory,
  consecutivePerfectWeekStreak,
  lifetimeVolumeLb,
}) {
  const styles = useStyles();
  const theme = useGameTheme();

  const recordStreakWeeks = useMemo(
    () => computeBestTrainingWeekStreak(workoutHistory),
    [workoutHistory],
  );

  const workoutsCompleted = Array.isArray(workoutHistory) ? workoutHistory.length : 0;
  const perfectWeeks = Math.max(0, consecutivePerfectWeekStreak);
  const rate = adherence?.rate ?? null;

  const percentLabel = rate == null ? '—' : `${Math.round(rate * 100)}%`;
  const emptyHint = rate == null ? 'Set up your weekly split to track scheduled days' : null;

  const streakValue =
    recordStreakWeeks > 0 ? `${recordStreakWeeks} ${recordStreakWeeks === 1 ? 'week' : 'weeks'}` : '—';
  const perfectValue = perfectWeeks > 0 ? `${perfectWeeks} ${perfectWeeks === 1 ? 'week' : 'weeks'}` : '—';
  const workoutsValue = workoutsCompleted > 0 ? String(workoutsCompleted) : '—';
  const volumeValue = lifetimeVolumeLb > 0 ? formatVolumeCompact(lifetimeVolumeLb) : '—';

  const trackColor = theme.surfaceMuted ?? 'rgba(255, 255, 255, 0.12)';

  const statRows = [
    [
      {
        key: 'streak',
        icon: <Image source={STREAK_LOGO} style={styles.progressOverviewAdherenceStatIcon} />,
        value: streakValue,
        label: 'streak',
      },
      {
        key: 'perfect',
        icon: <Image source={PERFECT_STREAK_LOGO} style={styles.progressOverviewAdherenceStatIcon} />,
        value: perfectValue,
        label: 'perfect',
      },
    ],
    [
      {
        key: 'workouts',
        icon: <Text style={styles.progressOverviewAdherenceStatCheck}>✓</Text>,
        value: workoutsValue,
        label: 'workouts',
      },
      {
        key: 'weight',
        icon: (
          <Image
            source={WEIGHT_ICON}
            style={[styles.progressOverviewAdherenceStatIcon, { tintColor: theme.navAccent }]}
          />
        ),
        value: volumeValue,
        label: 'lifted',
      },
    ],
  ];

  return (
    <View style={styles.progressOverviewAdherenceCard}>
      <View style={styles.progressOverviewAdherenceHero}>
        <AdherenceHeroRing
          rate={rate}
          trackColor={trackColor}
          progressColor={theme.navAccent}
          centerTextColor={theme.textPrimary}
          mutedTextColor={theme.textMuted}
          percentLabel={percentLabel}
          captionLabel="Days"
          emptyHint={emptyHint}
        />
      </View>

      <View style={styles.progressOverviewAdherenceStatsGrid}>
        {statRows.map((row) => (
          <View key={row.map((cell) => cell.key).join('-')} style={styles.progressOverviewAdherenceStatsRow}>
            {row.map((cell) => (
              <View key={cell.key} style={styles.progressOverviewAdherenceStatCell}>
                <View style={styles.progressOverviewAdherenceStatIconWell}>{cell.icon}</View>
                <Text style={styles.progressOverviewAdherenceStatValue}>{cell.value}</Text>
                <Text style={styles.progressOverviewAdherenceStatLabel}>{cell.label}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(ProgressOverviewAdherencePanel);
