import React, { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useStyles } from '../app/context/ThemeStylesContext';
import {
  getSplitDaySessionTitle,
  getSplitEntryForDate,
  startOfLocalDay,
} from '../utils/homeDashboard';
import HomeProfileHeader from '../components/home/HomeProfileHeader';
import HomeWorkoutLevelSelect from '../components/home/HomeWorkoutLevelSelect';
import HomeStatsBar from '../components/home/HomeStatsBar';
import HomeStreakRankCarousel from '../components/home/HomeStreakRankCarousel';
import HomeMovementList from '../components/home/HomeMovementList';
import HomeBodyPanelGlow from '../components/home/HomeBodyPanelGlow';

function MenuHomeTabScreen({
  mainTabBottomReserve,
  consecutiveTrainingWeekStreak,
  consecutivePerfectWeekStreak,
  weeklySplitPlan,
  workoutHistory,
  exerciseLookup,
  strengthScoreSummary,
  lifetimeVolumeLb,
  onOpenProfile,
}) {
  const styles = useStyles();
  const [selectedDate, setSelectedDate] = useState(() => startOfLocalDay(new Date()));

  const handleSelectDate = useCallback((date) => {
    setSelectedDate(startOfLocalDay(date));
  }, []);

  const sessionTitle = useMemo(() => {
    const entry = getSplitEntryForDate(weeklySplitPlan, selectedDate);
    return getSplitDaySessionTitle(entry, workoutHistory, weeklySplitPlan, selectedDate);
  }, [selectedDate, weeklySplitPlan, workoutHistory]);

  return (
    <View style={styles.menuHomeShell}>
      <View style={styles.homeProfileHeaderBar}>
        <HomeProfileHeader onOpenProfile={onOpenProfile} sessionTitle={sessionTitle} />
      </View>
      <View style={styles.homeScreenScrollWrap}>
        <ScrollView
          style={styles.homeScreenScroll}
          contentContainerStyle={[
            styles.homeScreenContent,
            styles.homeScreenContentGrow,
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.homeGamifiedSection}>
            <HomeWorkoutLevelSelect
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              weeklySplitPlan={weeklySplitPlan}
              workoutHistory={workoutHistory}
              exerciseLookup={exerciseLookup}
            />
          </View>

          <View style={styles.homeBodyPanelWrap}>
            <HomeBodyPanelGlow />
            <View style={[styles.homeBodyPanel, { paddingBottom: mainTabBottomReserve + 24 }]}>
              <HomeStatsBar
                strengthScore={strengthScoreSummary?.overallScore}
                hasStrengthData={strengthScoreSummary?.hasData}
                workoutsCompleted={Array.isArray(workoutHistory) ? workoutHistory.length : 0}
                lifetimeVolumeLb={lifetimeVolumeLb ?? 0}
              />

              <HomeStreakRankCarousel
                consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
                consecutivePerfectWeekStreak={consecutivePerfectWeekStreak}
                workoutHistory={workoutHistory}
                weeklySplitPlan={weeklySplitPlan}
              />

              <HomeMovementList
                selectedDate={selectedDate}
                weeklySplitPlan={weeklySplitPlan}
                workoutHistory={workoutHistory}
                exerciseLookup={exerciseLookup}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export default memo(MenuHomeTabScreen);
