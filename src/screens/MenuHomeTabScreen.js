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
import {
  createBodyPanelGlowScrollStyle,
} from '../utils/homeBodyPanelGlowScroll';
import { useActiveWorkout } from '../app/context/ActiveWorkoutContext';
import { useAppStorage } from '../app/context/AppStorageContext';

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
  const { handleStartNewWorkout } = useActiveWorkout();
  const { savedWorkoutPlans, dayWorkoutAssignments, weekPlanDayOverrides } = useAppStorage();
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
      // Cancel ScrollView motion while scrolling up, but freeze at top overscroll.
      // This prevents the level layer from shifting into clipped background space.
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [-120, 0, 1, 2000],
            outputRange: [0, 0, 1, 2000],
            extrapolateLeft: 'clamp',
          }),
        },
      ],
    }),
    [scrollY],
  );

  const stickyGlowStyle = useMemo(
    () => createBodyPanelGlowScrollStyle(scrollY, { counterScroll: true }),
    [scrollY],
  );

  const showBackToToday = !isTodayLocalDay(selectedDate) || isLevelSelectScrolledFromToday;

  const sessionTitle = useMemo(() => {
    const entry = getSplitEntryForDate(weeklySplitPlan, selectedDate, weekPlanDayOverrides);
    return getSplitDaySessionTitle(entry, workoutHistory, weeklySplitPlan, selectedDate);
  }, [selectedDate, weekPlanDayOverrides, weeklySplitPlan, workoutHistory]);

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
              savedWorkoutPlans={savedWorkoutPlans}
              dayWorkoutAssignments={dayWorkoutAssignments}
              weekPlanDayOverrides={weekPlanDayOverrides}
              onStartWorkout={handleStartNewWorkout}
            />
          </Animated.View>

          <View style={styles.homeBodyPanelWrap}>
            <Animated.View style={stickyGlowStyle} pointerEvents="none">
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
                weekPlanDayOverrides={weekPlanDayOverrides}
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
