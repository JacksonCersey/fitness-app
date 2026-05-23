import React, { memo, useMemo } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MenuRankTopBar from '../components/MenuRankTopBar';
import { MenuHomeWeekStrip } from '../components/targetsProgressShared';
import HomeMuscleStatusCard from '../components/HomeMuscleStatusCard';
import PerfectStreakGradientNumber from '../components/PerfectStreakGradientNumber';
import WeeklySplitProgressRing from '../components/WeeklySplitProgressRing';
import {
  getMondayBasedDayIndex,
  getMusclesForSplitDayEntry,
  SPLIT_DAY_TYPE_LABELS,
  weeklySplitPlanIsConfigured,
} from '../data/weeklySplitPlanner';
import { styles } from '../styles';
import { WORKOUT_THEME } from '../theme/workoutTheme';
import { getOrderedMuscleHighlightChips } from '../utils/splitDayHighlightIcons';
import { getHomeMuscleChipLoggedGoal } from '../utils/homeMuscleChipTargets';

function splitDayLineForEntry(day) {
  if (!day) return 'Rest day';
  if (day.type === 'rest') return 'Rest day';
  if (day.type === 'mixed') return 'Mixed day';
  const base = SPLIT_DAY_TYPE_LABELS[day.type] ?? day.type;
  return `${base} day`;
}

function MenuHomeTabScreen({
  mainTabBottomReserve,
  menuWeekGymProgress,
  consecutiveTrainingWeekStreak,
  consecutivePerfectWeekStreak,
  profileName,
  weeklyStreakDays,
  weeklySplitPlan,
  weeklySubcategorySetCounts,
  weeklyWorkoutsLoggedCount,
  lastWorkoutSummary,
  workoutHistory,
  exerciseLookup,
  onOpenProfile,
  onOpenSplitPlannerFromHome,
}) {
  const wt = WORKOUT_THEME;
  const { splitConfigured, dayLine, targetMuscleChips } = useMemo(() => {
    const configured = weeklySplitPlanIsConfigured(weeklySplitPlan);
    if (!configured) {
      return { splitConfigured: false, dayLine: null, targetMuscleChips: [] };
    }
    const idx = getMondayBasedDayIndex();
    const day = weeklySplitPlan.days[idx];
    const muscles = getMusclesForSplitDayEntry(day);
    return {
      splitConfigured: true,
      dayLine: splitDayLineForEntry(day),
      targetMuscleChips: getOrderedMuscleHighlightChips(muscles),
    };
  }, [weeklySplitPlan]);

  return (
    <View style={styles.menuBody}>
      <View style={styles.menuGradientTopGlow} pointerEvents="none" />
      <View style={styles.menuGradientBottomGlow} pointerEvents="none" />

      <MenuRankTopBar
        consecutiveTrainingWeekStreak={consecutiveTrainingWeekStreak}
        onOpenProfile={onOpenProfile}
      />

      <ScrollView
        style={styles.dashboardHomeScroll}
        contentContainerStyle={[
          styles.dashboardHomeScrollContent,
          { paddingTop: 8, paddingBottom: mainTabBottomReserve + 12 },
        ]}
        showsVerticalScrollIndicator={false}>
        <MenuHomeWeekStrip weeklySplitPlan={weeklySplitPlan} weeklyStreakDays={weeklyStreakDays} />

        <View style={styles.dashboardGreetingBlock}>
          <Text style={styles.menuGreetingText}>
            Hi{profileName ? `, ${profileName}` : ''}
          </Text>
          {splitConfigured && dayLine ? (
            <>
              <Text style={styles.dashboardSplitDayLine}>{dayLine}</Text>
              {targetMuscleChips.length > 0 ? (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.dashboardTargetMusclesScroll}
                  contentContainerStyle={styles.dashboardTargetMusclesScrollContent}
                  accessibilityLabel="Muscle groups targeted today">
                  {targetMuscleChips.map((chip) => {
                    const ratio = getHomeMuscleChipLoggedGoal(chip.id, weeklySubcategorySetCounts);
                    return (
                      <View key={chip.id} style={styles.dashboardTargetMuscleChip}>
                        <View style={styles.dashboardTargetMuscleIconWell}>
                          <Image source={chip.source} style={styles.dashboardTargetMuscleIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.dashboardTargetMuscleTextCol}>
                          <Text style={styles.dashboardTargetMuscleChipLabel}>{chip.groupLabel}</Text>
                          {ratio ? (
                            <View
                              style={[
                                styles.targetsSubcategoryPill,
                                {
                                  marginTop: 6,
                                  alignSelf: 'flex-start',
                                  backgroundColor: wt.splitModalInnerBg,
                                  borderColor: wt.inputBorder,
                                },
                              ]}
                              accessibilityLabel={`${ratio.done} of ${ratio.target} sets this week`}>
                              <Text style={[styles.targetsSubcategorySets, { color: wt.textPrimary }]}>
                                {ratio.done}
                              </Text>
                              <Text style={[styles.targetsSubcategoryTargetMuted, { color: wt.textMuted }]}>
                                {' '}
                                / {ratio.target}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}
            </>
          ) : (
            <TouchableOpacity onPress={onOpenSplitPlannerFromHome} accessibilityRole="button">
              <Text style={styles.dashboardEditSplitHint}>edit split?</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dashboardWeekProgressCard}>
          <Text style={styles.dashboardWeekProgressTitle}>This week in the gym</Text>
          <View style={styles.dashboardWeekProgressRow}>
            <View style={styles.dashboardWeekProgressRingCol}>
              <WeeklySplitProgressRing
                completed={menuWeekGymProgress.completed}
                target={menuWeekGymProgress.target}
                trackColor="rgba(255, 255, 255, 0.14)"
                progressColor={wt.primaryButtonBg}
                centerTextColor={wt.textPrimary}
                isComplete={
                  menuWeekGymProgress.target > 0 &&
                  menuWeekGymProgress.completed >= menuWeekGymProgress.target
                }
              />
            </View>
            <View style={styles.dashboardWeekProgressStreakCol}>
              <View style={styles.dashboardWeekProgressStreakStack}>
                <View style={styles.dashboardWeekProgressStreakSubbox}>
                  <Image
                    source={require('../../assets/images/streaklogo.png')}
                    style={styles.dashboardWeekProgressStreakIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.dashboardWeekProgressStreakTextBlock}>
                    <Text style={styles.dashboardWeekProgressStreakLine}>
                      <Text
                        style={
                          consecutiveTrainingWeekStreak > 0
                            ? styles.dashboardWeekProgressStreakNumber
                            : styles.dashboardWeekProgressStreakNumberInactive
                        }>
                        {consecutiveTrainingWeekStreak}
                      </Text>
                      <Text style={styles.dashboardWeekProgressStreakWords}>
                        {consecutiveTrainingWeekStreak === 1 ? ' week streak' : ' weeks streak'}
                      </Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.dashboardWeekProgressStreakSubbox}>
                  <Image
                    source={require('../../assets/images/perfectstreaklogo.png')}
                    style={[
                      styles.dashboardWeekProgressStreakIcon,
                      consecutivePerfectWeekStreak === 0 && styles.dashboardWeekProgressPerfectStreakIconZero,
                    ]}
                    resizeMode="contain"
                  />
                  <View style={styles.dashboardWeekProgressStreakTextBlock}>
                    {consecutivePerfectWeekStreak > 0 ? (
                      <PerfectStreakGradientNumber
                        value={consecutivePerfectWeekStreak}
                        suffix={
                          consecutivePerfectWeekStreak === 1 ? ' week perfect' : ' weeks perfect'
                        }
                      />
                    ) : (
                      <Text style={styles.dashboardWeekProgressStreakLine}>
                        <Text style={styles.dashboardWeekProgressPerfectStreakZeroDigit}>
                          {consecutivePerfectWeekStreak}
                        </Text>
                        <Text style={styles.dashboardWeekProgressPerfectStreakZeroLabel}>
                          {consecutivePerfectWeekStreak === 1 ? ' week perfect' : ' weeks perfect'}
                        </Text>
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <HomeMuscleStatusCard workoutHistory={workoutHistory} exerciseLookup={exerciseLookup} />

        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardCardTitle}>Recent progress</Text>
          {lastWorkoutSummary ? (
            <>
              <Text style={styles.dashboardCardStat}>{lastWorkoutSummary.titleLine}</Text>
              <Text style={styles.dashboardCardBody}>{lastWorkoutSummary.detailLine}</Text>
            </>
          ) : (
            <Text style={styles.dashboardCardBody}>
              No workouts logged yet. Use the + button below to record your first session.
            </Text>
          )}
        </View>

        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardCardTitle}>Streaks</Text>
          <Text style={styles.dashboardCardStat}>{weeklyWorkoutsLoggedCount} workouts this week</Text>
          <Text style={styles.dashboardCardBody}>
            Days with a flame icon in the strip above had a completed workout. Keep the chain going.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default memo(MenuHomeTabScreen);
