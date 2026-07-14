import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';
import { isSplitPlanTrainingDay, SPLIT_DAY_TYPE_LABELS } from '../../data/weeklySplitPlanner';
import {
  getWorkoutPlanForDay,
  isDefaultWorkoutPlan,
} from '../../data/workoutPlans';
import PlanDayWorkoutBuilder, { normalizeExercises } from './PlanDayWorkoutBuilder';
import PlanExerciseSummaryList from './PlanExerciseSummaryList';
import PlanWorkoutHeader from './PlanWorkoutHeader';
import PlanWorkoutOptionsModal from './PlanWorkoutOptionsModal';

/** Fade out / fade in when switching Plan summary ↔ workout editor. */
const PLAN_EDIT_FADE_OUT_MS = 120;
const PLAN_EDIT_FADE_IN_MS = 160;

/**
 * Selected Plan day content: summary by default, inline builder after Create/Edit.
 *
 * @param {{ planIndex: number; mode?: 'create' | 'edit'; token: number } | null} [builderIntent]
 *        External request to open the builder (e.g. from timeline Create New).
 */
function PlanDayPager({
  selectedPlanIndex,
  weeklySplitPlan,
  dayWorkoutAssignments,
  savedWorkoutPlans,
  isBusy,
  onPressSaved,
  onSaveWorkoutForDay,
  onChangeWeeklySplitPlan,
  builderIntent = null,
  onBuilderIntentConsumed,
}) {
  const styles = useStyles();
  const planIndex = selectedPlanIndex;
  const [mode, setMode] = useState('summary');
  const [draftExercises, setDraftExercises] = useState([]);
  const [draftName, setDraftName] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const lastIntentTokenRef = useRef(null);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const transitionLockRef = useRef(false);

  const isBuilder = mode === 'builder';

  const dayEntry = useMemo(
    () => weeklySplitPlan?.days?.[planIndex] ?? { type: 'rest', mixedMuscles: [] },
    [weeklySplitPlan, planIndex],
  );
  const isTrainingDay = isSplitPlanTrainingDay(dayEntry);
  const workoutPlan = useMemo(
    () => getWorkoutPlanForDay(dayWorkoutAssignments, savedWorkoutPlans, planIndex, dayEntry),
    [dayWorkoutAssignments, savedWorkoutPlans, planIndex, dayEntry],
  );
  const showingDefault = Boolean(workoutPlan && isDefaultWorkoutPlan(workoutPlan));
  const dayFallbackName = isTrainingDay
    ? `${SPLIT_DAY_TYPE_LABELS[dayEntry.type] ?? 'Workout'} Day`
    : 'Rest day';
  const title = isBuilder
    ? draftName || dayFallbackName
    : workoutPlan?.name ?? dayFallbackName;
  const exerciseCount = workoutPlan?.exercises?.length ?? 0;
  const exerciseLabel =
    !isBuilder && workoutPlan
      ? `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`
      : null;
  const statusLabel = isBuilder
    ? 'Add movements for this day'
    : isTrainingDay
      ? workoutPlan
        ? showingDefault
          ? 'Default workout'
          : 'Custom workout'
        : 'Create or pick a saved workout'
      : 'No workout planned';

  const canSaveDraft = useMemo(
    () => draftExercises.some((item) => String(item?.movement || '').trim()),
    [draftExercises],
  );

  const canRename = Boolean(workoutPlan) || isBuilder;

  const runModeTransition = useCallback(
    (nextMode, prepare) => {
      if (transitionLockRef.current) return;
      if (mode === nextMode) return;
      transitionLockRef.current = true;
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: PLAN_EDIT_FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          transitionLockRef.current = false;
          return;
        }
        prepare?.();
        setMode(nextMode);
        requestAnimationFrame(() => {
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: PLAN_EDIT_FADE_IN_MS,
            useNativeDriver: true,
          }).start(() => {
            transitionLockRef.current = false;
          });
        });
      });
    },
    [contentOpacity, mode],
  );

  const enterBuilder = useCallback(
    (nextMode) => {
      if (isBusy || !isTrainingDay || transitionLockRef.current) return;
      runModeTransition('builder', () => {
        if (nextMode === 'edit' && workoutPlan) {
          setDraftExercises(normalizeExercises(workoutPlan.exercises));
          setDraftName(String(workoutPlan.name || '').trim() || dayFallbackName);
        } else {
          setDraftExercises([]);
          setDraftName(dayFallbackName);
        }
      });
    },
    [dayFallbackName, isBusy, isTrainingDay, runModeTransition, workoutPlan],
  );

  const exitBuilder = useCallback(() => {
    if (transitionLockRef.current) return;
    runModeTransition('summary', () => {
      setDraftExercises([]);
      setDraftName('');
      setOptionsOpen(false);
    });
  }, [runModeTransition]);

  // Discard builder when the selected weekday changes (no fade — day already changed).
  useEffect(() => {
    contentOpacity.stopAnimation();
    contentOpacity.setValue(1);
    transitionLockRef.current = false;
    setDraftExercises([]);
    setDraftName('');
    setOptionsOpen(false);
    setMode('summary');
  }, [contentOpacity, planIndex]);

  // Honor external intent (timeline Create New → Plan builder).
  useEffect(() => {
    if (!builderIntent || builderIntent.token === lastIntentTokenRef.current) return;
    lastIntentTokenRef.current = builderIntent.token;
    if (builderIntent.planIndex !== planIndex) return;
    enterBuilder(builderIntent.mode === 'edit' ? 'edit' : 'create');
    onBuilderIntentConsumed?.();
  }, [builderIntent, enterBuilder, onBuilderIntentConsumed, planIndex]);

  const handleSavePress = useCallback(() => {
    if (!canSaveDraft || transitionLockRef.current) return;
    const exercises = draftExercises
      .map(({ movement, targetSets, targetReps }) => ({
        movement: String(movement || '').trim(),
        targetSets,
        targetReps,
      }))
      .filter((item) => item.movement);
    if (exercises.length === 0) return;
    const trimmedName = String(draftName || '').trim();
    onSaveWorkoutForDay?.(planIndex, {
      exercises,
      provisionalName: trimmedName || dayFallbackName || 'Workout',
    });
    exitBuilder();
  }, [
    canSaveDraft,
    dayFallbackName,
    draftExercises,
    draftName,
    exitBuilder,
    onSaveWorkoutForDay,
    planIndex,
  ]);

  const handleRename = useCallback(
    (nextName) => {
      const trimmed = String(nextName || '').trim();
      if (!trimmed) return;

      if (isBuilder) {
        setDraftName(trimmed);
        return;
      }

      if (!workoutPlan?.exercises?.length) {
        setDraftName(trimmed);
        return;
      }

      onSaveWorkoutForDay?.(planIndex, {
        exercises: workoutPlan.exercises,
        provisionalName: trimmed,
      });
    },
    [isBuilder, onSaveWorkoutForDay, planIndex, workoutPlan],
  );

  const handleChangeType = useCallback(
    (nextType) => {
      if (!onChangeWeeklySplitPlan || !weeklySplitPlan?.days) return;
      const type = String(nextType || '').trim();
      if (!type) return;
      const nextDays = weeklySplitPlan.days.map((day, index) => {
        if (index !== planIndex) return day;
        if (type === 'mixed') {
          return { type: 'mixed', mixedMuscles: [...(day.mixedMuscles ?? [])] };
        }
        return { type, mixedMuscles: [] };
      });
      onChangeWeeklySplitPlan({ days: nextDays });
      if (isBuilder && !String(draftName || '').trim()) {
        const label = SPLIT_DAY_TYPE_LABELS[type] ?? 'Workout';
        setDraftName(`${label} Day`);
      }
    },
    [draftName, isBuilder, onChangeWeeklySplitPlan, planIndex, weeklySplitPlan],
  );

  return (
    <View style={styles.planDaySection}>
      <Animated.View style={{ opacity: contentOpacity }}>
        <PlanWorkoutHeader
          title={title}
          statusLabel={statusLabel}
          exerciseLabel={exerciseLabel}
          onPressMore={!isBusy && isBuilder ? () => setOptionsOpen(true) : undefined}
          onPressEdit={
            !isBuilder && isTrainingDay && workoutPlan && !isBusy
              ? () => enterBuilder('edit')
              : undefined
          }
          onPressSaved={!isBuilder && !isBusy ? onPressSaved : undefined}
          onPressCreate={
            !isBuilder && isTrainingDay && !isBusy ? () => enterBuilder('create') : undefined
          }
          onPressCancel={isBuilder ? exitBuilder : undefined}
          onPressSave={isBuilder ? handleSavePress : undefined}
          canSave={canSaveDraft}
        />

        {isBuilder ? (
          <PlanDayWorkoutBuilder
            key={`builder-${planIndex}`}
            exercises={draftExercises}
            onChangeExercises={setDraftExercises}
          />
        ) : (
          <PlanExerciseSummaryList
            exercises={workoutPlan?.exercises}
            emptyBody={
              isTrainingDay
                ? 'Tap Create to build a workout, or Library to assign one.'
                : 'Rest day — no workout planned.'
            }
          />
        )}
      </Animated.View>

      <PlanWorkoutOptionsModal
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        workoutName={title}
        canRename={canRename}
        dayType={dayEntry.type}
        onRename={handleRename}
        onChangeType={handleChangeType}
      />
    </View>
  );
}

export default memo(PlanDayPager);
