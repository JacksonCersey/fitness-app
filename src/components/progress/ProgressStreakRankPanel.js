import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { STREAK_RANKS, getStreakRankProgress } from '../../data/streakRanks';
import { filterPointsByChartRange, STREAK_CHART_TIME_RANGE_OPTIONS } from '../../utils/chartTimeRange';
import { computeBestTrainingWeekStreak } from '../../utils/consecutiveWeekStreak';
import { buildRankHistorySeries } from '../../utils/streakHistory';
import ProgressChartRangeFilter from './ProgressChartRangeFilter';
import ProgressRankHistoryChart from './ProgressRankHistoryChart';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RANK_FOLD_DURATION_MS = 340;

function configureRankFoldAnimation() {
  // Smooth height change for the panel + soft fade for the new/removed rows.
  LayoutAnimation.configureNext({
    duration: RANK_FOLD_DURATION_MS,
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

function showRankExplainer() {
  Alert.alert(
    'Rank',
    'Your rank is based on consecutive weeks with at least one logged workout.\n\nKeep the chain going to unlock the next tier. Flat stretches on the history graph mean you held a rank; jumps are rank-ups or streak breaks.',
    [{ text: 'Got it' }],
  );
}

/**
 * Rank ladder + attainment timeline for Progress → Streak.
 * Detail sections fold under a current-rank summary header.
 * @param {{
 *   consecutiveTrainingWeekStreak: number;
 *   workoutHistory: unknown[];
 * }} props
 */
function ProgressStreakRankPanel({ consecutiveTrainingWeekStreak, workoutHistory }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const [expanded, setExpanded] = useState(false);
  const [historyRange, setHistoryRange] = useState('all');
  const chevronAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: expanded ? 1 : 0,
      duration: RANK_FOLD_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [expanded, chevronAnim]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '90deg'],
  });

  const handleShowExplainer = useCallback(() => {
    showRankExplainer();
  }, []);

  const rank = useMemo(
    () => getStreakRankProgress(consecutiveTrainingWeekStreak),
    [consecutiveTrainingWeekStreak],
  );
  const bestWeeks = useMemo(
    () => computeBestTrainingWeekStreak(workoutHistory),
    [workoutHistory],
  );
  const bestRank = getStreakRankProgress(bestWeeks);

  const rankHistorySeries = useMemo(
    () => buildRankHistorySeries(workoutHistory),
    [workoutHistory],
  );
  const filteredRankHistory = useMemo(
    () => filterPointsByChartRange(rankHistorySeries, historyRange),
    [rankHistorySeries, historyRange],
  );

  const fillPct = Math.round(rank.progress * 100);
  const rankAccent = rank.displayRank.accent;
  const showNextRankProgress = !rank.isMaxRank && rank.nextRank;

  const handleToggle = () => {
    configureRankFoldAnimation();
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.progressStreakRankPanel}>
      <View style={styles.progressStreakHeroHeaderRow}>
        <Text style={styles.progressStreakSectionTitle}>Rank</Text>
        <TouchableOpacity
          style={styles.progressStrengthBodyInfoBtn}
          onPress={handleShowExplainer}
          accessibilityRole="button"
          accessibilityLabel="How rank works">
          <Text style={styles.progressStrengthBodyInfoBtnText}>i</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressStreakRankCurrentRow}>
        <Image source={rank.displayRank.image} style={styles.progressStreakRankCurrentBadge} resizeMode="contain" />
        <View style={styles.progressStreakRankCurrentTextCol}>
          <Text style={styles.progressStreakRankCurrentLabel}>{rank.displayRank.label}</Text>
          <Text style={styles.progressStreakRankCurrentSub}>
            {rank.streakWeeks} week{rank.streakWeeks === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={styles.progressStreakRankFoldBottomRow}>
        <View style={styles.progressStreakRankFoldProgressCol}>
          {showNextRankProgress ? (
            <>
              <View style={[styles.progressStreakRankProgressTrack, { borderColor: `${rankAccent}44` }]}>
                <View
                  style={[
                    styles.progressStreakRankProgressFill,
                    { width: `${fillPct}%`, backgroundColor: rankAccent },
                  ]}
                />
              </View>
              <Text style={styles.progressStreakRankProgressHint}>
                {rank.progressWeeksCurrent}/{rank.progressWeeksTarget} → {rank.nextRank.label}
              </Text>
            </>
          ) : (
            <Text style={styles.progressStreakRankProgressHint}>Max rank</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.progressStreakRankFoldChevronWell}
          onPress={handleToggle}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? 'Collapse rank details' : 'Expand rank details'}>
          <Animated.Text
            style={[styles.progressStreakRankFoldChevron, { transform: [{ rotate: chevronRotate }] }]}>
            ‹
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.progressStreakRankFoldExpanded}>
          <Text style={styles.progressStreakRankLadderHeading}>All ranks</Text>
          {STREAK_RANKS.map((tier) => {
            const earned = rank.streakWeeks >= tier.weeksRequired;
            const isCurrent = rank.currentRank?.id === tier.id;
            return (
              <View
                key={tier.id}
                style={[
                  styles.progressStreakRankLadderRow,
                  earned && styles.progressStreakRankLadderRowEarned,
                  isCurrent && styles.progressStreakRankLadderRowCurrent,
                ]}
                accessibilityLabel={`${tier.label}, ${tier.weeksRequired} week streak required${earned ? ', earned' : ''}`}>
                <Image
                  source={tier.image}
                  style={[
                    styles.progressStreakRankLadderIcon,
                    !earned && styles.progressStreakRankLadderIconLocked,
                  ]}
                  resizeMode="contain"
                />
                <View style={styles.progressStreakRankLadderTextCol}>
                  <Text
                    style={[
                      styles.progressStreakRankLadderName,
                      !earned && styles.progressStreakRankLadderNameLocked,
                    ]}>
                    {tier.label}
                  </Text>
                  <Text style={styles.progressStreakRankLadderWeeks}>
                    {tier.weeksRequired} wk
                  </Text>
                </View>
                {earned ? <Text style={styles.progressStreakRankLadderCheck}>✓</Text> : null}
              </View>
            );
          })}

          <Text style={styles.progressStreakRankLadderHeading}>History</Text>
          <Text style={styles.progressStreakRankHistorySummary}>
            Best {bestRank.displayRank.label}
            {bestWeeks > 0 ? ` · ${bestWeeks} wk` : ''}
          </Text>
          <ProgressChartRangeFilter
            value={historyRange}
            onChange={setHistoryRange}
            options={STREAK_CHART_TIME_RANGE_OPTIONS}
          />
          <ProgressRankHistoryChart
            points={filteredRankHistory}
            axisColor={theme.borderSubtle}
            textColor={theme.textMuted}
            emptyMessage={
              historyRange === 'all' ? 'No rank history yet.' : 'No data in this range.'
            }
          />
        </View>
      ) : null}
    </View>
  );
}

export default memo(ProgressStreakRankPanel);
