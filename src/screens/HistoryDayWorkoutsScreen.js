import React, { memo } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import { Animated, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatVolumeCompact, getWorkoutVolumeLb } from '../../utils/workoutStats';
import { formatTime } from '../utils/formatWorkout';

function HistoryDayWorkoutsScreen({
  screenTransitionOpacity,
  onBack,
  dayTitleLabel,
  workoutsForDay,
  onSelectWorkout,
  handleDeleteWorkout,
  textPrimary,
  setText,
  deleteText,
  cardBg,
  accentColor,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const accent = accentColor || theme.navAccent;

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
              <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>{dayTitleLabel}</Text>
          </View>

          <Text style={[styles.menuMoreBodyText, { marginBottom: 16 }]}>
            {workoutsForDay.length === 0
              ? 'No workouts saved for this day.'
              : workoutsForDay.length === 1
                ? '1 workout logged.'
                : `${workoutsForDay.length} workouts logged. Tap one to view its summary.`}
          </Text>

          {workoutsForDay.map((workoutItem, workoutIndex) => {
            const movementKeys = Object.keys(workoutItem.setsByMovement || {});
            const workoutVolume = getWorkoutVolumeLb(workoutItem);
            const finishedAt = new Date(workoutItem.completedAt);
            const timeLabel = Number.isNaN(finishedAt.getTime())
              ? 'Unknown time'
              : finishedAt.toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                });

            return (
              <TouchableOpacity
                key={workoutItem.id || `${workoutIndex}`}
                style={[styles.movementCard, { backgroundColor: cardBg, marginBottom: 12 }]}
                onPress={() => onSelectWorkout?.(workoutItem.id)}
                accessibilityRole="button"
                accessibilityLabel={`View summary for workout ${workoutsForDay.length - workoutIndex}`}>
                <View style={styles.historyCardHeader}>
                  <Text style={[styles.movementTitle, { color: textPrimary }]}>
                    Workout {workoutsForDay.length - workoutIndex}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteWorkout(workoutItem.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.deleteText, { color: deleteText }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.setText, { color: setText }]}>
                  {timeLabel} · {formatTime(workoutItem.elapsedSeconds)} · {workoutItem.totalReps} reps ·{' '}
                  {formatVolumeCompact(workoutVolume)} lb
                </Text>
                <Text style={[styles.setText, { color: setText, marginTop: 4 }]}>
                  {movementKeys.length === 0
                    ? 'No movements logged'
                    : movementKeys.length === 1
                      ? movementKeys[0]
                      : `${movementKeys.length} movements`}
                </Text>
                <Text style={[styles.setText, { color: accent, marginTop: 10, fontWeight: '600' }]}>
                  View summary ›
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(HistoryDayWorkoutsScreen);
