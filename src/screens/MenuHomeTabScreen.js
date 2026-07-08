import React, { memo, useCallback, useMemo, useState, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useStyles } from '../app/context/ThemeStylesContext';
import {
  getSplitDaySessionTitle,
  getSplitEntryForDate,
  isTodayLocalDay,
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
  const levelSelectRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedDate, setSelectedDate] = useState(() => startOfLocalDay(new Date()));
  const [isLevelSelectScrolledFromToday, setIsLevelSelectScrolledFromToday] = useState(false);

  const handleSelectDate = useCallback((date) => {
    setSelectedDate(startOfLocalDay(date));
  }, []);

  const handleBackToToday = useCallback(() => {
    const today = startOfLocalDay(new Date());
    setSelectedDate(today);
    levelSelectRef.current?.scrollToToday();
    setIsLevelSelectScrolledFromToday(false);
  }, []);

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  const stickyLevelStyle = useMemo(
    () => ({
      // Cancel ScrollView motion so levels/glow stay put while the sheet covers them.
      transform: [{ translateY: scrollY }],
    }),
    [scrollY],
  );

  const showBackToToday = !isTodayLocalDay(selectedDate) || isLevelSelectScrolledFromToday;

  const sessionTitle = useMemo(() => {
    const entry = getSplitEntryForDate(weeklySplitPlan, selectedDate);
    return getSplitDaySessionTitle(entry, workoutHistory, weeklySplitPlan, selectedDate);
  }, [selectedDate, weeklySplitPlan, workoutHistory]);

  return (
    <View style={styles.menuHomeShell}>
      <View style={styles.homeProfileHeaderBar}>
        <HomeProfileHeader
          onOpenProfile={onOpenProfile}
          sessionTitle={sessionTitle}
          showBackToToday={showBackToToday}
          onBackToToday={handleBackToToday}
        />
      </View>
      <View style={styles.homeScreenScrollWrap}>
        <Animated.ScrollView
          style={styles.homeScreenScroll}
          contentContainerStyle={[
            styles.homeScreenContent,
            styles.homeScreenContentGrow,
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}>
          {/* Levels + glow stay visually fixed; counter-scroll cancels the ScrollView motion. */}
          <Animated.View style={[styles.homeGamifiedSection, stickyLevelStyle]}>
            <HomeWorkoutLevelSelect
              ref={levelSelectRef}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onScrolledFromTodayChange={setIsLevelSelectScrolledFromToday}
              weeklySplitPlan={weeklySplitPlan}
              workoutHistory={workoutHistory}
              exerciseLookup={exerciseLookup}
            />
          </Animated.View>

          <View style={styles.homeBodyPanelWrap}>
            <Animated.View style={stickyLevelStyle} pointerEvents="none">
              <HomeBodyPanelGlow />
            </Animated.View>
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
        </Animated.ScrollView>
      </View>
    </View>
  );
}

export default memo(MenuHomeTabScreen);
