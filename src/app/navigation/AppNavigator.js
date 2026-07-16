import React, { useEffect, useMemo } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useWorkoutTheme } from '../context/ThemeStylesContext';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAIN_TAB_SCREEN_KEYS, isMoreHubSlideOverlay, shouldUseSubscreenSlideTransition } from '../../constants/layout';
import MoreGoalsScreen from '../../screens/MoreGoalsScreen';
import AppearanceScreen from '../../screens/AppearanceScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import SummaryScreen from '../../screens/SummaryScreen';
import HistoryDayWorkoutsScreen from '../../screens/HistoryDayWorkoutsScreen';
import StrengthMovementsScreen from '../../screens/StrengthMovementsScreen';
import WeeklySplitPlannerScreen from '../../screens/WeeklySplitPlannerScreen';
import PlanSplitTimelineScreen from '../../screens/PlanSplitTimelineScreen';
import WorkoutScreen from '../../screens/WorkoutScreen';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useAppStorage } from '../context/AppStorageContext';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useHistoryProgress } from '../context/HistoryProgressContext';
import { buildHistoricalWorkoutSummaryContext } from '../../utils/historicalWorkoutSummary';
import MainTabsNavigator from './MainTabsNavigator';
import PlanSplitDotMorphOverlay from '../../components/plan/PlanSplitDotMorphOverlay';
import { usePlanSplitTransition } from '../context/PlanSplitTransitionContext';

function WorkoutScreenRoute() {
  const workoutTheme = useWorkoutTheme();
  const { screenTransitionOpacity } = useAppNavigation();
  const {
    elapsedSeconds,
    activeIsBodyweightOnly,
    notepadRepsRef,
    notepadWeightInputRef,
    notepadRepsInput,
    notepadRepsIsSuggested,
    notepadWeightInput,
    handleNotepadRepsChange,
    handleNotepadWeightChange,
    handleRepsSubmitEditing,
    commitNotepadSet,
    focusNotepadRepsField,
    handleCancelWorkout,
    workoutMovementOrder,
    setsByMovement,
    exerciseLookup,
    addMovementSheetVisible,
    setAddMovementSheetVisible,
    handlePickExerciseForWorkout,
    logSetSheetExercise,
    handleOpenLogSetSheet,
    handleCloseLogSetSheet,
    handleRequestRemoveMovementFromWorkout,
    workoutTimerPaused,
    handleToggleWorkoutPause,
    hasAnyLoggedSets,
    handleRequestCompleteWorkout,
    renderWorkoutStoredSetsForMovement,
    workoutCelebration,
    dismissWorkoutCelebration,
    editingSetKey,
  } = useActiveWorkout();
  const { workoutHistory } = useAppStorage();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <BottomSheetModalProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: workoutTheme.screenBg }} edges={['left', 'right', 'bottom']}>
          <WorkoutScreen
          screenTransitionOpacity={screenTransitionOpacity}
          elapsedSeconds={elapsedSeconds}
          activeIsBodyweightOnly={activeIsBodyweightOnly}
          notepadRepsRef={notepadRepsRef}
          notepadWeightInputRef={notepadWeightInputRef}
          notepadRepsInput={notepadRepsInput}
          notepadRepsIsSuggested={notepadRepsIsSuggested}
          notepadWeightInput={notepadWeightInput}
          handleNotepadRepsChange={handleNotepadRepsChange}
          handleNotepadWeightChange={handleNotepadWeightChange}
          handleRepsSubmitEditing={handleRepsSubmitEditing}
          commitNotepadSet={commitNotepadSet}
          focusNotepadRepsField={focusNotepadRepsField}
          handleCancelWorkout={handleCancelWorkout}
          workoutMovementOrder={workoutMovementOrder}
          setsByMovement={setsByMovement}
          exerciseLookup={exerciseLookup}
          addMovementSheetVisible={addMovementSheetVisible}
          onOpenAddMovementSheet={() => setAddMovementSheetVisible(true)}
          onCloseAddMovementSheet={() => setAddMovementSheetVisible(false)}
          onPickExerciseForWorkout={handlePickExerciseForWorkout}
          logSetSheetExercise={logSetSheetExercise}
          onOpenLogSetSheet={handleOpenLogSetSheet}
          onCloseLogSetSheet={handleCloseLogSetSheet}
          onRequestRemoveMovementFromWorkout={handleRequestRemoveMovementFromWorkout}
          workoutTimerPaused={workoutTimerPaused}
          onToggleWorkoutPause={handleToggleWorkoutPause}
          hasAnyLoggedSets={hasAnyLoggedSets}
          onRequestCompleteWorkout={handleRequestCompleteWorkout}
          renderWorkoutStoredSetsForMovement={renderWorkoutStoredSetsForMovement}
          workoutCelebration={workoutCelebration}
          onDismissWorkoutCelebration={dismissWorkoutCelebration}
          editingSetKey={editingSetKey}
          workoutHistory={workoutHistory}
        />
        </SafeAreaView>
      </BottomSheetModalProvider>
    </>
  );
}

function HistoricalWorkoutSummaryRoute() {
  const { screenTransitionOpacity } = useAppNavigation();
  const {
    workoutHistory,
    exerciseLookup,
    weightLogs,
    weeklySplitPlan,
    handleDeleteWorkout,
  } = useAppStorage();
  const { viewingHistoricalWorkoutId, handleCloseHistoricalWorkoutSummary } = useHistoryProgress();

  const workout = useMemo(
    () => workoutHistory.find((item) => item.id === viewingHistoricalWorkoutId) ?? null,
    [workoutHistory, viewingHistoricalWorkoutId],
  );

  const historicalContext = useMemo(
    () =>
      buildHistoricalWorkoutSummaryContext(
        workout,
        workoutHistory,
        weightLogs,
        exerciseLookup,
        weeklySplitPlan,
      ),
    [workout, workoutHistory, weightLogs, exerciseLookup, weeklySplitPlan],
  );

  useEffect(() => {
    if (!viewingHistoricalWorkoutId) return;
    if (!workout) {
      handleCloseHistoricalWorkoutSummary();
    }
  }, [viewingHistoricalWorkoutId, workout, handleCloseHistoricalWorkoutSummary]);

  if (!workout || !historicalContext) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SummaryScreen
        screenTransitionOpacity={screenTransitionOpacity}
        elapsedSeconds={historicalContext.elapsedSeconds}
        movementNamesNewestFirst={historicalContext.movementNamesNewestFirst}
        setsByMovement={historicalContext.setsByMovement}
        exerciseLookup={exerciseLookup}
        onReturnToMenu={handleCloseHistoricalWorkoutSummary}
        strengthScoreSummary={historicalContext.strengthScoreSummary}
        consecutiveTrainingWeekStreak={historicalContext.consecutiveTrainingWeekStreak}
        menuWeekGymProgress={historicalContext.menuWeekGymProgress}
        workoutHistory={historicalContext.workoutHistory}
        weightLogs={weightLogs}
        readOnly
        skipAnimations
        returnButtonLabel="Back"
        onDeleteWorkout={() => handleDeleteWorkout(workout.id)}
      />
    </>
  );
}

function SummaryScreenRoute() {
  const { screenTransitionOpacity, handleReturnToMenu } = useAppNavigation();
  const {
    colors,
    exerciseLookup,
    strengthScoreSummary,
    consecutiveTrainingWeekStreak,
    weeklyWorkoutsLoggedCount,
    menuWeekGymProgress,
    workoutHistory,
    weightLogs,
  } = useAppStorage();
  const {
    elapsedSeconds,
    displaySetsByMovement,
    movementNamesNewestFirst,
    totalReps,
    editingSetKey,
    editingReps,
    setEditingReps,
    editingWeight,
    setEditingWeight,
    startEditingStoredSet,
    deleteStoredSet,
    saveEditingStoredSet,
    cancelEditingStoredSet,
    handleStartNewWorkout,
  } = useActiveWorkout();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SummaryScreen
        colors={colors}
        screenTransitionOpacity={screenTransitionOpacity}
        elapsedSeconds={elapsedSeconds}
        totalReps={totalReps}
        movementNamesNewestFirst={movementNamesNewestFirst}
        setsByMovement={displaySetsByMovement}
        exerciseLookup={exerciseLookup}
        editingSetKey={editingSetKey}
        editingReps={editingReps}
        setEditingReps={setEditingReps}
        editingWeight={editingWeight}
        setEditingWeight={setEditingWeight}
        startEditingStoredSet={startEditingStoredSet}
        deleteStoredSet={deleteStoredSet}
        saveEditingStoredSet={saveEditingStoredSet}
        cancelEditingStoredSet={cancelEditingStoredSet}
        onStartNewWorkout={handleStartNewWorkout}
        onReturnToMenu={handleReturnToMenu}
        strengthScoreSummary={strengthScoreSummary}
        consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
        weeklyWorkoutsLoggedCount={weeklyWorkoutsLoggedCount}
        menuWeekGymProgress={menuWeekGymProgress}
        workoutHistory={workoutHistory}
        weightLogs={weightLogs}
      />
    </>
  );
}

function SubscreenLayer() {
  const {
    currentScreen,
    screenTransitionOpacity,
    moreSubscreenSlideX,
    subNavigatorReturnRef,
    handleCloseSplitPlanner,
    handleClosePlanSplitTimeline,
    handleCloseStrengthMovements,
    requestPlanInlineBuilder,
  } = useAppNavigation();
  const {
    weeklySplitPlan,
    handleChangeWeeklySplitPlan,
    workoutHistory,
    exerciseLookup,
    favoriteMovements,
    handleToggleFavoriteMovement,
    savedWorkoutPlans,
    dayWorkoutAssignments,
    handleAssignWorkoutToDay,
    handleSwapWorkoutBetweenDays,
    handleSwapSplitDays,
    handleDeleteWorkout,
    weeklyWorkoutsLoggedCount,
    consecutiveTrainingWeekStreak,
    profileName,
    profileNameDraft,
    setProfileNameDraft,
    weightLogs,
    profileHeightPickFeet,
    setProfileHeightPickFeet,
    profileHeightPickInches,
    setProfileHeightPickInches,
    profileHeightEditorOpen,
    setProfileHeightEditorOpen,
    profileGoalDraft,
    setProfileGoalDraft,
    handleSaveProfile,
    handleSaveGoalsOnly,
  } = useAppStorage();

  const {
    historyDayScreenTitle,
    workoutsForHistoryDay,
    handleCloseHistoryDayDetail,
    handleOpenHistoricalWorkoutSummary,
    handleReturnFromSubscreen,
  } = useHistoryProgress();

  const useSubscreenSlide = shouldUseSubscreenSlideTransition(
    currentScreen,
    subNavigatorReturnRef.current,
  );

  const wrapSubscreenSlide = (content) => {
    if (!useSubscreenSlide) return content;
    return (
      <Animated.View
        style={[styles.subscreenFill, { transform: [{ translateX: moreSubscreenSlideX }] }]}>
        {content}
      </Animated.View>
    );
  };

  if (currentScreen === 'splitPlanner') {
    return wrapSubscreenSlide(
      <>
        <StatusBar barStyle="light-content" />
        <WeeklySplitPlannerScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseSplitPlanner}
          weeklySplitPlan={weeklySplitPlan}
          onChangeWeeklySplitPlan={handleChangeWeeklySplitPlan}
        />
      </>,
    );
  }

  if (currentScreen === 'planSplitTimeline') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <PlanSplitTimelineScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleClosePlanSplitTimeline}
          weeklySplitPlan={weeklySplitPlan}
          dayWorkoutAssignments={dayWorkoutAssignments}
          savedWorkoutPlans={savedWorkoutPlans}
          workoutHistory={workoutHistory}
          exerciseLookup={exerciseLookup}
          onSwapSplitDays={handleSwapSplitDays}
          onChangeWeeklySplitPlan={handleChangeWeeklySplitPlan}
        />
      </>
    );
  }

  if (currentScreen === 'strengthMovements') {
    return wrapSubscreenSlide(
      <>
        <StatusBar barStyle="light-content" />
        <StrengthMovementsScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseStrengthMovements}
          workoutHistory={workoutHistory}
          exerciseLookup={exerciseLookup}
          favoriteMovements={favoriteMovements}
          onToggleFavoriteMovement={handleToggleFavoriteMovement}
          selectionMode={null}
          onSelectMovement={null}
        />
      </>,
    );
  }

  if (currentScreen === 'historicalWorkoutSummary') {
    return <HistoricalWorkoutSummaryRoute />;
  }

  if (currentScreen === 'historyDay') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <HistoryDayWorkoutsScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseHistoryDayDetail}
          dayTitleLabel={historyDayScreenTitle}
          workoutsForDay={workoutsForHistoryDay}
          onSelectWorkout={(workoutId) => handleOpenHistoricalWorkoutSummary(workoutId, 'historyDay')}
          exerciseLookup={exerciseLookup}
          handleDeleteWorkout={handleDeleteWorkout}
          textPrimary="#EEF1FF"
          setText="#D8DDE6"
          deleteText="#FF7C7C"
          cardBg="#1E232B"
        />
      </>
    );
  }

  if (currentScreen === 'moreGoals') {
    return wrapSubscreenSlide(
      <MoreGoalsScreen
        screenTransitionOpacity={screenTransitionOpacity}
        onBack={handleReturnFromSubscreen}
        profileGoalDraft={profileGoalDraft}
        setProfileGoalDraft={setProfileGoalDraft}
        onSaveGoal={handleSaveGoalsOnly}
      />,
    );
  }

  if (currentScreen === 'appearance') {
    return wrapSubscreenSlide(
      <AppearanceScreen screenTransitionOpacity={screenTransitionOpacity} onBack={handleReturnFromSubscreen} />,
    );
  }

  if (currentScreen === 'profile') {
    return wrapSubscreenSlide(
      <ProfileScreen
        screenTransitionOpacity={screenTransitionOpacity}
        onBack={handleReturnFromSubscreen}
        profileName={profileName}
        profileNameDraft={profileNameDraft}
        setProfileNameDraft={setProfileNameDraft}
        profileHeightPickFeet={profileHeightPickFeet}
        setProfileHeightPickFeet={setProfileHeightPickFeet}
        profileHeightPickInches={profileHeightPickInches}
        setProfileHeightPickInches={setProfileHeightPickInches}
        profileHeightEditorOpen={profileHeightEditorOpen}
        setProfileHeightEditorOpen={setProfileHeightEditorOpen}
        profileGoalDraft={profileGoalDraft}
        setProfileGoalDraft={setProfileGoalDraft}
        onSaveProfile={handleSaveProfile}
        workoutHistory={workoutHistory}
        weightLogs={weightLogs}
        consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
      />,
    );
  }

  if (currentScreen === 'summary') {
    return <SummaryScreenRoute />;
  }

  if (currentScreen === 'workout') {
    return <WorkoutScreenRoute />;
  }

  return <View style={styles.subscreenFallback} />;
}

/**
 * Main tabs stay mounted under subscreens so the bottom nav (BlurView + icons) does not
 * cold-remount and flash when returning from Profile, workout, etc.
 */
export default function AppNavigator({ workoutStartRef }) {
  const { currentScreen, subNavigatorReturnRef } = useAppNavigation();
  const { keepPlanTabVisible, phase } = usePlanSplitTransition();
  const isMainTab = MAIN_TAB_SCREEN_KEYS.has(currentScreen);
  const isSubscreenOverlay = isMoreHubSlideOverlay(currentScreen, subNavigatorReturnRef.current);
  const isPlanSplitTimeline = currentScreen === 'planSplitTimeline';
  const keepMainTabsVisible =
    isMainTab || isSubscreenOverlay || (isPlanSplitTimeline && keepPlanTabVisible);
  const mainTabsInteractive = keepMainTabsVisible && !isSubscreenOverlay && !isPlanSplitTimeline;
  // During reverse, Plan must paint under the overlay even while timeline is still mounted.
  const forceShowMainTabs = keepPlanTabVisible && (phase === 'forward' || phase === 'reverse');

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.mainTabsLayer,
          !keepMainTabsVisible && !forceShowMainTabs && styles.mainTabsLayerHidden,
          forceShowMainTabs && styles.mainTabsLayerForceVisible,
        ]}
        pointerEvents={mainTabsInteractive ? 'auto' : 'none'}
        accessibilityElementsHidden={!mainTabsInteractive}
        importantForAccessibility={mainTabsInteractive ? 'auto' : 'no-hide-descendants'}>
        <MainTabsNavigator workoutStartRef={workoutStartRef} />
      </View>
      {!isMainTab ? (
        <View
          style={[
            styles.subscreenLayer,
            isPlanSplitTimeline && keepPlanTabVisible && styles.subscreenLayerOverPlan,
          ]}
          pointerEvents="box-none">
          <SubscreenLayer />
        </View>
      ) : null}
      <PlanSplitDotMorphOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  mainTabsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  mainTabsLayerHidden: {
    opacity: 0,
  },
  mainTabsLayerForceVisible: {
    opacity: 1,
  },
  subscreenLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  subscreenLayerOverPlan: {
    backgroundColor: 'transparent',
  },
  subscreenFallback: {
    flex: 1,
  },
  subscreenFill: {
    flex: 1,
  },
});
