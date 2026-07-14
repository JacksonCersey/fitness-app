import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { computePerfectWeekRate, computeWeeksHitRate } from '../../utils/streakHistory';

const STREAK_LOGO = require('../../../assets/images/icons/streaklogo.png');
const PERFECT_STREAK_LOGO = require('../../../assets/images/icons/perfectstreaklogo.png');

/**
 * Rate stats strip for Progress → Streak.
 * @param {{
 *   scheduledDayAdherence: { completed: number; target: number; rate: number | null } | null;
 *   workoutHistory: unknown[];
 *   weeklySplitPlan: { days?: { type: string; mixedMuscles?: string[] }[] } | null;
 * }} props
 */
function ProgressStreakRatesPanel({ scheduledDayAdherence, workoutHistory, weeklySplitPlan }) {
  const styles = useStyles();
  const theme = useGameTheme();

  const weeksHit = useMemo(() => computeWeeksHitRate(workoutHistory), [workoutHistory]);
  const perfectRate = useMemo(
    () => computePerfectWeekRate(weeklySplitPlan, workoutHistory),
    [weeklySplitPlan, workoutHistory],
  );

  const workoutsCompleted = Array.isArray(workoutHistory) ? workoutHistory.length : 0;
  const dayRate = scheduledDayAdherence?.rate ?? null;

  const formatPct = (rate) => (rate == null ? '—' : `${Math.round(rate * 100)}%`);

  const cells = [
    {
      key: 'days',
      icon: <Text style={styles.progressStreakRatesCheck}>%</Text>,
      value: formatPct(dayRate),
      label: 'day hit rate',
    },
    {
      key: 'weeks',
      icon: <Image source={STREAK_LOGO} style={styles.progressStreakRatesIcon} />,
      value: formatPct(weeksHit.rate),
      label: 'weeks trained',
    },
    {
      key: 'perfect',
      icon: <Image source={PERFECT_STREAK_LOGO} style={styles.progressStreakRatesIcon} />,
      value: formatPct(perfectRate.rate),
      label: 'perfect weeks',
    },
    {
      key: 'workouts',
      icon: <Text style={styles.progressStreakRatesCheck}>✓</Text>,
      value: workoutsCompleted > 0 ? String(workoutsCompleted) : '—',
      label: 'workouts',
    },
  ];

  return (
    <View style={styles.progressStreakRatesPanel}>
      <Text style={styles.progressStreakSectionTitle}>Rates</Text>
      <View style={styles.progressStreakRatesGrid}>
        {cells.map((cell) => (
          <View key={cell.key} style={styles.progressStreakRatesCell}>
            <View style={[styles.progressStreakRatesIconWell, { borderColor: theme.borderSubtle }]}>
              {cell.icon}
            </View>
            <Text style={styles.progressStreakRatesValue}>{cell.value}</Text>
            <Text style={styles.progressStreakRatesLabel}>{cell.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default memo(ProgressStreakRatesPanel);
