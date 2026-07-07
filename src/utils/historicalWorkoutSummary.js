import { computeStrengthScoreSummary } from '../data/strengthScore';
import {
  getSplitWeekWorkoutProgress,
  weeklySplitPlanIsConfigured,
} from '../data/weeklySplitPlanner';
import { computeConsecutiveTrainingWeekStreak } from './consecutiveWeekStreak';

export function getWorkoutsForCalendarDay(workoutHistory, pick) {
  if (!pick || !Array.isArray(workoutHistory)) return [];
  return workoutHistory
    .filter((workoutItem) => {
      if (!workoutItem?.completedAt) return false;
      const t = new Date(workoutItem.completedAt);
      if (Number.isNaN(t.getTime())) return false;
      return (
        t.getFullYear() === pick.y && t.getMonth() === pick.m && t.getDate() === pick.d
      );
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function getMovementNamesNewestFirst(setsByMovement) {
  const names = Object.keys(setsByMovement || {});
  return [...names].sort((a, b) => {
    const setsA = setsByMovement[a] || [];
    const setsB = setsByMovement[b] || [];
    const maxA =
      setsA.length === 0 ? -1 : Math.max(...setsA.map((s) => Number(s.elapsedSeconds) || 0));
    const maxB =
      setsB.length === 0 ? -1 : Math.max(...setsB.map((s) => Number(s.elapsedSeconds) || 0));
    if (maxB !== maxA) return maxB - maxA;
    return a.localeCompare(b);
  });
}

/**
 * Build SummaryScreen props for a past workout as it looked when it was completed.
 */
export function buildHistoricalWorkoutSummaryContext(
  workout,
  workoutHistory,
  weightLogs,
  exerciseLookup,
  weeklySplitPlan,
) {
  if (!workout?.id || !Array.isArray(workoutHistory)) return null;

  const oldestFirst = [...workoutHistory].reverse();
  const workoutIndex = oldestFirst.findIndex((item) => item.id === workout.id);
  if (workoutIndex < 0) return null;

  const historyThroughWorkoutOldestFirst = oldestFirst.slice(0, workoutIndex + 1);
  const historyThroughWorkoutNewestFirst = [...historyThroughWorkoutOldestFirst].reverse();
  const completedAt = new Date(workout.completedAt || Date.now());
  const referenceDate = Number.isNaN(completedAt.getTime()) ? new Date() : completedAt;

  const consecutiveTrainingWeekStreak = computeConsecutiveTrainingWeekStreak(
    historyThroughWorkoutNewestFirst,
  );
  const strengthScoreSummary = computeStrengthScoreSummary(
    historyThroughWorkoutNewestFirst,
    weightLogs,
    exerciseLookup,
    consecutiveTrainingWeekStreak,
    referenceDate,
  );

  const menuWeekGymProgress = weeklySplitPlanIsConfigured(weeklySplitPlan)
    ? getSplitWeekWorkoutProgress(weeklySplitPlan, historyThroughWorkoutNewestFirst, referenceDate)
    : {
        completed: historyThroughWorkoutNewestFirst.filter((item) => {
          if (!item?.completedAt) return false;
          const t = new Date(item.completedAt);
          if (Number.isNaN(t.getTime())) return false;
          const weekStart = new Date(referenceDate);
          weekStart.setDate(referenceDate.getDate() - referenceDate.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return t >= weekStart && t < weekEnd;
        }).length,
        target: 7,
      };

  return {
    elapsedSeconds: workout.elapsedSeconds ?? 0,
    setsByMovement: workout.setsByMovement || {},
    movementNamesNewestFirst: getMovementNamesNewestFirst(workout.setsByMovement || {}),
    workoutHistory: historyThroughWorkoutNewestFirst,
    strengthScoreSummary,
    consecutiveTrainingWeekStreak,
    menuWeekGymProgress,
  };
}
