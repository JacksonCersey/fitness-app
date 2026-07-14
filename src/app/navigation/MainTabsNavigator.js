import React, { memo, useEffect, useMemo, useRef } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useGameTheme, useStyles, useWorkoutTheme } from '../context/ThemeStylesContext';
import { Animated, Easing, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MAIN_TAB_NAV_BAR_HEIGHT,
  isMoreHubSlideOverlay,
} from '../../constants/layout';
import MainTabsLayout from '../../navigation/MainTabsLayout';
import MainTabsRoot from '../../navigation/MainTabsRoot';
import MainBottomTabBar from '../../navigation/bottomTabBar/MainBottomTabBar';
import { useAppStorage } from '../context/AppStorageContext';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useHistoryProgress } from '../context/HistoryProgressContext';
import { usePlanSplitTransition } from '../context/PlanSplitTransitionContext';

const PLAN_SPLIT_NAV_FADE_MS = 220;

function MainTabsNavigator({ workoutStartRef }) {
  const styles = useStyles();
  const gameTheme = useGameTheme();
  const workoutTheme = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const mainTabBottomReserve = MAIN_TAB_NAV_BAR_HEIGHT + insets.bottom;

  const {
    consecutiveTrainingWeekStreak,
    consecutivePerfectWeekStreak,
    scheduledDayAdherence,
    weeklySplitPlan,
    workoutHistory,
    exerciseLookup,
    lifetimeVolumeLb,
    savedWorkoutPlans,
    dayWorkoutAssignments,
    handleAssignWorkoutToDay,
    handleSaveWorkoutForDay,
    handleSwapWorkoutBetweenDays,
    handleChangeWeeklySplitPlan,
  } = useAppStorage();

  const {
    currentScreen,
    mainTabsDisplayedScreen,
    screenTransitionOpacity,
    moreHubNavBarOpacity,
    subNavigatorReturnRef,
    handleReturnToMenu,
    handleOpenHistory,
    handleOpenSettings,
    handlePressMusclesTab,
    moreHubScrollViewRef,
    handleMoreHubScroll,
    restoreMoreHubScrollPosition,
    handleOpenProfileFromMore,
    handleOpenProfile,
    handleOpenMoreGoals,
    handleOpenMovementsFromMore,
    handleOpenSplitPlannerFromMore,
    handleOpenSplitPlannerFromPlan,
    handleOpenAppearance,
  } = useAppNavigation();

  const { phase: planSplitPhase } = usePlanSplitTransition();

  useEffect(() => {
    if (planSplitPhase === 'forward') {
      moreHubNavBarOpacity.stopAnimation();
      Animated.timing(moreHubNavBarOpacity, {
        toValue: 0,
        duration: PLAN_SPLIT_NAV_FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    if (planSplitPhase === 'reverse') {
      moreHubNavBarOpacity.stopAnimation();
      moreHubNavBarOpacity.setValue(0);
      Animated.timing(moreHubNavBarOpacity, {
        toValue: 1,
        duration: PLAN_SPLIT_NAV_FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [planSplitPhase, moreHubNavBarOpacity]);

  const {
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
    strengthScoreSummary,
    handleOpenHistoryDayDetail,
    handleOpenHistoryFromMore,
    handleOpenStreakFromMore,
    colors,
    isWeightLogModalVisible,
    closeWeightLogModal,
    editingWeightLogId,
    setIsWeightDatePickerVisible,
    weightLogDraftValue,
    setWeightLogDraftValue,
    weightLogDraftDate,
    getTodayDateInputValue,
    openWeightDatePicker,
    saveWeightLogEntry,
    isWeightDatePickerVisible,
    weightDatePickMonth,
    setWeightDatePickMonth,
    weightDatePickDay,
    setWeightDatePickDay,
    weightDatePickYear,
    setWeightDatePickYear,
    weightDatePickerMonthOptions,
    weightDatePickerDayOptions,
    weightDatePickerYearOptions,
    applyWeightDatePickerSelection,
  } = useHistoryProgress();

  const mainTabsMenuProps = useMemo(
    () => ({
      mainTabBottomReserve,
      consecutiveTrainingWeekStreak,
      consecutivePerfectWeekStreak,
      weeklySplitPlan,
      workoutHistory,
      exerciseLookup,
      strengthScoreSummary,
      lifetimeVolumeLb,
      onOpenProfile: handleOpenProfile,
    }),
    [
      mainTabBottomReserve,
      consecutiveTrainingWeekStreak,
      consecutivePerfectWeekStreak,
      weeklySplitPlan,
      workoutHistory,
      exerciseLookup,
      strengthScoreSummary,
      lifetimeVolumeLb,
      handleOpenProfile,
    ],
  );

  const mainTabsSettingsProps = useMemo(
    () => ({
      moreHubScrollViewRef,
      mainTabBottomReserve,
      handleMoreHubScroll,
      restoreMoreHubScrollPosition,
      handleOpenProfileFromMore,
      handleOpenMoreGoals,
      handleOpenMovementsFromMore,
      handleOpenSplitPlannerFromMore,
      handleOpenStreakFromMore,
      handleOpenHistoryFromMore,
      handleOpenAppearance,
    }),
    [
      mainTabBottomReserve,
      moreHubScrollViewRef,
      handleMoreHubScroll,
      restoreMoreHubScrollPosition,
      handleOpenProfileFromMore,
      handleOpenMoreGoals,
      handleOpenMovementsFromMore,
      handleOpenSplitPlannerFromMore,
      handleOpenStreakFromMore,
      handleOpenHistoryFromMore,
      handleOpenAppearance,
    ],
  );

  const mainTabsHistoryProps = useMemo(
    () => ({
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
      onOpenDayWorkouts: handleOpenHistoryDayDetail,
    }),
    [
      mainTabBottomReserve,
      historyProgressSection,
      setHistoryProgressSection,
      historyWeightChartPoints,
      historyAllWeightLogsSorted,
      historyCalendarMonth,
      historyCalendarYear,
      workoutHistory,
      strengthScoreSummary,
      consecutiveTrainingWeekStreak,
      scheduledDayAdherence,
      consecutivePerfectWeekStreak,
      lifetimeVolumeLb,
      weeklySplitPlan,
      shiftHistoryCalendarMonth,
      openWeightLogModal,
      openWeightLogModalForEdit,
      handleOpenHistoryDayDetail,
      handleDeleteWeightLogEntry,
    ],
  );

  const mainTabsMusclesProps = useMemo(
    () => ({
      mainTabBottomReserve,
      weeklySplitPlan,
      workoutHistory,
      exerciseLookup,
      savedWorkoutPlans,
      dayWorkoutAssignments,
      onOpenSplitPlanner: handleOpenSplitPlannerFromPlan,
      onAssignWorkoutToDay: handleAssignWorkoutToDay,
      onSaveWorkoutForDay: handleSaveWorkoutForDay,
      onChangeWeeklySplitPlan: handleChangeWeeklySplitPlan,
    }),
    [
      mainTabBottomReserve,
      weeklySplitPlan,
      workoutHistory,
      exerciseLookup,
      savedWorkoutPlans,
      dayWorkoutAssignments,
      handleOpenSplitPlannerFromPlan,
      handleAssignWorkoutToDay,
      handleSaveWorkoutForDay,
      handleChangeWeeklySplitPlan,
    ],
  );

  const mainTabsWeightLogProps = useMemo(
    () => ({
      colors,
      isWeightLogModalVisible,
      closeWeightLogModal,
      isEditingWeightLog: Boolean(editingWeightLogId),
      setIsWeightDatePickerVisible,
      weightLogDraftValue,
      setWeightLogDraftValue,
      weightLogDraftDate,
      getTodayDateInputValue,
      openWeightDatePicker,
      saveWeightLogEntry,
      isWeightDatePickerVisible,
      weightDatePickMonth,
      setWeightDatePickMonth,
      weightDatePickDay,
      setWeightDatePickDay,
      weightDatePickYear,
      setWeightDatePickYear,
      weightDatePickerMonthOptions,
      weightDatePickerDayOptions,
      weightDatePickerYearOptions,
      applyWeightDatePickerSelection,
    }),
    [
      colors,
      isWeightLogModalVisible,
      editingWeightLogId,
      weightLogDraftValue,
      setWeightLogDraftValue,
      weightLogDraftDate,
      getTodayDateInputValue,
      setIsWeightDatePickerVisible,
      isWeightDatePickerVisible,
      weightDatePickMonth,
      setWeightDatePickMonth,
      weightDatePickDay,
      setWeightDatePickDay,
      weightDatePickYear,
      setWeightDatePickYear,
      weightDatePickerMonthOptions,
      weightDatePickerDayOptions,
      weightDatePickerYearOptions,
      closeWeightLogModal,
      openWeightDatePicker,
      saveWeightLogEntry,
      applyWeightDatePickerSelection,
    ],
  );

  const tabScreen = mainTabsDisplayedScreen;
  const isSubscreenOverlay = isMoreHubSlideOverlay(currentScreen, subNavigatorReturnRef.current);

  const mainTabsSafeAreaStyle = useMemo(() => {
    return tabScreen === 'menu' || tabScreen === 'history'
      ? styles.menuScreenWithHeaderSafeArea
      : tabScreen === 'muscles'
        ? [styles.safeArea, { backgroundColor: workoutTheme.screenBg }]
        : [styles.safeArea, { backgroundColor: gameTheme.screenBg }];
  }, [tabScreen, styles, workoutTheme.screenBg, gameTheme.screenBg]);

  const mainTabsBottomFadeColor = tabScreen === 'muscles' ? workoutTheme.screenBg : gameTheme.screenBg;
  const mainTabsContentShellBackgroundColor =
    tabScreen === 'muscles' ? workoutTheme.screenBg : gameTheme.screenBg;
  const mainTabsBottomFadeHeight = Math.min(200, Math.round(mainTabBottomReserve + 48));
  const mainTabTransitionLockRef = useRef(false);

  const onPressStartWorkout = useMemo(
    () => () => {
      workoutStartRef.current?.();
    },
    [workoutStartRef],
  );

  return (
    <>
      <StatusBar barStyle={gameTheme.statusBarStyle} />
      {/* Provider wraps tabs + nav so Plan sheets portal in front of the floating tab bar. */}
      <BottomSheetModalProvider>
        <MainTabsLayout
          edges={['top', 'left', 'right']}
          safeAreaStyle={mainTabsSafeAreaStyle}
          contentShellBackgroundColor={mainTabsContentShellBackgroundColor}
          screenTransitionOpacity={isSubscreenOverlay ? 1 : screenTransitionOpacity}
          bottomEdgeFadeColor={mainTabsBottomFadeColor}
          bottomEdgeFadeHeight={mainTabsBottomFadeHeight}
          bottomBar={
            <Animated.View style={{ opacity: moreHubNavBarOpacity }}>
              <MainBottomTabBar
                currentScreen={tabScreen}
                bottomInset={insets.bottom}
                mainTabTransitionLockRef={mainTabTransitionLockRef}
                onPressHome={handleReturnToMenu}
                onPressHistory={handleOpenHistory}
                onPressSettings={handleOpenSettings}
                onPressMuscles={handlePressMusclesTab}
                onPressStartWorkout={onPressStartWorkout}
              />
            </Animated.View>
          }
        >
          <MainTabsRoot
            activeScreen={tabScreen}
            mainTabTransitionLockRef={mainTabTransitionLockRef}
            menu={mainTabsMenuProps}
            settings={mainTabsSettingsProps}
            history={mainTabsHistoryProps}
            muscles={mainTabsMusclesProps}
            weightLog={mainTabsWeightLogProps}
          />
        </MainTabsLayout>
      </BottomSheetModalProvider>
    </>
  );
}

export default memo(MainTabsNavigator);
