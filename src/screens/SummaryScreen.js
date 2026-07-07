import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameTheme, useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
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
import HomeBodyPanelGlow from '../components/home/HomeBodyPanelGlow';
import SummaryWeekProgressPager from '../components/summary/SummaryWeekProgressPager';
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
  readOnly = false,
  skipAnimations = false,
  returnButtonLabel = 'Return to Menu',
}) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const theme = useGameTheme();
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
  const pagerRef = useRef(null);
  const userHasSwipedRef = useRef(false);
  const strengthAnimRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [goalTrackWidth, setGoalTrackWidth] = useState(0);
  const [rankTrackWidth, setRankTrackWidth] = useState(0);
  const [animatedScoreValue, setAnimatedScoreValue] = useState(preWorkoutScore);

  const handleCardLayout = useCallback((event) => {
    const width = event?.nativeEvent?.layout?.width ?? 0;
    if (width > 0) setCardWidth(width);
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    userHasSwipedRef.current = true;
  }, []);

  const handlePageChange = useCallback(
    (event) => {
      if (cardWidth <= 0) return;
      const page = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
      const clamped = Math.max(0, Math.min(1, page));
      setActivePage(clamped);
      userHasSwipedRef.current = true;
    },
    [cardWidth],
  );

  useEffect(() => {
    if (!skipAnimations || cardWidth <= 0) return;
    const targetPage = rankChanged ? 1 : 0;
    setActivePage(targetPage);
    pagerRef.current?.scrollTo({ x: targetPage * cardWidth, animated: false });
  }, [skipAnimations, cardWidth, rankChanged]);

  useEffect(() => {
    const listenerId = scoreAnim.addListener(({ value }) => {
      setAnimatedScoreValue(Math.round(value));
    });
    return () => scoreAnim.removeListener(listenerId);
  }, [scoreAnim]);

  useEffect(() => {
    if (goalTrackWidth <= 0) return undefined;

    const rankBarWidth = rankTrackWidth > 0 ? rankTrackWidth : goalTrackWidth;
    const goalTargetWidth = goalProgress * goalTrackWidth;
    const rankTargetWidth = Math.max(0, Math.min(1, streak.progress)) * rankBarWidth;

    const startStrengthAnimation = () => {
      if (skipAnimations) {
        scoreAnim.setValue(finalWorkoutScore);
        setAnimatedScoreValue(finalWorkoutScore);
        return;
      }

      const strengthRun = Animated.sequence([
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
      ]);
      strengthAnimRef.current = strengthRun;
      strengthRun.start();
    };

    const scrollToRankPage = (onDone) => {
      if (userHasSwipedRef.current || cardWidth <= 0) {
        onDone?.();
        return;
      }
      setActivePage(1);
      pagerRef.current?.scrollTo({ x: cardWidth, animated: true });
      setTimeout(onDone, 380);
    };

    goalFillAnim.stopAnimation();
    rankFillAnim.stopAnimation();
    scoreAnim.stopAnimation();
    scoreTintAnim.stopAnimation();
    strengthAnimRef.current?.stop?.();

    if (skipAnimations) {
      goalFillAnim.setValue(goalTargetWidth);
      rankFillAnim.setValue(rankTargetWidth);
      scoreAnim.setValue(finalWorkoutScore);
      setAnimatedScoreValue(finalWorkoutScore);
      const targetPage = rankChanged ? 1 : 0;
      setActivePage(targetPage);
      if (cardWidth > 0) {
        pagerRef.current?.scrollTo({ x: targetPage * cardWidth, animated: false });
      }
      return undefined;
    }

    goalFillAnim.setValue(0);
    rankFillAnim.setValue(0);
    scoreAnim.setValue(preWorkoutScore);
    scoreTintAnim.setValue(0);
    setActivePage(0);
    if (cardWidth > 0) {
      pagerRef.current?.scrollTo({ x: 0, animated: false });
    }

    const goalPhase = Animated.sequence([
      Animated.delay(1000),
      Animated.timing(goalFillAnim, {
        toValue: goalTargetWidth,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.delay(500),
    ]);

    goalPhase.start(({ finished }) => {
      if (!finished) return;
      scrollToRankPage(() => {
        Animated.sequence([
          Animated.timing(rankFillAnim, {
            toValue: rankTargetWidth,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.delay(500),
        ]).start(({ finished: rankFinished }) => {
          if (rankFinished) startStrengthAnimation();
        });
      });
    });

    return () => {
      goalPhase.stop();
      strengthAnimRef.current?.stop?.();
    };
  }, [
    goalTrackWidth,
    rankTrackWidth,
    cardWidth,
    goalProgress,
    streak.progress,
    rankChanged,
    preWorkoutScore,
    finalWorkoutScore,
    goalFillAnim,
    rankFillAnim,
    scoreAnim,
    scoreTintAnim,
    skipAnimations,
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
    outputRange: [theme.textPrimary, theme.successBright],
  });

  return (
    <SafeAreaView style={styles.menuHomeShell}>
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <View style={styles.summaryScreenHeader}>
          <Text style={styles.homeSessionTitle}>Summary</Text>
          <View style={styles.summaryStatsBar}>
            <View style={styles.summaryStatCell}>
              <Text style={styles.summaryStatValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.summaryStatLabel}>Time</Text>
            </View>
            <View style={styles.summaryStatCell}>
              <Text style={styles.summaryStatValue}>{totalWeightLiftedLabel}</Text>
              <Text style={styles.summaryStatLabel}>Weight lifted</Text>
            </View>
          </View>
        </View>

        <View style={[styles.homeBodyPanelWrap, { flex: 1 }]}>
          <HomeBodyPanelGlow />
          <ScrollView
            style={styles.homeScreenScroll}
            contentContainerStyle={[
              styles.homeBodyPanel,
              {
                paddingBottom: insets.bottom + 120,
              },
            ]}
            showsVerticalScrollIndicator={false}>
          <SummaryWeekProgressPager
            styles={styles}
            theme={theme}
            cardWidth={cardWidth}
            onCardLayout={handleCardLayout}
            pagerRef={pagerRef}
            activePage={activePage}
            onPageChange={handlePageChange}
            onScrollBeginDrag={handleScrollBeginDrag}
            goalCompleted={goalCompleted}
            goalTarget={goalTarget}
            goalFillAnim={goalFillAnim}
            onGoalTrackLayout={(event) => {
              const width = event?.nativeEvent?.layout?.width ?? 0;
              if (width > 0) {
                setGoalTrackWidth(width);
                setRankTrackWidth((prev) => (prev > 0 ? prev : width));
              }
            }}
            streak={streak}
            rankChanged={rankChanged}
            rankFillAnim={rankFillAnim}
            onRankTrackLayout={(event) => {
              const width = event?.nativeEvent?.layout?.width ?? 0;
              if (width > 0) setRankTrackWidth(width);
            }}
          />

          <View style={styles.summaryStrengthDeltaCard}>
            <Text style={styles.summaryStrengthDeltaTitle}>Strength score</Text>
            <Animated.Text style={[styles.summaryStrengthDeltaValueGreen, { color: animatedStrengthColor }]}>
              {animatedScoreValue}
            </Animated.Text>
            <Text style={styles.summaryStrengthDeltaSubtle}>
              {preWorkoutScore} → {finalWorkoutScore}
            </Text>
          </View>

          <View style={styles.homeMovementSection}>
            <Text style={styles.summaryLoggedSetsHeading}>Logged sets</Text>
            {movementNamesNewestFirst.length === 0 ? (
              <Text style={[styles.emptyText, { color: wt.textSecondary, marginTop: 8 }]}>
                No sets were saved in this workout.
              </Text>
            ) : (
              movementNamesNewestFirst.map((movement) => {
              const movementSets = setsByMovement[movement] || [];
              const exerciseMeta = exerciseLookup[movement?.toLowerCase?.() ?? ''];
              const primaryMuscle = exerciseMeta?.primaryMuscles?.[0];
              const muscleIcon = getHighlightIconSourceForMuscleLabel(primaryMuscle);
              return (
                <View key={movement} style={styles.homeMovementCard}>
                  <View style={styles.homeMovementCardTop}>
                    <View style={styles.homeMovementChipWell}>
                      {muscleIcon ? (
                        <Image source={muscleIcon} style={styles.homeMovementChipIcon} resizeMode="contain" />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dashboardTargetMuscleChipLabel}>{primaryMuscle || 'Movement'}</Text>
                      <Text style={[styles.activeWorkoutExerciseSub, { marginTop: 2, color: wt.textSecondary }]}>
                        {movement}
                      </Text>
                    </View>
                  </View>
                  {movementSets.map((setItem, index) => {
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
                        backgroundColor: theme.chipWellBg,
                        borderColor: theme.chipWellBorder,
                      },
                    ];

                    if (readOnly) {
                      return (
                        <View
                          key={`${movement}-${index}`}
                          style={[
                            styles.logSheetSetListRow,
                            index === movementSets.length - 1
                              ? { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
                              : null,
                          ]}>
                          <Text style={styles.logSheetSetListNumber}>{index + 1}</Text>
                          <View style={styles.logSheetSetListMain}>
                            <View style={styles.logSheetSetListValuesRow}>
                              <View style={styles.logSheetSetListFieldCol}>
                                <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Reps</Text>
                                <View style={valueBoxStyle}>
                                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>
                                    {setItem.reps}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.logSheetSetListAt, { color: wt.textSecondary }]}>@</Text>
                              <View style={styles.logSheetSetListFieldCol}>
                                <Text style={[styles.logSheetSetListFieldLabel, { color: wt.textMuted }]}>Weight</Text>
                                <View style={valueBoxStyle}>
                                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>
                                    {weightDisplay}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <Text style={[styles.logSheetSetListMeta, { color: wt.textMuted }]}>
                              {formatTime(setItem.elapsedSeconds)}
                            </Text>
                          </View>
                        </View>
                      );
                    }

                    const isEditing = editingSetKey === `${movement}::${index}`;
                    const hideWeightWhileEditing =
                      isBodyweightOnlyExercise(movement, exerciseLookup) && Number(setItem.weight) === 0;
                    const editableValueBoxStyle = [
                      styles.logSheetSetListValueBox,
                      {
                        backgroundColor: theme.chipWellBg,
                        borderColor: isEditing ? theme.navAccent : theme.chipWellBorder,
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
                                <View style={editableValueBoxStyle}>
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
                                  style={editableValueBoxStyle}
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
                                <View style={editableValueBoxStyle}>
                                  <Text style={[styles.logSheetSetListValueText, { color: wt.textPrimary }]}>{weightDisplay}</Text>
                                </View>
                              ) : isEditing ? (
                                <View style={editableValueBoxStyle}>
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
                                  style={editableValueBoxStyle}
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
                                  style={[styles.smallActionButton, { backgroundColor: theme.navAccent }]}
                                  onPress={() => saveEditingStoredSet(movement, index)}>
                                  <Text style={[styles.smallActionButtonText, { color: '#FFFFFF' }]}>Save</Text>
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
          </View>

          </ScrollView>
        </View>

        <View
          style={[
            styles.logSheetSaveFooter,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: insets.bottom + 10,
              backgroundColor: theme.homeBodyPanelBg,
              borderTopWidth: 1,
              borderTopColor: theme.borderSubtle,
            },
          ]}>
          <TouchableOpacity style={styles.summaryReturnButton} onPress={onReturnToMenu}>
            <Text style={styles.summaryReturnButtonText}>{returnButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(SummaryScreen);
