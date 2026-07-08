import React, { memo, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { weeklySplitPlanIsConfigured } from '../../data/weeklySplitPlanner';
import {
  STREAK_CHART_TIME_RANGE_OPTIONS,
  filterPointsByChartRange,
} from '../../utils/chartTimeRange';
import {
  buildPerfectStreakHistorySeries,
  buildTrainingStreakHistorySeries,
} from '../../utils/streakHistory';
import ProgressChartRangeFilter from './ProgressChartRangeFilter';
import StrengthScoreHistoryChart from './StrengthScoreHistoryChart';

/**
 * Training + perfect streak history line charts with range filters.
 * @param {{
 *   workoutHistory: unknown[];
 *   weeklySplitPlan: { days?: { type: string; mixedMuscles?: string[] }[] } | null;
 * }} props
 */
function ProgressStreakHistoryGraphs({ workoutHistory, weeklySplitPlan }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const [trainingRange, setTrainingRange] = useState('all');
  const [perfectRange, setPerfectRange] = useState('all');
  const planConfigured = weeklySplitPlanIsConfigured(weeklySplitPlan);

  const trainingSeries = useMemo(
    () => buildTrainingStreakHistorySeries(workoutHistory),
    [workoutHistory],
  );
  const perfectSeries = useMemo(
    () => (planConfigured ? buildPerfectStreakHistorySeries(weeklySplitPlan, workoutHistory) : []),
    [planConfigured, weeklySplitPlan, workoutHistory],
  );

  const filteredTraining = useMemo(
    () => filterPointsByChartRange(trainingSeries, trainingRange),
    [trainingSeries, trainingRange],
  );
  const filteredPerfect = useMemo(
    () => filterPointsByChartRange(perfectSeries, perfectRange),
    [perfectSeries, perfectRange],
  );

  return (
    <View style={styles.progressStreakGraphsSection}>
      <View style={styles.progressStreakGraphCard}>
        <Text style={styles.progressStreakSectionTitle}>Streak history</Text>
        <ProgressChartRangeFilter
          value={trainingRange}
          onChange={setTrainingRange}
          options={STREAK_CHART_TIME_RANGE_OPTIONS}
        />
        <StrengthScoreHistoryChart
          points={filteredTraining}
          lineColor="#F97316"
          axisColor={theme.borderSubtle}
          textColor={theme.textMuted}
          pointColor="#FB923C"
          emptyMessage={
            trainingRange === 'all' ? 'No streak history yet.' : 'No data in this range.'
          }
        />
      </View>

      <View style={styles.progressStreakGraphCard}>
        <Text style={styles.progressStreakSectionTitle}>Perfect history</Text>
        {!planConfigured ? (
          <Text style={styles.progressStreakEmptyHint}>Set up your weekly split first.</Text>
        ) : (
          <>
            <ProgressChartRangeFilter
              value={perfectRange}
              onChange={setPerfectRange}
              options={STREAK_CHART_TIME_RANGE_OPTIONS}
            />
            <StrengthScoreHistoryChart
              points={filteredPerfect}
              lineColor="#A855F7"
              axisColor={theme.borderSubtle}
              textColor={theme.textMuted}
              pointColor="#EC4899"
              emptyMessage={
                perfectRange === 'all' ? 'No perfect-week history yet.' : 'No data in this range.'
              }
            />
          </>
        )}
      </View>
    </View>
  );
}

export default memo(ProgressStreakHistoryGraphs);
