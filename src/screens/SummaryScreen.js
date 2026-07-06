import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import {
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStreakRankProgress } from '../data/streakRanks';
import { computeStrengthScoreSummary } from '../data/strengthScore';
import { computeConsecutiveTrainingWeekStreak } from '../utils/consecutiveWeekStreak';
import { formatTime, isBodyweightOnlyExercise } from '../utils/formatWorkout';
import { getHighlightIconSourceForMuscleLabel } from '../utils/splitDayHighlightIcons';

function SummaryScreen({
  screenTransitionOpacity,
  elapsedSeconds,
  movementNamesNewestFirst,
  setsByMovement,
  exerciseLookup,
  editingSetKey,
  editingReps,
  setEditingReps,
  editingWeight,
  setEditingWeight,
  startEditingStoredSet,
  deleteStoredSet,
  saveEditingStoredSet,
  cancelEditingStoredSet,
  onReturnToMenu,
  strengthScoreSummary,
  consecutiveTrainingWeekStreak,
  weeklyWorkoutsLoggedCount,
  menuWeekGymProgress,
  workoutHistory,
  weightLogs,
}) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const insets = useSafeAreaInsets();
  const streak = useMemo(
    () => getStreakRankProgress(consecutiveTrainingWeekStreak),
    [consecutiveTrainingWeekStreak],
  );
  const goalTarget = Math.max(1, Number(menuWeekGymProgress?.target) || 1);
  const goalCompleted = Math.max(0, Number(menuWeekGymProgress?.completed) || 0);
  const goalProgress = Math.max(0, Math.min(1, goalCompleted / goalTarget));

  const previousWorkoutHistory = useMemo(
    () => (Array.isArray(workoutHistory) ? workoutHistory.slice(1) : []),
    [workoutHistory],
  );
  const previousConsecutiveWeeks = useMemo(
    () => computeConsecutiveTrainingWeekStreak(previousWorkoutHistory),
    [previousWorkoutHistory],
  );
  const previousStreak = useMemo(
    () => getStreakRankProgress(previousConsecutiveWeeks),
    [previousConsecutiveWeeks],
  );
  const rankChanged = previousStreak.displayRank?.id !== streak.displayRank?.id;
  const preWorkoutStrengthSummary = useMemo(
    () =>
      computeStrengthScoreSummary(
        previousWorkoutHistory,
        weightLogs,
        exerciseLookup,
        previousConsecutiveWeeks,
      ),
    [previousWorkoutHistory, weightLogs, exerciseLookup, previousConsecutiveWeeks],
  );
  const preWorkoutScore = preWorkoutStrengthSummary?.overallScore ?? 0;
  const finalWorkoutScore = strengthScoreSummary?.overallScore ?? 0;

  const goalFillAnim = useRef(new Animated.Value(0)).current;
  const rankFillAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(preWorkoutScore)).current;
  const scoreTintAnim = useRef(new Animated.Value(0)).current; // 0 white -> 1 green
  const goalContentOpacity = useRef(new Animated.Value(1)).current;
  const rankContentOpacity = useRef(new Animated.Value(0)).current;
  const [goalTrackWidth, setGoalTrackWidth] = useState(0);
  const [rankTrackWidth, setRankTrackWidth] = useState(0);
  const [animatedScoreValue, setAnimatedScoreValue] = useState(preWorkoutScore);

  useEffect(() => {
    const listenerId = scoreAnim.addListener(({ value }) => {
      setAnimatedScoreValue(Math.round(value));
    });
    return () => scoreAnim.removeListener(listenerId);
  }, [scoreAnim]);

  useEffect(() => {
    // Goal track is always mounted; rank track only mounts when rank changes.
    // Fall back to goal width so streak + strength animations still run.
    if (goalTrackWidth <= 0) return;

    const rankBarWidth = rankTrackWidth > 0 ? rankTrackWidth : goalTrackWidth;
    const goalTargetWidth = goalProgress * goalTrackWidth;
    const rankTargetWidth = Math.max(0, Math.min(1, streak.progress)) * rankBarWidth;

    goalFillAnim.stopAnimation();
    rankFillAnim.stopAnimation();
    scoreAnim.stopAnimation();
    scoreTintAnim.stopAnimation();
    goalContentOpacity.stopAnimation();
    rankContentOpacity.stopAnimation();
    goalFillAnim.setValue(0);
    rankFillAnim.setValue(0);
    scoreAnim.setValue(preWorkoutScore);
    scoreTintAnim.setValue(0);
    goalContentOpacity.setValue(1);
    rankContentOpacity.setValue(0);

    const steps = [
      Animated.delay(1000), // pause before any summary animation
      Animated.timing(goalFillAnim, {
        toValue: goalTargetWidth,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.delay(500),
    ];

    steps.push(
      Animated.parallel([
        Animated.timing(goalContentOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(rankContentOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rankFillAnim, {
        toValue: rankTargetWidth,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.delay(500),
    );

    steps.push(
      Animated.timing(scoreTintAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: false,
      }),
      Animated.timing(scoreAnim, {
        toValue: finalWorkoutScore,
        duration: 900,
        useNativeDriver: false,
      }),
      Animated.timing(scoreTintAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }),
    );

    const run = Animated.sequence(steps);
    run.start();
    return () => run.stop();
  }, [
    goalTrackWidth,
    rankTrackWidth,
    goalProgress,
    streak.progress,
    rankChanged,
    preWorkoutScore,
    finalWorkoutScore,
    goalFillAnim,
    rankFillAnim,
    scoreAnim,
    scoreTintAnim,
    goalContentOpacity,
    rankContentOpacity,
  ]);

  const totalWeightLifted = movementNamesNewestFirst.reduce((sum, movement) => {
    const movementSets = setsByMovement[movement] || [];
    return (
      sum +
      movementSets.reduce((movementSum, setItem) => {
        const reps = Number(setItem?.reps) || 0;
        const weight = Number(setItem?.weight) || 0;
        return movementSum + Math.max(0, reps) * Math.max(0, weight);
      }, 0)
    );
  }, 0);

  const totalWeightLiftedLabel =
    Math.abs(totalWeightLifted - Math.round(totalWeightLifted)) < 1e-6
      ? `${Math.round(totalWeightLifted)} lb`
      : `${(Math.round(totalWeightLifted * 10) / 10).toFixed(1)} lb`;
  const animatedStrengthColor = scoreTintAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [wt.textPrimary, '#4ADE80'],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: wt.screenBg }]}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: 10,
              alignItems: 'stretch',
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.summaryHeaderCentered}>Summary</Text>

          <View style={styles.activeWorkoutLogSheetToolbarRow}>
            <View style={[styles.logSheetToolbarButton, styles.logSheetToolbarButtonHistory]}>
              <Text style={[styles.logSheetToolbarButtonLabel, { color: wt.textMuted }]}>Time</Text>
              <Text style={[styles.logSheetToolbarButtonValue, { color: wt.textPrimary }]}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
            <View style={[styles.logSheetToolbarButton, styles.logSheetToolbarButtonRest]}>
              <Text style={[styles.logSheetToolbarButtonLabel, { color: wt.textMuted }]}>Weight lifted</Text>
              <Text style={[styles.logSheetToolbarButtonValue, { color: wt.textPrimary }]}>{totalWeightLiftedLabel}</Text>
            </View>
          </View>

          <View style={styles.summaryStreakCard}>
            <Animated.View style={{ opacity: goalContentOpacity }}>
              <View style={styles.summaryStreakHeaderRow}>
                <View style={styles.summaryStreakTitleRow}>
                  <Image source={require('../../assets/images/streaklogo.png')} style={styles.summaryStreakIcon} />
                  <Text style={styles.summaryStreakTitle}>Week goal</Text>
                </View>
                <Text style={styles.summaryStreakWeeks}>
                  {goalCompleted} / {goalTarget}
                </Text>
              </View>
              <View
                style={styles.summaryStreakTrack}
                onLayout={(event) => {
                  const width = event?.nativeEvent?.layout?.width ?? 0;
                  if (width > 0) {
                    setGoalTrackWidth(width);
                    // Same card width — keeps rank animation ready even before rank overlay mounts.
                    setRankTrackWidth((prev) => (prev > 0 ? prev : width));
                  }
                }}>
                <Animated.View
                  style={[
                    styles.summaryStreakFill,
                    {
                      width: goalFillAnim,
                      backgroundColor: wt.primaryButtonBg,
                    },
                  ]}
                />
              </View>
              <Text style={styles.summaryStreakHint}>
                {goalCompleted >= goalTarget
                  ? 'Week goal reached'
                  : `${Math.max(0, goalTarget - goalCompleted)} workout${Math.max(0, goalTarget - goalCompleted) === 1 ? '' : 's'} to goal`}
              </Text>
            </Animated.View>

            <Animated.View
              style={[styles.summaryStreakOverlayFill, { opacity: rankContentOpacity }]}
              pointerEvents="none">
              <View style={styles.summaryStreakHeaderRow}>
                <View style={styles.summaryStreakTitleRow}>
                  <Image source={streak.displayRank.image} style={styles.summaryRankIcon} />
                  <Text style={styles.summaryStreakTitle}>Week rank</Text>
                </View>
                <Text style={styles.summaryStreakWeeks}>{streak.displayRank.label}</Text>
              </View>
              <View
                style={styles.summaryStreakTrack}
                onLayout={(event) => {
                  const width = event?.nativeEvent?.layout?.width ?? 0;
                  if (width > 0) setRankTrackWidth(width);
                }}>
                <Animated.View
                  style={[
                    styles.summaryStreakFill,
                    {
                      width: rankFillAnim,
                      backgroundColor: streak.displayRank.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.summaryStreakHint}>
                {rankChanged
                  ? `New rank: ${streak.displayRank.label}`
                  : streak.isMaxRank || !streak.nextRank
                    ? 'Top rank reached'
                    : `${streak.progressWeeksCurrent} / ${streak.progressWeeksTarget} weeks to ${streak.nextRank.label}`}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.summaryStrengthDeltaCard}>
            <Text style={styles.summaryStrengthDeltaTitle}>Strength score</Text>
            <Animated.Text style={[styles.summaryStrengthDeltaValueGreen, { color: animatedStrengthColor }]}>
              {animatedScoreValue}
            </Animated.Text>
            <Text style={styles.summaryStrengthDeltaSubtle}>
              {preWorkoutScore} → {finalWorkoutScore}
            </Text>
          </View>

          <Text style={styles.summaryLoggedSetsHeading}>Logged sets</Text>
          {movementNamesNewestFirst.length === 0 ? (
            <Text style={[styles.emptyText, { color: wt.textSecondary, marginTop: 24 }]}>
              No sets were saved in this workout.
            </Text>
          ) : (
            movementNamesNewestFirst.map((movement) => {
              const movementSets = setsByMovement[movement] || [];
              const exerciseMeta = exerciseLookup[movement?.toLowerCase?.() ?? ''];
              const primaryMuscle = exerciseMeta?.primaryMuscles?.[0];
              const muscleIcon = getHighlightIconSourceForMuscleLabel(primaryMuscle);
              return (
                <View
                  key={movement}
                  style={[
                    styles.dashboardCard,
                    {
                      backgroundColor: wt.cardBg,
                      borderColor: wt.cardBorder,
                      marginTop: 12,
                    },
                  ]}>
                  <View style={styles.dashboardTargetMuscleChip}>
                    <View style={styles.dashboardTargetMuscleIconWell}>
                      {muscleIcon ? (
                        <Image source={muscleIcon} style={styles.dashboardTargetMuscleIcon} resizeMode="contain" />
                      ) : null}
                    </View>
                    <View style={styles.dashboardTargetMuscleTextCol}>
                      <Text style={styles.dashboardTargetMuscleChipLabel}>{primaryMuscle || 'Movement'}</Text>
                      <Text style={[styles.activeWorkoutExerciseSub, { marginTop: 2 }]}>{movement}</Text>
                    </View>
                  </View>
                  {movementSets.map((setItem, index) => {
                    const isEditing = editingSetKey === `${movement}::${index}`;
                    const hideWeightWhileEditing =
                      isBodyweightOnlyExercise(movement, exerciseLookup) && Number(setItem.weight) === 0;
                    const wNum = Number(setItem.weight ?? 0);
                    const weightDisplay =
                      isBodyweightOnlyExercise(movement, exerciseLookup) && wNum === 0
                        ? 'BW'
                        : Number.isFinite(wNum) && !Number.isNaN(wNum) && Math.abs(wNum - Math.round(wNum)) < 1e-6
                          ? String(Math.round(wNum))
                          : String(setItem.weight ?? '');
                    const valueBoxStyle = [
                      styles.logSheetSetListValueBox,
                      {
                        backgroundColor: wt.splitModalInnerBg,
                        borderColor: isEditing ? wt.primaryButtonBg : wt.inputBorder,
                      },
                    ];
                    return (
                      <View
                        key={`${movement}-${index}`}
                        style={[
                          styles.logSheetSetListRow,
                          index === movementSets.length - 1 ? { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 } : null,
                        ]}>
                        <Text style={styles.logSheetSetListNumber}>{index + 1}</Text>
                        <View style={styles.logSheetSetListMain}>
                          <View style={styles.logSheetSetListValuesRow}>
                            <View style={styles.logSheetSetListFieldCol}>
                              <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Reps</Text>
                              {isEditing ? (
                                <View style={valueBoxStyle}>
                                  <TextInput
                                    value={editingReps}
                                    onChangeText={setEditingReps}
                                    keyboardType="number-pad"
                                    placeholder="Reps"
                                    placeholderTextColor={wt.placeholderText}
                                    style={[styles.logSheetSetListValueInput, { color: wt.inputText }]}
                                  />
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={valueBoxStyle}
                                  onPress={() => startEditingStoredSet(movement, index, setItem, 'reps')}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Edit reps for set ${index + 1}`}>
                                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>{setItem.reps}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={[styles.logSheetSetListAt, { color: wt.textSecondary }]}>@</Text>
                            <View style={styles.logSheetSetListFieldCol}>
                              <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Weight</Text>
                              {hideWeightWhileEditing ? (
                                <View style={valueBoxStyle}>
                                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>{weightDisplay}</Text>
                                </View>
                              ) : isEditing ? (
                                <View style={valueBoxStyle}>
                                  <TextInput
                                    value={editingWeight}
                                    onChangeText={setEditingWeight}
                                    keyboardType="decimal-pad"
                                    placeholder="Weight"
                                    placeholderTextColor={wt.placeholderText}
                                    style={[styles.logSheetSetListValueInput, { color: wt.inputText }]}
                                  />
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={valueBoxStyle}
                                  onPress={() => startEditingStoredSet(movement, index, setItem, 'weight')}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Edit weight for set ${index + 1}`}>
                                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>{weightDisplay}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                          <Text style={[styles.logSheetSetListMeta, { color: wt.textMuted }]}>
                            {formatTime(setItem.elapsedSeconds)}
                          </Text>
                          <View style={styles.logSheetSetListActions}>
                            {isEditing ? (
                              <>
                                <TouchableOpacity
                                  style={[styles.smallActionButton, { backgroundColor: wt.primaryButtonBg }]}
                                  onPress={() => saveEditingStoredSet(movement, index)}>
                                  <Text style={[styles.smallActionButtonText, { color: wt.primaryButtonText }]}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.smallActionButton, { backgroundColor: wt.secondaryButtonBg }]}
                                  onPress={cancelEditingStoredSet}>
                                  <Text style={[styles.smallActionButtonText, { color: wt.secondaryButtonText }]}>Cancel</Text>
                                </TouchableOpacity>
                              </>
                            ) : null}
                            <TouchableOpacity
                              style={[styles.smallActionButton, styles.smallDeleteButton]}
                              onPress={() => deleteStoredSet(movement, index)}>
                              <Text style={styles.smallDeleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

        </ScrollView>

        <View
          style={[
            styles.logSheetSaveFooter,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: insets.bottom + 10,
              backgroundColor: wt.screenBg,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.08)',
            },
          ]}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: wt.secondaryButtonBg, marginBottom: 0 }]}
            onPress={onReturnToMenu}>
            <Text style={[styles.secondaryButtonText, { color: wt.secondaryButtonText }]}>Return to Menu</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(SummaryScreen);
