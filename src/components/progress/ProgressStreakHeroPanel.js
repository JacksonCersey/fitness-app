import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { getStreakRankProgress } from '../../data/streakRanks';
import { computeBestTrainingWeekStreak, hasLoggedWorkoutInCurrentWeek } from '../../utils/consecutiveWeekStreak';
import InfoBubbleButton from '../common/InfoBubbleButton';

const STREAK_LOGO_ACTIVE = require('../../../assets/images/icons/streaklogo.png');
const STREAK_LOGO_INACTIVE = require('../../../assets/images/streaklogo-inactive.png');
/** Fixed orange for the week-streak progress bar (not rank accent). */
const STREAK_BAR_ORANGE = '#F97316';

const WEEK_STREAK_INFO =
  'Your week streak counts consecutive Sunday–Saturday weeks with at least one logged workout.\n\nIf you have not trained yet this week, your streak stays intact until the week ends — then it resets if you miss it.';

/**
 * Expanded current-streak hero for Progress → Streak.
 * @param {{
 *   consecutiveTrainingWeekStreak: number;
 *   workoutHistory: unknown[];
 * }} props
 */
function ProgressStreakHeroPanel({ consecutiveTrainingWeekStreak, workoutHistory }) {
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
  const fillPct = Math.round(rank.progress * 100);

  return (
    <View
      style={styles.progressStreakHeroPanel}
      accessibilityLabel={`${currentWeeks} week streak, ${rank.displayRank.label} rank`}>
      <View style={styles.progressStreakHeroHeaderRow}>
        <Text style={styles.progressStreakSectionTitle}>Week streak</Text>
        <InfoBubbleButton
          title="Week streak"
          message={WEEK_STREAK_INFO}
          accessibilityLabel="How week streak works"
        />
      </View>

      <View style={styles.progressStreakHeroTopRow}>
        <Image
          source={isStreakActive ? STREAK_LOGO_ACTIVE : STREAK_LOGO_INACTIVE}
          style={styles.progressStreakHeroFlame}
        />
        <View style={styles.progressStreakHeroRankCol}>
          <Text style={styles.progressStreakHeroRankName}>{rank.displayRank.label}</Text>
          {!rank.isMaxRank && rank.nextRank ? (
            <View style={styles.progressStreakHeroProgressMeta}>
              <View style={[styles.progressStreakHeroProgressTrack, { borderColor: `${STREAK_BAR_ORANGE}44` }]}>
                <View
                  style={[
                    styles.progressStreakHeroProgressFill,
                    { width: `${fillPct}%`, backgroundColor: STREAK_BAR_ORANGE },
                  ]}
                />
              </View>
              <Text style={styles.progressStreakHeroProgressFraction}>
                {rank.progressWeeksCurrent}/{rank.progressWeeksTarget}
              </Text>
            </View>
          ) : (
            <Text style={styles.progressStreakHeroProgressHint}>Max rank</Text>
          )}
        </View>
      </View>

      <Text style={styles.progressStreakHeroWeeksValue}>
        {currentWeeks} {currentWeeks === 1 ? 'week' : 'weeks'}
      </Text>

      <View style={styles.progressStreakHeroFooterRow}>
        <Text style={styles.progressStreakHeroFooterLabel}>record {recordWeeks}</Text>
        <View style={styles.progressStreakHeroFooterDot} />
        <Text style={styles.progressStreakHeroFooterLabel}>current {currentWeeks}</Text>
      </View>
    </View>
  );
}

export default memo(ProgressStreakHeroPanel);
