import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStyles } from '../app/context/ThemeStylesContext';
import { usePlanSplitTransition } from '../app/context/PlanSplitTransitionContext';
import { useAppNavigation } from '../app/context/AppNavigationContext';
import PlanDayPager from '../components/plan/PlanDayPager';
import PlanSavedWorkoutsSheet from '../components/plan/PlanSavedWorkoutsSheet';
import PlanWeekdayBar from '../components/plan/PlanWeekdayBar';
import { getMondayBasedDayIndex } from '../data/weeklySplitPlanner';

const HERO_FADE_MS = 220;

function presentBottomSheet(ref) {
  requestAnimationFrame(() => {
    if (ref.current) {
      ref.current.present();
      return;
    }
    setTimeout(() => ref.current?.present(), 50);
  });
}

function MuscleMapTabScreen({
  mainTabBottomReserve,
  weeklySplitPlan,
  exerciseLookup,
  savedWorkoutPlans,
  dayWorkoutAssignments,
  onOpenSplitPlanner,
  onAssignWorkoutToDay,
  onSaveWorkoutForDay,
  onChangeWeeklySplitPlan,
}) {
  const styles = useStyles();
  const { setCurrentScreen, planInlineBuilderIntentRef, currentScreen } = useAppNavigation();
  const {
    planHeroActive,
    planDotsHidden,
    phase,
    startForward,
    registerPlanSources,
    isBusy,
  } = usePlanSplitTransition();
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(() => getMondayBasedDayIndex(new Date()));
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);
  const [builderIntent, setBuilderIntent] = useState(null);
  const weekdayBarRef = useRef(null);
  const savedSheetRef = useRef(null);
  const nonHeroOpacity = useRef(new Animated.Value(1)).current;

  useLayoutEffect(() => {
    if (planHeroActive) {
      if (phase === 'reverse') {
        nonHeroOpacity.setValue(0);
        return;
      }
      Animated.timing(nonHeroOpacity, {
        toValue: 0,
        duration: HERO_FADE_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(nonHeroOpacity, {
      toValue: 1,
      duration: HERO_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [planHeroActive, phase, nonHeroOpacity]);

  useEffect(() => {
    if (phase !== 'reverse') return undefined;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        const frames = await weekdayBarRef.current?.measureDotFrames?.();
        if (!cancelled && frames) {
          registerPlanSources(frames);
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [phase, registerPlanSources]);

  // Pick up Create New from the timeline (or other callers) once Plan is idle.
  useEffect(() => {
    if (planHeroActive || isBusy || currentScreen !== 'muscles') return;
    const intent = planInlineBuilderIntentRef?.current;
    if (!intent) return;
    planInlineBuilderIntentRef.current = null;
    setSelectedPlanIndex(intent.planIndex);
    setBuilderIntent(intent);
  }, [currentScreen, isBusy, planHeroActive, planInlineBuilderIntentRef]);

  const handleEditSplit = useCallback(async () => {
    if (isBusy) return;
    const frames = await weekdayBarRef.current?.measureDotFrames?.();
    const dayStyles = weekdayBarRef.current?.getDayStyles?.() ?? [];
    if (!frames) {
      onOpenSplitPlanner?.();
      return;
    }
    startForward({
      frames,
      styles: dayStyles,
      navigateToTimeline: () => {
        setCurrentScreen('planSplitTimeline');
      },
    });
  }, [isBusy, onOpenSplitPlanner, setCurrentScreen, startForward]);

  const handleOpenSavedSheet = useCallback(() => {
    if (isBusy) return;
    setSavedSheetOpen(true);
    presentBottomSheet(savedSheetRef);
  }, [isBusy]);

  const handleAssignSavedWorkout = useCallback(
    (planId) => {
      onAssignWorkoutToDay?.(selectedPlanIndex, planId);
    },
    [onAssignWorkoutToDay, selectedPlanIndex],
  );

  const syncSavedSheetClosed = useCallback(() => {
    setSavedSheetOpen(false);
  }, []);

  const handleBuilderIntentConsumed = useCallback(() => {
    setBuilderIntent(null);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.menuHomeShell, styles.historyProgressBody]}>
        <ScrollView
          style={styles.planScreenScroll}
          contentContainerStyle={[
            styles.planScreenScrollContent,
            { paddingBottom: mainTabBottomReserve + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled">
          <View style={styles.planScreenTitleSection}>
            <View style={styles.planScreenTitleRow}>
              <Text style={styles.planScreenTitle}>Week Split</Text>
              <Image
                source={require('../../assets/images/icons/calendaricon.png')}
                style={styles.planScreenTitleIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
          </View>

          <PlanWeekdayBar
            ref={weekdayBarRef}
            weeklySplitPlan={weeklySplitPlan}
            selectedPlanIndex={selectedPlanIndex}
            onSelectDay={setSelectedPlanIndex}
            onPressEditSplit={handleEditSplit}
            heroMode={planHeroActive}
            heroSnapHide={phase === 'reverse'}
            dotsHidden={planDotsHidden}
            editOpacity={nonHeroOpacity}
          />

          <Animated.View
            style={[styles.planContentWrap, { opacity: nonHeroOpacity }]}
            pointerEvents={planHeroActive ? 'none' : 'auto'}>
            <PlanDayPager
              selectedPlanIndex={selectedPlanIndex}
              weeklySplitPlan={weeklySplitPlan}
              dayWorkoutAssignments={dayWorkoutAssignments}
              savedWorkoutPlans={savedWorkoutPlans}
              isBusy={isBusy}
              onPressSaved={handleOpenSavedSheet}
              onSaveWorkoutForDay={onSaveWorkoutForDay}
              onChangeWeeklySplitPlan={onChangeWeeklySplitPlan}
              builderIntent={builderIntent}
              onBuilderIntentConsumed={handleBuilderIntentConsumed}
            />
          </Animated.View>
        </ScrollView>

        {savedSheetOpen ? (
          <PlanSavedWorkoutsSheet
            ref={savedSheetRef}
            savedWorkoutPlans={savedWorkoutPlans}
            onOpenWorkout={handleAssignSavedWorkout}
            onDismiss={syncSavedSheetClosed}
          />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}

export default memo(MuscleMapTabScreen);
