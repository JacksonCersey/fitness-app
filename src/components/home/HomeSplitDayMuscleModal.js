import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import BackMuscleDiagramSvg from '../../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../../components/FrontMuscleDiagramSvg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { getMondayBasedDayIndex, isSplitPlanTrainingDay } from '../../data/weeklySplitPlanner';
import { getWorkoutPlanForDay, isDefaultWorkoutPlan } from '../../data/workoutPlans';
import { isSameMondayWeek, resolveWeekPlanSourceIndex } from '../../data/weekPlanDayOverrides';
import { getPrimaryMusclesForPlan } from '../plan/PlanSplitTimelineCard';
import { getWorkoutsForLocalDay, isTodayLocalDay } from '../../utils/homeDashboard';
import { muscleActivationFromDisplayLabels } from '../../utils/muscleActivationFromLabels';

const MINI_H = 64;
const ENTER_MS = 200;
const EXIT_MS = 200;
const EXIT_EASE = Easing.out(Easing.cubic);

/**
 * @typedef {{ x: number; y: number; width: number; height: number }} BubbleAnchorRect
 */

function PlanMusclePreview({ muscles }) {
  const styles = useStyles();
  const activation = useMemo(() => muscleActivationFromDisplayLabels(muscles), [muscles]);

  if (!muscles || muscles.length === 0) {
    return (
      <View style={styles.homeLevelPlanMuscleWell}>
        <Text style={styles.homeLevelPlanMusclePlaceholder}>muscles</Text>
      </View>
    );
  }

  return (
    <View style={styles.homeLevelPlanMuscleWell}>
      <View style={styles.homeLevelPlanMuscleDiagrams}>
        <View style={styles.homeLevelPlanMuscleHalf}>
          <FrontMuscleDiagramSvg activationBySlug={activation} height={MINI_H} />
        </View>
        <View style={styles.homeLevelPlanMuscleHalf}>
          <BackMuscleDiagramSvg activationBySlug={activation} height={MINI_H} />
        </View>
      </View>
    </View>
  );
}

/**
 * @param {{
 *   visible: boolean;
 *   date: Date | null;
 *   dayEntry: { type: string; mixedMuscles?: string[] };
 *   workoutHistory: unknown[];
 *   exerciseLookup: Record<string, unknown>;
 *   savedWorkoutPlans?: { id: string }[] | null;
 *   dayWorkoutAssignments?: { assignments: (string | null)[] } | null;
 *   weekPlanDayOverrides?: { weekKey?: string; daySourceByPlanIndex?: number[] } | null;
 *   anchor: BubbleAnchorRect | null;
 *   onClose: () => void;
 *   onStartWorkout?: (date: Date) => void;
 * }} props
 */
function HomeSplitDayMuscleModal({
  visible,
  date,
  dayEntry,
  workoutHistory,
  exerciseLookup,
  savedWorkoutPlans,
  dayWorkoutAssignments,
  weekPlanDayOverrides,
  anchor,
  onClose,
  onStartWorkout,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  /** Keep Modal mounted for exit; RN `visible={false}` would skip fade-out. */
  const [presented, setPresented] = useState(false);
  const presentedRef = useRef(false);
  const closingRef = useRef(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  /**
   * Parent clears date/anchor as soon as onClose runs. Freeze the last open snapshot
   * so the bubble does not jump to the fallback position mid-fade.
   */
  const frozenRef = useRef({
    date,
    dayEntry,
    anchor,
    weekPlanDayOverrides,
  });

  if (visible && date) {
    frozenRef.current = {
      date,
      dayEntry,
      anchor,
      weekPlanDayOverrides,
    };
  }

  const activeDate = visible ? date : frozenRef.current.date;
  const activeDayEntry = visible ? dayEntry : frozenRef.current.dayEntry;
  const activeAnchor = visible ? anchor : frozenRef.current.anchor;
  const activeWeekOverrides = visible
    ? weekPlanDayOverrides
    : frozenRef.current.weekPlanDayOverrides;

  const isTrainingDay = isSplitPlanTrainingDay(activeDayEntry);
  const isToday = Boolean(activeDate && isTodayLocalDay(activeDate));
  const isSameWeekAsToday = Boolean(activeDate && isSameMondayWeek(activeDate, new Date()));
  const isSwapAction = Boolean(isTrainingDay && activeDate && !isToday && isSameWeekAsToday);

  const workoutPlan = useMemo(() => {
    if (!activeDate || !isTrainingDay) return null;
    const planIndex = getMondayBasedDayIndex(activeDate);
    const sourceIndex = resolveWeekPlanSourceIndex(activeWeekOverrides, activeDate, planIndex);
    return getWorkoutPlanForDay(
      dayWorkoutAssignments,
      savedWorkoutPlans,
      sourceIndex,
      activeDayEntry,
    );
  }, [
    activeDate,
    activeDayEntry,
    activeWeekOverrides,
    dayWorkoutAssignments,
    isTrainingDay,
    savedWorkoutPlans,
  ]);

  const exerciseCount = Array.isArray(workoutPlan?.exercises) ? workoutPlan.exercises.length : 0;
  const title = workoutPlan?.name || (activeDayEntry?.type === 'rest' ? 'Rest Day' : 'Workout');
  const isDefault = isDefaultWorkoutPlan(workoutPlan);

  const muscles = useMemo(
    () => (isTrainingDay ? getPrimaryMusclesForPlan(workoutPlan, activeDayEntry, exerciseLookup) : []),
    [activeDayEntry, exerciseLookup, isTrainingDay, workoutPlan],
  );

  const workoutsForDay = useMemo(
    () => (activeDate ? getWorkoutsForLocalDay(workoutHistory, activeDate) : []),
    [workoutHistory, activeDate],
  );

  const totalTargetSets = useMemo(() => {
    const exercises = Array.isArray(workoutPlan?.exercises) ? workoutPlan.exercises : [];
    return exercises.reduce((sum, item) => sum + (Number(item?.targetSets) || 0), 0);
  }, [workoutPlan]);

  const bubblePositionStyle = useMemo(() => {
    if (!activeAnchor) {
      return { top: windowHeight * 0.35, left: 16, right: 16 };
    }
    const gapBelowIcons = 12;
    return {
      left: 16,
      right: 16,
      top: activeAnchor.y + activeAnchor.height + gapBelowIcons,
    };
  }, [activeAnchor, windowHeight]);

  const dateLabel = useMemo(() => {
    if (!activeDate) return '';
    return activeDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [activeDate]);

  const planMeta = useMemo(() => {
    const parts = [dateLabel];
    if (!isTrainingDay) {
      parts.push('rest day');
      return parts.join(' · ');
    }
    parts.push(isDefault ? 'default plan' : 'custom plan');
    parts.push(`${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`);
    if (workoutsForDay.length > 0) {
      parts.push(
        workoutsForDay.length === 1 ? '1 logged' : `${workoutsForDay.length} logged`,
      );
    }
    return parts.join(' · ');
  }, [dateLabel, exerciseCount, isDefault, isTrainingDay, workoutsForDay.length]);

  const previewExercises = useMemo(() => {
    const exercises = Array.isArray(workoutPlan?.exercises) ? workoutPlan.exercises : [];
    return exercises.slice(0, 4);
  }, [workoutPlan]);

  const unmountAfterExit = useCallback(() => {
    closingRef.current = false;
    presentedRef.current = false;
    setPresented(false);
  }, []);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      presentedRef.current = true;
      setPresented(true);
      opacity.value = 0;
      translateY.value = 6;
      opacity.value = withTiming(1, { duration: ENTER_MS, easing: EXIT_EASE });
      translateY.value = withTiming(0, { duration: ENTER_MS, easing: EXIT_EASE });
      return;
    }

    if (!presentedRef.current || closingRef.current) return;

    closingRef.current = true;
    opacity.value = withTiming(0, { duration: EXIT_MS, easing: EXIT_EASE });
    translateY.value = withTiming(8, { duration: EXIT_MS, easing: EXIT_EASE }, (finished) => {
      if (finished) {
        runOnJS(unmountAfterExit)();
      }
    });
  }, [opacity, translateY, unmountAfterExit, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleStartPress = useCallback(() => {
    if (!activeDate || !onStartWorkout) return;
    onClose();
    onStartWorkout(activeDate);
  }, [activeDate, onClose, onStartWorkout]);

  const canStart = Boolean(isTrainingDay && workoutPlan && exerciseCount > 0 && onStartWorkout);

  if (!presented) return null;

  return (
    <Modal transparent animationType="none" visible={presented} onRequestClose={onClose}>
      <Animated.View style={[styles.homeMuscleBubbleOverlay, overlayStyle]} accessibilityViewIsModal>
        <Pressable
          style={styles.homeMuscleBubbleBackdropPress}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss workout plan"
        />

        <Animated.View
          style={[
            styles.homeMuscleBubble,
            bubblePositionStyle,
            bubbleStyle,
            { borderColor: theme.borderSubtle, maxWidth: windowWidth - 32 },
          ]}
          accessibilityLabel={`${title} workout plan`}>
          <View
            style={[
              styles.homeMuscleBubbleTail,
              {
                backgroundColor: theme.innerCardBg,
                borderColor: theme.borderSubtle,
              },
            ]}
          />
          <BlurView intensity={48} tint="dark" style={styles.homeMuscleBubbleGlass}>
            <ScrollView
              style={styles.homeMuscleBubbleScroll}
              contentContainerStyle={styles.homeMuscleBubbleInner}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Text style={styles.homeMuscleBubbleTitle}>{title}</Text>
              <Text style={styles.homeMuscleBubbleSubtitle}>{planMeta}</Text>

              {!isTrainingDay ? (
                <Text style={styles.homeMuscleBubbleEmpty}>
                  Rest day — no workout planned. Pick a training day to preview and start a session.
                </Text>
              ) : !workoutPlan || exerciseCount === 0 ? (
                <Text style={styles.homeMuscleBubbleEmpty}>
                  No exercises planned for this day yet. Assign a workout on the Plan tab.
                </Text>
              ) : (
                <>
                  <View style={styles.homeLevelPlanPreviewRow}>
                    <PlanMusclePreview muscles={muscles} />
                    <View style={styles.homeLevelPlanStatsCol}>
                      <Text style={styles.homeLevelPlanStatLine}>
                        {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
                      </Text>
                      <Text style={styles.homeLevelPlanStatLine}>
                        {totalTargetSets > 0
                          ? `${totalTargetSets} planned set${totalTargetSets === 1 ? '' : 's'}`
                          : 'targets not set'}
                      </Text>
                      <Text style={styles.homeLevelPlanStatLineMuted}>
                        {muscles.length > 0
                          ? muscles.slice(0, 3).join(', ')
                          : 'muscle focus from plan'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.homeLevelPlanExerciseList}>
                    {previewExercises.map((item, index) => {
                      const sets = Number(item?.targetSets) || 0;
                      const reps = Number(item?.targetReps) || 0;
                      const targetLabel =
                        sets > 0 && reps > 0
                          ? `${sets}×${reps}`
                          : sets > 0
                            ? `${sets} sets`
                            : reps > 0
                              ? `${reps} reps`
                              : null;
                      return (
                        <View
                          key={`${item.movement}-${index}`}
                          style={styles.homeLevelPlanExerciseRow}>
                          <Text style={styles.homeLevelPlanExerciseName} numberOfLines={1}>
                            {item.movement}
                          </Text>
                          {targetLabel ? (
                            <Text style={styles.homeLevelPlanExerciseTarget}>{targetLabel}</Text>
                          ) : null}
                        </View>
                      );
                    })}
                    {exerciseCount > previewExercises.length ? (
                      <Text style={styles.homeLevelPlanExerciseMore}>
                        +{exerciseCount - previewExercises.length} more
                      </Text>
                    ) : null}
                  </View>

                  {canStart ? (
                    <TouchableOpacity
                      style={[styles.homeLevelPlanStartButton, { backgroundColor: theme.navAccent }]}
                      activeOpacity={0.88}
                      onPress={handleStartPress}
                      accessibilityRole="button"
                      accessibilityLabel={isSwapAction ? `Swap to ${title}` : `Start ${title}`}>
                      <Text style={styles.homeLevelPlanStartButtonText}>
                        {isSwapAction ? 'Swap Workout' : 'Start Workout'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </ScrollView>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default memo(HomeSplitDayMuscleModal);
