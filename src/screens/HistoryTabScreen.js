import React, { memo, useMemo } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import { ScrollView, Text, View } from 'react-native';
import PastWorkoutsMonthCalendar from '../../components/PastWorkoutsMonthCalendar';
import AnimatedSegmentedControl from '../components/common/AnimatedSegmentedControl';
import ProgressStrengthScoreOverview from '../components/progress/ProgressStrengthScoreOverview';
import ProgressOverviewStreakPanel from '../components/progress/ProgressOverviewStreakPanel';
import ProgressOverviewAdherencePanel from '../components/progress/ProgressOverviewAdherencePanel';
import ProgressStrengthScoreBodyPanel from '../components/progress/ProgressStrengthScoreBodyPanel';
import ProgressBodyWeightSection from '../components/progress/ProgressBodyWeightSection';
import ProgressStreakHeroPanel from '../components/progress/ProgressStreakHeroPanel';
import ProgressStreakRankPanel from '../components/progress/ProgressStreakRankPanel';
import ProgressPerfectStreakPanel from '../components/progress/ProgressPerfectStreakPanel';
import ProgressStreakRatesPanel from '../components/progress/ProgressStreakRatesPanel';
import ProgressStreakHistoryGraphs from '../components/progress/ProgressStreakHistoryGraphs';

const PROGRESS_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'body', label: 'Body' },
  { id: 'streak', label: 'Streak' },
];

function HistoryTabScreen({
  mainTabBottomReserve,
  historyProgressSection,
  setHistoryProgressSection,
  openWeightLogModal,
  openWeightLogModalForEdit,
  historyWeightChartPoints,
  historyAllWeightLogsSorted,
  handleDeleteWeightLogEntry,
  historyCalendarMonth,
  historyCalendarYear,
  shiftHistoryCalendarMonth,
  workoutHistory,
  strengthScoreSummary,
  consecutiveTrainingWeekStreak,
  scheduledDayAdherence,
  consecutivePerfectWeekStreak,
  lifetimeVolumeLb,
  weeklySplitPlan,
  onOpenDayWorkouts,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const calendarMonthLabel = useMemo(() => {
    const month = String(historyCalendarMonth + 1).padStart(2, '0');
    return `${month}/${historyCalendarYear}`;
  }, [historyCalendarMonth, historyCalendarYear]);

  return (
    <View style={[styles.menuHomeShell, styles.historyProgressBody]}>
      <AnimatedSegmentedControl
        options={PROGRESS_SECTIONS}
        value={historyProgressSection}
        onChange={setHistoryProgressSection}
        accessibilityRole="tablist"
        optionAccessibilityRole="tab"
        style={styles.historyProgressSegmentBar}
        optionStyle={styles.historyProgressSegmentOption}
        textStyle={styles.historyProgressSegmentText}
        activeTextStyle={styles.historyProgressSegmentTextActive}
        inactiveTextColor={theme.textSecondary}
        activeTextColor="#FFFFFF"
        pillColor={theme.navAccent}
      />

      <ScrollView
        style={styles.mainTabsFullBleedScroll}
        contentContainerStyle={[
          styles.historyProgressScroll,
          { paddingBottom: 28 + mainTabBottomReserve },
        ]}
        showsVerticalScrollIndicator={false}>
        {historyProgressSection === 'overview' ? (
          <>
            <ProgressStrengthScoreOverview summary={strengthScoreSummary} />

            <ProgressOverviewStreakPanel
              consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
              workoutHistory={workoutHistory}
              onOpenStreakTab={() => setHistoryProgressSection('streak')}
            />

            <Text style={styles.progressCalendarMonthLabel}>{calendarMonthLabel}</Text>

            <PastWorkoutsMonthCalendar
              year={historyCalendarYear}
              monthIndex={historyCalendarMonth}
              workoutHistory={workoutHistory}
              onShiftMonth={shiftHistoryCalendarMonth}
              onPressDayWithWorkout={(pick) => onOpenDayWorkouts(pick)}
              styles={styles}
              textPrimary={theme.textPrimary}
              textMuted={theme.textMuted}
              accentSolid={theme.navAccent}
              today={new Date()}
            />

            <ProgressOverviewAdherencePanel
              adherence={scheduledDayAdherence}
              workoutHistory={workoutHistory}
              consecutivePerfectWeekStreak={consecutivePerfectWeekStreak}
              lifetimeVolumeLb={lifetimeVolumeLb ?? 0}
            />
          </>
        ) : null}

        {historyProgressSection === 'body' ? (
          <>
            <ProgressStrengthScoreBodyPanel summary={strengthScoreSummary} />

            <ProgressBodyWeightSection
              openWeightLogModal={openWeightLogModal}
              openWeightLogModalForEdit={openWeightLogModalForEdit}
              historyWeightChartPoints={historyWeightChartPoints}
              historyAllWeightLogsSorted={historyAllWeightLogsSorted}
              handleDeleteWeightLogEntry={handleDeleteWeightLogEntry}
            />
          </>
        ) : null}

        {historyProgressSection === 'streak' ? (
          <>
            <ProgressStreakHeroPanel
              consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
              workoutHistory={workoutHistory}
            />
            <ProgressStreakRankPanel
              consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
              workoutHistory={workoutHistory}
            />
            <ProgressPerfectStreakPanel
              consecutivePerfectWeekStreak={consecutivePerfectWeekStreak}
              workoutHistory={workoutHistory}
              weeklySplitPlan={weeklySplitPlan}
            />
            <ProgressStreakRatesPanel
              scheduledDayAdherence={scheduledDayAdherence}
              workoutHistory={workoutHistory}
              weeklySplitPlan={weeklySplitPlan}
            />
            <ProgressStreakHistoryGraphs
              workoutHistory={workoutHistory}
              weeklySplitPlan={weeklySplitPlan}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default memo(HistoryTabScreen);
