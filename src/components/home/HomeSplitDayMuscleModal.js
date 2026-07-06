import React, { memo, useMemo } from 'react';
import { BlurView } from 'expo-blur';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { SPLIT_DAY_TYPE_LABELS } from '../../data/weeklySplitPlanner';
import { formatTime, formatWorkoutSetSummaryText } from '../../utils/formatWorkout';
import { getWorkoutsForLocalDay } from '../../utils/homeDashboard';
import { getSplitDayAccentColor } from '../../utils/splitDayColors';
import { formatVolumeCompact, getWorkoutVolumeLb } from '../../../utils/workoutStats';

/**
 * @typedef {{ x: number; y: number; width: number; height: number }} BubbleAnchorRect
 */

/**
 * @param {{
 *   visible: boolean;
 *   date: Date | null;
 *   dayEntry: { type: string; mixedMuscles?: string[] };
 *   workoutHistory: unknown[];
 *   exerciseLookup: Record<string, unknown>;
 *   anchor: BubbleAnchorRect | null;
 *   onClose: () => void;
 * }} props
 */
function HomeSplitDayMuscleModal({
  visible,
  date,
  dayEntry,
  workoutHistory,
  exerciseLookup,
  anchor,
  onClose,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const title = useMemo(() => {
    if (dayEntry?.type === 'rest') return 'Rest Day';
    return SPLIT_DAY_TYPE_LABELS[dayEntry?.type] ?? 'Workout';
  }, [dayEntry?.type]);

  const workoutsForDay = useMemo(
    () => (date ? getWorkoutsForLocalDay(workoutHistory, date) : []),
    [workoutHistory, date],
  );

  const accent = getSplitDayAccentColor(dayEntry?.type, theme);

  const bubblePositionStyle = useMemo(() => {
    if (!anchor) {
      return { top: windowHeight * 0.35, left: 16, right: 16 };
    }
    const gapBelowIcons = 12;
    return {
      left: 16,
      right: 16,
      top: anchor.y + anchor.height + gapBelowIcons,
    };
  }, [anchor, windowHeight]);

  const dateLabel = useMemo(() => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.homeMuscleBubbleOverlay} accessibilityViewIsModal>
        <Pressable
          style={styles.homeMuscleBubbleBackdropPress}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss workout details"
        />

        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(160)}
          style={[
            styles.homeMuscleBubble,
            bubblePositionStyle,
            { borderColor: `${accent}66`, shadowColor: accent, maxWidth: windowWidth - 32 },
          ]}
          accessibilityLabel={`${title} workout details`}>
          <View
            style={[
              styles.homeMuscleBubbleTail,
              {
                backgroundColor: theme.innerCardBg,
                borderColor: `${accent}66`,
              },
            ]}
          />
          <BlurView
            intensity={48}
            tint={theme.isLight ? 'light' : 'dark'}
            style={styles.homeMuscleBubbleGlass}>
            <ScrollView
              style={styles.homeMuscleBubbleScroll}
              contentContainerStyle={styles.homeMuscleBubbleInner}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Text style={styles.homeMuscleBubbleTitle}>{title}</Text>
              <Text style={styles.homeMuscleBubbleSubtitle}>
                {workoutsForDay.length > 0
                  ? `${dateLabel} · ${workoutsForDay.length === 1 ? '1 workout' : `${workoutsForDay.length} workouts`}`
                  : `${dateLabel} · No workout logged`}
              </Text>

              {workoutsForDay.length === 0 ? (
                <Text style={styles.homeMuscleBubbleEmpty}>
                  Nothing logged for this day yet. Finish a workout to see sets and volume here.
                </Text>
              ) : (
                workoutsForDay.map((workoutItem, workoutIndex) => {
                  const movementKeys = Object.keys(workoutItem.setsByMovement || {});
                  const workoutVolume = getWorkoutVolumeLb(workoutItem);
                  const isLastWorkout = workoutIndex === workoutsForDay.length - 1;

                  return (
                    <View
                      key={workoutItem.id || `workout-${workoutIndex}`}
                      style={[
                        styles.homeMuscleBubbleWorkoutBlock,
                        isLastWorkout && styles.homeMuscleBubbleWorkoutBlockLast,
                      ]}>
                      {workoutsForDay.length > 1 ? (
                        <Text style={styles.homeMuscleBubbleWorkoutLabel}>
                          Workout {workoutsForDay.length - workoutIndex}
                        </Text>
                      ) : null}
                      <Text style={styles.homeMuscleBubbleWorkoutMeta}>
                        {formatTime(workoutItem.elapsedSeconds || 0)} · {workoutItem.totalReps || 0} reps ·{' '}
                        {formatVolumeCompact(workoutVolume)} lb
                      </Text>

                      {movementKeys.map((movement) => {
                        const movementSets = (workoutItem.setsByMovement[movement] || []).filter(
                          (setItem) => (Number(setItem?.reps) || 0) > 0,
                        );
                        if (movementSets.length === 0) return null;

                        return (
                          <View key={`${workoutItem.id}-${movement}`}>
                            <Text style={styles.homeMuscleBubbleMovementTitle}>{movement}</Text>
                            {movementSets.map((setItem, setIndex) => (
                              <Text
                                key={`${workoutItem.id}-${movement}-${setIndex}`}
                                style={styles.homeMuscleBubbleSetLine}>
                                {formatWorkoutSetSummaryText(movement, setItem, exerciseLookup)}
                              </Text>
                            ))}
                          </View>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(HomeSplitDayMuscleModal);
