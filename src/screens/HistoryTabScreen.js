import React, { memo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import PastWorkoutsMonthCalendar from '../../components/PastWorkoutsMonthCalendar';
import MonthlyVolumeChart from '../../components/MonthlyVolumeChart';
import WeightProgressChart from '../../components/WeightProgressChart';
import StrengthScoreCard from '../components/StrengthScoreCard';
import { styles } from '../styles';

/** Purple-forward palette aligned with Home / More (`menuTopBar`, link rows). */
const HC = {
  textPrimary: '#EEF1FF',
  textSecondary: 'rgba(238, 241, 255, 0.72)',
  textMuted: 'rgba(238, 241, 255, 0.45)',
  cardBg: 'rgba(93, 85, 216, 0.72)',
  cardBorder: 'rgba(255, 255, 255, 0.25)',
  accentSolid: 'rgba(124, 116, 232, 0.98)',
  inputBg: 'rgba(0, 0, 0, 0.22)',
  inputBorder: 'rgba(255, 255, 255, 0.18)',
  barMuted: 'rgba(255, 255, 255, 0.14)',
  deleteText: '#FFB4B4',
};

const PROGRESS_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'weight', label: 'Weight' },
  { id: 'strength', label: 'Strength' },
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
  onOpenStrengthMovements,
  handleReturnFromSubscreen,
  onOpenDayWorkouts,
}) {
  const strengthColors = {
    textPrimary: HC.textPrimary,
    textSecondary: HC.textSecondary,
    accentSolid: HC.accentSolid,
    cardBg: HC.cardBg,
    cardBorder: HC.cardBorder,
  };
  return (
    <View style={styles.menuBody}>
      <View style={styles.menuGradientTopGlow} pointerEvents="none" />
      <View style={styles.menuGradientBottomGlow} pointerEvents="none" />

      <View style={styles.menuTopBar}>
        <TouchableOpacity
          onPress={handleReturnFromSubscreen}
          style={styles.historyProgressTopBarSide}
          accessibilityRole="button"
          accessibilityLabel="Close progress">
          <Text style={[styles.historyProgressCloseText, { color: HC.textPrimary }]}>✕</Text>
        </TouchableOpacity>
        <View style={styles.historyProgressTitleCenter}>
          <Text style={styles.menuTopBarDateText}>Progress</Text>
        </View>
        <View style={styles.historyProgressTopBarSide} />
      </View>

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
            <StrengthScoreCard
              summary={strengthScoreSummary}
              compact
              colors={strengthColors}
              onOpenMovements={onOpenStrengthMovements}
            />

            <Text style={styles.historyPastWorkoutsHeading}>Past workouts</Text>
            <Text style={[styles.menuMoreBodyText, { marginBottom: 12, alignSelf: 'stretch' }]}>
              Tap a highlighted day to see lifts from that session. Use the arrows to browse other months.
            </Text>

            <PastWorkoutsMonthCalendar
              year={historyCalendarYear}
              monthIndex={historyCalendarMonth}
              workoutHistory={workoutHistory}
              onShiftMonth={shiftHistoryCalendarMonth}
              onPressDayWithWorkout={(pick) => onOpenDayWorkouts(pick)}
              styles={styles}
              textPrimary={HC.textPrimary}
              textMuted={HC.textMuted}
              accentSolid={HC.accentSolid}
              today={new Date()}
            />
          </>
        ) : null}

        {historyProgressSection === 'weight' ? (
          <>
            <View style={[styles.historyStatCard, { backgroundColor: HC.cardBg, borderColor: HC.cardBorder }]}>
              <View style={styles.historyWeightHeaderRow}>
                <Text style={[styles.historyCardTitle, { color: HC.textPrimary, marginBottom: 0 }]}>Graph</Text>
                <TouchableOpacity
                  style={[styles.historyAddWeightButton, { borderColor: HC.inputBorder, backgroundColor: HC.inputBg }]}
                  onPress={openWeightLogModal}
                  accessibilityRole="button"
                  accessibilityLabel="Add weight log">
                  <Text style={[styles.historyAddWeightButtonText, { color: HC.textPrimary }]}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.historyStatCaption, { color: HC.textSecondary, marginBottom: 6 }]}>
                Every weigh-in you have saved (left = earlier, right = newer). Along the bottom, dates look like 5/11
                (month/day). If you have more than one year of logs, the year appears too (for example 5/11/25).
              </Text>
              <WeightProgressChart
                points={historyWeightChartPoints}
                lineColor={HC.accentSolid}
                axisColor={HC.inputBorder}
                textColor={HC.textSecondary}
                pointColor="#FFFFFF"
              />
            </View>

            <View style={[styles.historyStatCard, { backgroundColor: HC.cardBg, borderColor: HC.cardBorder }]}>
              <Text style={[styles.historyCardTitle, { color: HC.textPrimary }]}>Entries</Text>
              <View style={styles.historyWeightEntriesWrap}>
                {historyAllWeightLogsSorted.length === 0 ? (
                  <Text style={[styles.setText, { color: HC.textSecondary }]}>No weight entries yet.</Text>
                ) : (
                  historyAllWeightLogsSorted.map((entry) => {
                    const d = new Date(entry.dateISO);
                    const dLabel = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
                    return (
                      <View key={entry.id} style={styles.historyWeightEntryRow}>
                        <View style={styles.historyWeightEntryTextBlock}>
                          <Text style={[styles.historyWeightEntryValue, { color: HC.textPrimary }]}>
                            {Math.round(Number(entry.weightLb) * 10) / 10} lb
                          </Text>
                          <Text style={[styles.historyWeightEntryDate, { color: HC.textSecondary }]}>{dLabel}</Text>
                        </View>
                        <View style={styles.historyWeightEntryActions}>
                          <TouchableOpacity
                            onPress={() => openWeightLogModalForEdit(entry)}
                            style={[styles.historyWeightEntryActionBtn, { borderColor: HC.inputBorder }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit weight entry from ${dLabel}`}>
                            <Text style={[styles.historyWeightEntryEditText, { color: HC.textPrimary }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteWeightLogEntry(entry.id)}
                            style={[styles.historyWeightEntryActionBtn, { borderColor: HC.inputBorder }]}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete weight entry from ${dLabel}`}>
                            <Text style={[styles.historyWeightEntryDeleteText, { color: HC.deleteText }]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        ) : null}

        {historyProgressSection === 'strength' ? (
          <>
            <StrengthScoreCard
              summary={strengthScoreSummary}
              colors={strengthColors}
              onOpenMovements={onOpenStrengthMovements}
            />

            <View style={[styles.historyStatCard, { backgroundColor: HC.cardBg, borderColor: HC.cardBorder }]}>
            <Text style={[styles.historyCardTitle, { color: HC.textPrimary }]}>
              {historyChartMode === 'year' ? 'Total lifted by month' : 'Total lifted by day'}
            </Text>
            <Text style={[styles.historyStatCaption, { color: HC.textSecondary, marginBottom: 10 }]}>
              Training volume from saved workouts — weight × reps for each set.
            </Text>
            <View style={[styles.historyModeSwitch, { borderColor: HC.inputBorder, backgroundColor: HC.inputBg }]}>
              <TouchableOpacity
                style={[
                  styles.historyModeSwitchOption,
                  historyChartMode === 'month' && { backgroundColor: HC.accentSolid },
                ]}
                onPress={() => setHistoryChartMode('month')}
                accessibilityRole="button"
                accessibilityLabel="Show daily view">
                <Text
                  style={[
                    styles.historyModeSwitchText,
                    { color: historyChartMode === 'month' ? '#FFFFFF' : HC.textPrimary },
                  ]}>
                  Days in Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.historyModeSwitchOption,
                  historyChartMode === 'year' && { backgroundColor: HC.accentSolid },
                ]}
                onPress={() => setHistoryChartMode('year')}
                accessibilityRole="button"
                accessibilityLabel="Show monthly view">
                <Text
                  style={[
                    styles.historyModeSwitchText,
                    { color: historyChartMode === 'year' ? '#FFFFFF' : HC.textPrimary },
                  ]}>
                  Months in Year
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.historyPeriodControlsRow}>
              {historyChartMode === 'month' ? (
                <View style={[styles.historySwitchCard, { borderColor: HC.inputBorder, backgroundColor: HC.inputBg }]}>
                  <Text style={[styles.historySwitchLabel, { color: HC.textSecondary }]}>Month</Text>
                  <View style={styles.historySwitchControls}>
                    <TouchableOpacity
                      style={[styles.historySwitchButton, { borderColor: HC.inputBorder }]}
                      onPress={() => shiftHistoryMonth(-1)}
                      accessibilityRole="button"
                      accessibilityLabel="Previous month">
                      <Text style={[styles.historySwitchButtonText, { color: HC.textPrimary }]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={[styles.historySwitchValue, { color: HC.textPrimary }]}>
                      {historySelectedMonth + 1}
                    </Text>
                    <TouchableOpacity
                      style={[styles.historySwitchButton, { borderColor: HC.inputBorder }]}
                      onPress={() => shiftHistoryMonth(1)}
                      accessibilityRole="button"
                      accessibilityLabel="Next month">
                      <Text style={[styles.historySwitchButtonText, { color: HC.textPrimary }]}>›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              <View style={[styles.historySwitchCard, { borderColor: HC.inputBorder, backgroundColor: HC.inputBg }]}>
                <Text style={[styles.historySwitchLabel, { color: HC.textSecondary }]}>Year</Text>
                <View style={styles.historySwitchControls}>
                  <TouchableOpacity
                    style={[styles.historySwitchButton, { borderColor: HC.inputBorder }]}
                    onPress={() => shiftHistoryYear(-1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous year">
                    <Text style={[styles.historySwitchButtonText, { color: HC.textPrimary }]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.historySwitchValue, { color: HC.textPrimary }]}>{historySelectedYear}</Text>
                  <TouchableOpacity
                    style={[styles.historySwitchButton, { borderColor: HC.inputBorder }]}
                    onPress={() => shiftHistoryYear(1)}
                    accessibilityRole="button"
                    accessibilityLabel="Next year">
                    <Text style={[styles.historySwitchButtonText, { color: HC.textPrimary }]}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={[styles.historyStatCaption, { color: HC.textSecondary, marginBottom: 6 }]}>
              {historyChartMode === 'year'
                ? `${historyYearLabel} · x-axis = month, y-axis = total pounds lifted in that month`
                : `${historyMonthLabel} · x-axis = day of month, y-axis = total pounds lifted`}
            </Text>
            <MonthlyVolumeChart
              values={historyChartValues}
              xLabels={historyChartMode === 'year' ? historyYearXAxisLabels : historyMonthXAxisLabels}
              maxVolume={historyChartMax}
              accentColor={HC.accentSolid}
              axisColor={HC.inputBorder}
              captionColor={HC.textSecondary}
              barMutedColor={HC.barMuted}
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
