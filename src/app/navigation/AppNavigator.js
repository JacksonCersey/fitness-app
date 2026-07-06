import React from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useWorkoutTheme } from '../context/ThemeStylesContext';
import { Animated, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAIN_TAB_SCREEN_KEYS, isMoreHubSlideOverlay, shouldUseMoreHubSlideTransition } from '../../constants/layout';
import StreakScreen from '../../screens/StreakScreen';
import MoreGoalsScreen from '../../screens/MoreGoalsScreen';
import AppearanceScreen from '../../screens/AppearanceScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import SummaryScreen from '../../screens/SummaryScreen';
import HistoryDayWorkoutsScreen from '../../screens/HistoryDayWorkoutsScreen';
import StrengthMovementsScreen from '../../screens/StrengthMovementsScreen';
import WeeklySplitPlannerScreen from '../../screens/WeeklySplitPlannerScreen';
import WorkoutScreen from '../../screens/WorkoutScreen';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useAppStorage } from '../context/AppStorageContext';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useHistoryProgress } from '../context/HistoryProgressContext';
import MainTabsNavigator from './MainTabsNavigator';

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
    weeklyPplCounts,
    weeklySubcategorySetCounts,
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
          weeklyPplCounts={weeklyPplCounts}
          weeklySubcategorySetCounts={weeklySubcategorySetCounts}
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
  const { currentScreen, screenTransitionOpacity, moreSubscreenSlideX, subNavigatorReturnRef } =
    useAppNavigation();
  const {
    weeklySplitPlan,
    handleChangeWeeklySplitPlan,
    workoutHistory,
    exerciseLookup,
    favoriteMovements,
    handleToggleFavoriteMovement,
    handleDeleteWorkout,
    weeklyWorkoutsLoggedCount,
    weeklyStreakDays,
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

  const { handleCloseSplitPlanner, handleCloseStrengthMovements } = useAppNavigation();

  const {
    historyDayScreenTitle,
    workoutsForHistoryDay,
    handleCloseHistoryDayDetail,
    handleReturnFromSubscreen,
  } = useHistoryProgress();

  const useMoreHubSlide =
    subNavigatorReturnRef.current === 'settings' &&
    shouldUseMoreHubSlideTransition(currentScreen, 'settings');

  const wrapMoreHubSlide = (content) => {
    if (!useMoreHubSlide) return content;
    return (
      <Animated.View
        style={[styles.subscreenFill, { transform: [{ translateX: moreSubscreenSlideX }] }]}>
        {content}
      </Animated.View>
    );
  };

  if (currentScreen === 'splitPlanner') {
    return wrapMoreHubSlide(
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

  if (currentScreen === 'strengthMovements') {
    return wrapMoreHubSlide(
      <>
        <StatusBar barStyle="light-content" />
        <StrengthMovementsScreen
          screenTransitionOpacity={screenTransitionOpacity}
          onBack={handleCloseStrengthMovements}
          workoutHistory={workoutHistory}
          exerciseLookup={exerciseLookup}
          favoriteMovements={favoriteMovements}
          onToggleFavoriteMovement={handleToggleFavoriteMovement}
        />
      </>,
    );
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

  if (currentScreen === 'streak') {
    return wrapMoreHubSlide(
      <StreakScreen
        screenTransitionOpacity={screenTransitionOpacity}
        onBack={handleReturnFromSubscreen}
        weeklyWorkoutsLoggedCount={weeklyWorkoutsLoggedCount}
        weeklyStreakDays={weeklyStreakDays}
        weeklySplitPlan={weeklySplitPlan}
        consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
      />,
    );
  }

  if (currentScreen === 'moreGoals') {
    return wrapMoreHubSlide(
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
    return wrapMoreHubSlide(
      <AppearanceScreen screenTransitionOpacity={screenTransitionOpacity} onBack={handleReturnFromSubscreen} />,
    );
  }

  if (currentScreen === 'profile') {
    return wrapMoreHubSlide(
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
  const isMainTab = MAIN_TAB_SCREEN_KEYS.has(currentScreen);
  const isMoreHubOverlay = isMoreHubSlideOverlay(currentScreen, subNavigatorReturnRef.current);
  const keepMainTabsVisible = isMainTab || isMoreHubOverlay;
  const mainTabsInteractive = keepMainTabsVisible && !isMoreHubOverlay;

  return (
    <View style={styles.root}>
      <View
        style={[styles.mainTabsLayer, !keepMainTabsVisible && styles.mainTabsLayerHidden]}
        pointerEvents={mainTabsInteractive ? 'auto' : 'none'}
        accessibilityElementsHidden={!keepMainTabsVisible}
        importantForAccessibility={keepMainTabsVisible ? 'auto' : 'no-hide-descendants'}>
        <MainTabsNavigator workoutStartRef={workoutStartRef} />
      </View>
      {!isMainTab ? (
        <View style={styles.subscreenLayer} pointerEvents="box-none">
          <SubscreenLayer />
        </View>
      ) : null}
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
  subscreenLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  subscreenFallback: {
    flex: 1,
  },
  subscreenFill: {
    flex: 1,
  },
});
