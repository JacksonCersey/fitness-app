import React, { memo, useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { getStreakRankProgress } from '../../data/streakRanks';
import { computeBestTrainingWeekStreak, hasLoggedWorkoutInCurrentWeek } from '../../utils/consecutiveWeekStreak';

const STREAK_LOGO_ACTIVE = require('../../../assets/images/icons/streaklogo.png');
const STREAK_LOGO_INACTIVE = require('../../../assets/images/streaklogo-inactive.png');

/**
 * Streak summary panel for the Progress Overview tab.
 * @param {{
 *   consecutiveTrainingWeekStreak: number,
 *   workoutHistory: unknown[],
 *   onOpenStreakTab: () => void,
 * }} props
 */
function ProgressOverviewStreakPanel({
  consecutiveTrainingWeekStreak,
  workoutHistory,
  onOpenStreakTab,
}) {
  const styles = useStyles();

  const rank = useMemo(
    () => getStreakRankProgress(consecutiveTrainingWeekStreak),
    [consecutiveTrainingWeekStreak],
  );

  const recordWeeks = useMemo(
    () => computeBestTrainingWeekStreak(workoutHistory),
    [workoutHistory],
  );

  const currentWeeks = Math.max(0, consecutiveTrainingWeekStreak);
  const isStreakActive = hasLoggedWorkoutInCurrentWeek(workoutHistory);
  const rankAccent = rank.displayRank.accent;
  const fillPct = Math.round(rank.progress * 100);
  const progressHint = `${rank.progressWeeksCurrent}/${rank.progressWeeksTarget}`;

  return (
    <TouchableOpacity
      style={styles.progressOverviewStreakPanel}
      onPress={onOpenStreakTab}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${currentWeeks} week streak, ${rank.displayRank.label} rank. Open streak details.`}>
      <View style={styles.progressOverviewStreakTopRow}>
        <Image
          source={isStreakActive ? STREAK_LOGO_ACTIVE : STREAK_LOGO_INACTIVE}
          style={styles.progressOverviewStreakFlame}
        />
        <View style={styles.progressOverviewStreakRankCol}>
          <Text style={styles.progressOverviewStreakRankName}>{rank.displayRank.label}</Text>
          <View style={styles.progressOverviewStreakProgressMeta}>
            <View style={[styles.progressOverviewStreakProgressTrack, { borderColor: `${rankAccent}44` }]}>
              <View
                style={[
                  styles.progressOverviewStreakProgressFill,
                  { width: `${fillPct}%`, backgroundColor: rankAccent },
                ]}
              />
            </View>
            <Text style={styles.progressOverviewStreakProgressFraction}>{progressHint}</Text>
          </View>
        </View>
        <Image source={rank.displayRank.image} style={styles.progressOverviewStreakRankBadge} resizeMode="contain" />
      </View>

      <Text style={styles.progressOverviewStreakWeeksValue}>
        {currentWeeks} {currentWeeks === 1 ? 'week' : 'weeks'}
      </Text>

      <View style={styles.progressOverviewStreakFooterRow}>
        <View style={styles.progressOverviewStreakFooterLabels}>
          <Text style={styles.progressOverviewStreakFooterLabel}>
            record {recordWeeks}
          </Text>
          <View style={styles.progressOverviewStreakFooterDot} />
          <Text style={styles.progressOverviewStreakFooterLabel}>
            current {currentWeeks}
          </Text>
        </View>
        <Text style={styles.progressOverviewStreakChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ProgressOverviewStreakPanel);
