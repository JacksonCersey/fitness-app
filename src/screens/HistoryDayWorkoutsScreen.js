import React, { memo } from 'react';
import { Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatVolumeCompact, getWorkoutVolumeLb } from '../../utils/workoutStats';
import { formatTime, formatWorkoutSetSummaryText } from '../utils/formatWorkout';
import { styles } from '../styles';

function HistoryDayWorkoutsScreen({
  screenTransitionOpacity,
  onBack,
  dayTitleLabel,
  workoutsForDay,
  exerciseLookup,
  handleDeleteWorkout,
  textPrimary,
  setText,
  deleteText,
  cardBg,
}) {
  return (
    <SafeAreaView style={styles.menuScreen}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView
          style={styles.profileScrollOuter}
          contentContainerStyle={[styles.profileScrollContent, { paddingBottom: 32 }]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.menuGradientTopGlow} pointerEvents="none" />
          <View style={styles.menuGradientBottomGlow} pointerEvents="none" />

          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.profileCloseInlineButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={[styles.workoutCloseButtonText, { color: '#4B3CC1' }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>{dayTitleLabel}</Text>
          </View>

          <Text style={[styles.menuMoreBodyText, { marginBottom: 16 }]}>
            {workoutsForDay.length === 0
              ? 'No workouts saved for this day.'
              : workoutsForDay.length === 1
                ? '1 workout logged.'
                : `${workoutsForDay.length} workouts logged.`}
          </Text>

          {workoutsForDay.map((workoutItem, workoutIndex) => {
            const movementKeys = Object.keys(workoutItem.setsByMovement || {});
            const workoutVolume = getWorkoutVolumeLb(workoutItem);
            return (
              <View
                key={workoutItem.id || `${workoutIndex}`}
                style={[styles.movementCard, { backgroundColor: cardBg, marginBottom: 12 }]}>
                <View style={styles.historyCardHeader}>
                  <Text style={[styles.movementTitle, { color: textPrimary }]}>
                    Workout {workoutsForDay.length - workoutIndex}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteWorkout(workoutItem.id)}>
                    <Text style={[styles.deleteText, { color: deleteText }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.setText, { color: setText }]}>
                  Finished: {new Date(workoutItem.completedAt).toLocaleString()}
                </Text>
                <Text style={[styles.setText, { color: setText }]}>
                  Total time: {formatTime(workoutItem.elapsedSeconds)} · Total reps: {workoutItem.totalReps} · Volume:{' '}
                  {formatVolumeCompact(workoutVolume)} lb
                </Text>

                {movementKeys.map((movement) => {
                  const movementSets = workoutItem.setsByMovement[movement] || [];
                  return (
                    <View key={`${workoutItem.id}-${movement}`} style={styles.historyMovementBlock}>
                      <Text style={[styles.historyMovementTitle, { color: textPrimary }]}>{movement}</Text>
                      {movementSets.map((setItem, setIndex) => (
                        <Text
                          key={`${workoutItem.id}-${movement}-${setIndex}`}
                          style={[styles.setText, { color: setText }]}>
                          {formatWorkoutSetSummaryText(movement, setItem, exerciseLookup)}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(HistoryDayWorkoutsScreen);
