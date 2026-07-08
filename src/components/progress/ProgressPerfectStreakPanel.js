import React, { memo, useCallback, useMemo } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { weeklySplitPlanIsConfigured } from '../../data/weeklySplitPlanner';
import { getCurrentWeekPerfectCarouselState } from '../../utils/consecutivePerfectWeekStreak';
import { computeBestPerfectWeekStreak } from '../../utils/streakHistory';

const PERFECT_STREAK_LOGO = require('../../../assets/images/perfectstreaklogo.png');
const STREAK_LOGO_INACTIVE = require('../../../assets/images/streaklogo-inactive.png');

const RING_SIZE = 72;
const RING_STROKE = 7;

function showPerfectStreakExplainer() {
  Alert.alert(
    'Perfect weeks',
    'A perfect week means every scheduled training day on your weekly split had a logged workout.\n\nYour perfect streak counts consecutive weeks that fully hit the plan.',
    [{ text: 'Got it' }],
  );
}

/**
 * Perfect-week streak card for Progress → Streak.
 * @param {{
 *   consecutivePerfectWeekStreak: number;
 *   workoutHistory: unknown[];
 *   weeklySplitPlan: { days?: { type: string; mixedMuscles?: string[] }[] } | null;
 * }} props
 */
function ProgressPerfectStreakPanel({
  consecutivePerfectWeekStreak,
  workoutHistory,
  weeklySplitPlan,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const planConfigured = weeklySplitPlanIsConfigured(weeklySplitPlan);
  const handleShowExplainer = useCallback(() => {
    showPerfectStreakExplainer();
  }, []);

  const recordPerfect = useMemo(
    () => (planConfigured ? computeBestPerfectWeekStreak(weeklySplitPlan, workoutHistory) : 0),
    [planConfigured, weeklySplitPlan, workoutHistory],
  );

  const thisWeek = useMemo(
    () =>
      planConfigured
        ? getCurrentWeekPerfectCarouselState(weeklySplitPlan, workoutHistory)
        : { completedDays: 0, progress: 0, isActive: false },
    [planConfigured, weeklySplitPlan, workoutHistory],
  );

  const currentWeeks = Math.max(0, consecutivePerfectWeekStreak);
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const r = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, thisWeek.progress));
  const strokeDashoffset = circumference * (1 - frac);

  return (
    <View style={styles.progressPerfectStreakPanel}>
      <View style={styles.progressStreakHeroHeaderRow}>
        <Text style={styles.progressStreakSectionTitle}>Perfect weeks</Text>
        <TouchableOpacity
          style={styles.progressStrengthBodyInfoBtn}
          onPress={handleShowExplainer}
          accessibilityRole="button"
          accessibilityLabel="How perfect weeks work">
          <Text style={styles.progressStrengthBodyInfoBtnText}>i</Text>
        </TouchableOpacity>
      </View>

      {!planConfigured ? (
        <Text style={styles.progressStreakEmptyHint}>Set up your weekly split first.</Text>
      ) : (
        <>
          <View style={styles.progressPerfectStreakMainRow}>
            <Image
              source={thisWeek.isActive || currentWeeks > 0 ? PERFECT_STREAK_LOGO : STREAK_LOGO_INACTIVE}
              style={styles.progressPerfectStreakLogo}
            />
            <View style={styles.progressPerfectStreakTextCol}>
              <Text style={styles.progressPerfectStreakValue}>
                {currentWeeks} {currentWeeks === 1 ? 'week' : 'weeks'}
              </Text>
            </View>
            <View style={styles.progressPerfectStreakRingWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Defs>
                  <LinearGradient id="perfectRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#22D3EE" />
                    <Stop offset="55%" stopColor="#A855F7" />
                    <Stop offset="100%" stopColor="#EC4899" />
                  </LinearGradient>
                </Defs>
                <Circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={theme.surfaceMuted ?? 'rgba(255,255,255,0.12)'}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                {frac > 0 ? (
                  <G transform={`rotate(-90 ${cx} ${cy})`}>
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      stroke={thisWeek.isActive ? 'url(#perfectRingGrad)' : theme.textMuted}
                      strokeWidth={RING_STROKE}
                      fill="none"
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </G>
                ) : null}
              </Svg>
              <Text style={styles.progressPerfectStreakRingLabel}>{thisWeek.completedDays}/7</Text>
            </View>
          </View>

          <View style={styles.progressStreakHeroFooterRow}>
            <Text style={styles.progressStreakHeroFooterLabel}>record {recordPerfect}</Text>
            <View style={styles.progressStreakHeroFooterDot} />
            <Text style={styles.progressStreakHeroFooterLabel}>current {currentWeeks}</Text>
          </View>
        </>
      )}
    </View>
  );
}

export default memo(ProgressPerfectStreakPanel);
