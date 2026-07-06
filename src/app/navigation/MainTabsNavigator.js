import React, { memo, useMemo, useRef } from 'react';
import { useGameTheme, useStyles, useWorkoutTheme } from '../context/ThemeStylesContext';
import { Animated, StatusBar } from 'react-native';
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

function MainTabsNavigator({ workoutStartRef }) {
  const styles = useStyles();
  const gameTheme = useGameTheme();
  const workoutTheme = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const mainTabBottomReserve = MAIN_TAB_NAV_BAR_HEIGHT + insets.bottom;

  const {
    consecutiveTrainingWeekStreak,
    consecutivePerfectWeekStreak,
    weeklySplitPlan,
    weeklySubcategorySetCounts,
    workoutHistory,
    exerciseLookup,
    lifetimeVolumeLb,
    weeklyPplCounts,
    lastWorkoutPplBreakdown,
    weekStartMondayForTargets,
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
    handleOpenStreakSubscreen,
    handleOpenAppearance,
  } = useAppNavigation();

  const {
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
    strengthScoreSummary,
    handleOpenStrengthMovements,
    handleOpenHistoryDayDetail,
    handleOpenHistoryFromMore,
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
      handleOpenStreakSubscreen,
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
      handleOpenStreakSubscreen,
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
      onOpenStrengthMovements: handleOpenStrengthMovements,
      onOpenDayWorkouts: handleOpenHistoryDayDetail,
    }),
    [
      mainTabBottomReserve,
      historyProgressSection,
      setHistoryProgressSection,
      setHistoryChartMode,
      historyWeightChartPoints,
      historyAllWeightLogsSorted,
      historyChartMode,
      historyCalendarMonth,
      historyCalendarYear,
      historySelectedMonth,
      historySelectedYear,
      historyYearLabel,
      historyMonthLabel,
      historyChartValues,
      historyMonthXAxisLabels,
      historyYearXAxisLabels,
      historyChartMax,
      workoutHistory,
      strengthScoreSummary,
      shiftHistoryCalendarMonth,
      shiftHistoryMonth,
      shiftHistoryYear,
      openWeightLogModal,
      openWeightLogModalForEdit,
      handleOpenStrengthMovements,
      handleOpenHistoryDayDetail,
      handleDeleteWeightLogEntry,
    ],
  );

  const mainTabsMusclesProps = useMemo(
    () => ({
      mainTabBottomReserve,
      weeklyPplCounts,
      weeklySubcategorySetCounts,
      lastWorkoutPplBreakdown,
      weekStartMonday: weekStartMondayForTargets,
      weeklySplitPlan,
    }),
    [
      mainTabBottomReserve,
      weeklyPplCounts,
      weeklySubcategorySetCounts,
      lastWorkoutPplBreakdown,
      weekStartMondayForTargets,
      weeklySplitPlan,
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
  const isMoreHubOverlay = isMoreHubSlideOverlay(currentScreen, subNavigatorReturnRef.current);

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
      <MainTabsLayout
        edges={['top', 'left', 'right']}
        safeAreaStyle={mainTabsSafeAreaStyle}
        contentShellBackgroundColor={mainTabsContentShellBackgroundColor}
        screenTransitionOpacity={isMoreHubOverlay ? 1 : screenTransitionOpacity}
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
    </>
  );
}

export default memo(MainTabsNavigator);
