import React, { memo, useMemo } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import PastWorkoutsMonthCalendar from '../../components/PastWorkoutsMonthCalendar';
import MonthlyVolumeChart from '../../components/MonthlyVolumeChart';
import StrengthScoreCard from '../components/StrengthScoreCard';
import ProgressStrengthScoreOverview from '../components/progress/ProgressStrengthScoreOverview';
import ProgressOverviewStreakPanel from '../components/progress/ProgressOverviewStreakPanel';
import ProgressOverviewAdherencePanel from '../components/progress/ProgressOverviewAdherencePanel';
import ProgressStrengthScoreBodyPanel from '../components/progress/ProgressStrengthScoreBodyPanel';
import ProgressBodyWeightSection from '../components/progress/ProgressBodyWeightSection';

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
  historyChartMode,
  setHistoryChartMode,
  historyCalendarMonth,
  historyCalendarYear,
  shiftHistoryCalendarMonth,
  historySelectedMonth,
  historySelectedYear,
  shiftHistoryMonth,
  shiftHistoryYear,
  historyYearLabel,
  historyMonthLabel,
  historyChartValues,
  historyMonthXAxisLabels,
  historyYearXAxisLabels,
  historyChartMax,
  workoutHistory,
  strengthScoreSummary,
  consecutiveTrainingWeekStreak,
  scheduledDayAdherence,
  consecutivePerfectWeekStreak,
  lifetimeVolumeLb,
  onOpenStrengthMovements,
  onOpenStrengthScoreHistory,
  onOpenDayWorkouts,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const strengthColors = {
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    accentSolid: theme.navAccent,
    cardBg: theme.cardBg,
    cardBorder: theme.cardBorder,
  };
  const calendarMonthLabel = useMemo(() => {
    const month = String(historyCalendarMonth + 1).padStart(2, '0');
    return `${month}/${historyCalendarYear}`;
  }, [historyCalendarMonth, historyCalendarYear]);
  return (
    <View style={[styles.menuHomeShell, styles.historyProgressBody]}>
      <View style={styles.historyProgressSegmentBar} accessibilityRole="tablist">
        {PROGRESS_SECTIONS.map((section) => {
          const isActive = historyProgressSection === section.id;
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.historyProgressSegmentOption,
                isActive && styles.historyProgressSegmentOptionActive,
              ]}
              onPress={() => setHistoryProgressSection(section.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={section.label}>
              <Text
                style={[
                  styles.historyProgressSegmentText,
                  isActive && styles.historyProgressSegmentTextActive,
                ]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.mainTabsFullBleedScroll}
        contentContainerStyle={[
          styles.historyProgressScroll,
          { paddingBottom: 28 + mainTabBottomReserve },
        ]}
        showsVerticalScrollIndicator={false}>
        {historyProgressSection === 'overview' ? (
          <>
            <ProgressStrengthScoreOverview
              summary={strengthScoreSummary}
              onOpenStrengthHistory={onOpenStrengthScoreHistory}
            />

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
            <ProgressStrengthScoreBodyPanel
              summary={strengthScoreSummary}
              onOpenStrengthHistory={onOpenStrengthScoreHistory}
            />

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
            <StrengthScoreCard
              summary={strengthScoreSummary}
              colors={strengthColors}
              onOpenMovements={onOpenStrengthMovements}
            />

            <View style={[styles.historyStatCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.historyCardTitle, { color: theme.textPrimary }]}>
              {historyChartMode === 'year' ? 'Total lifted by month' : 'Total lifted by day'}
            </Text>
            <Text style={[styles.historyStatCaption, { color: theme.textSecondary, marginBottom: 10 }]}>
              Training volume from saved workouts — weight × reps for each set.
            </Text>
            <View style={[styles.historyModeSwitch, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
              <TouchableOpacity
                style={[
                  styles.historyModeSwitchOption,
                  historyChartMode === 'month' && { backgroundColor: theme.accentSolid },
                ]}
                onPress={() => setHistoryChartMode('month')}
                accessibilityRole="button"
                accessibilityLabel="Show daily view">
                <Text
                  style={[
                    styles.historyModeSwitchText,
                    { color: historyChartMode === 'month' ? '#FFFFFF' : theme.textPrimary },
                  ]}>
                  Days in Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.historyModeSwitchOption,
                  historyChartMode === 'year' && { backgroundColor: theme.accentSolid },
                ]}
                onPress={() => setHistoryChartMode('year')}
                accessibilityRole="button"
                accessibilityLabel="Show monthly view">
                <Text
                  style={[
                    styles.historyModeSwitchText,
                    { color: historyChartMode === 'year' ? '#FFFFFF' : theme.textPrimary },
                  ]}>
                  Months in Year
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.historyPeriodControlsRow}>
              {historyChartMode === 'month' ? (
                <View style={[styles.historySwitchCard, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.historySwitchLabel, { color: theme.textSecondary }]}>Month</Text>
                  <View style={styles.historySwitchControls}>
                    <TouchableOpacity
                      style={[styles.historySwitchButton, { borderColor: theme.inputBorder }]}
                      onPress={() => shiftHistoryMonth(-1)}
                      accessibilityRole="button"
                      accessibilityLabel="Previous month">
                      <Text style={[styles.historySwitchButtonText, { color: theme.textPrimary }]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.historySwitchValue, { color: theme.textPrimary }]}>
                      {historySelectedMonth + 1}
                    </Text>
                    <TouchableOpacity
                      style={[styles.historySwitchButton, { borderColor: theme.inputBorder }]}
                      onPress={() => shiftHistoryMonth(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Next month">
                      <Text style={[styles.historySwitchButtonText, { color: theme.textPrimary }]}>›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              <View style={[styles.historySwitchCard, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
                <Text style={[styles.historySwitchLabel, { color: theme.textSecondary }]}>Year</Text>
                <View style={styles.historySwitchControls}>
                  <TouchableOpacity
                    style={[styles.historySwitchButton, { borderColor: theme.inputBorder }]}
                    onPress={() => shiftHistoryYear(-1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous year">
                    <Text style={[styles.historySwitchButtonText, { color: theme.textPrimary }]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.historySwitchValue, { color: theme.textPrimary }]}>{historySelectedYear}</Text>
                  <TouchableOpacity
                    style={[styles.historySwitchButton, { borderColor: theme.inputBorder }]}
                    onPress={() => shiftHistoryYear(1)}
                    accessibilityRole="button"
                    accessibilityLabel="Next year">
                    <Text style={[styles.historySwitchButtonText, { color: theme.textPrimary }]}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={[styles.historyStatCaption, { color: theme.textSecondary, marginBottom: 6 }]}>
              {historyChartMode === 'year'
                ? `${historyYearLabel} · x-axis = month, y-axis = total pounds lifted in that month`
                : `${historyMonthLabel} · x-axis = day of month, y-axis = total pounds lifted`}
            </Text>
            <MonthlyVolumeChart
              values={historyChartValues}
              xLabels={historyChartMode === 'year' ? historyYearXAxisLabels : historyMonthXAxisLabels}
              maxVolume={historyChartMax}
              accentColor={theme.accentSolid}
              axisColor={theme.inputBorder}
              captionColor={theme.textSecondary}
              barMutedColor={theme.barMuted}
              captionText={
                historyChartMode === 'year'
                  ? 'Each bar is one month. Y-axis is pounds lifted in that month.'
                  : 'Each bar is one day. Y-axis is pounds lifted on that day.'
              }
            peakLabelPrefix={historyChartMode === 'year' ? 'Highest month' : 'Highest day'}
          />
        </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default memo(HistoryTabScreen);
