import {
  calendarDateForPlanIndexInSunWeek,
  isSplitPlanTrainingDay,
  weeklySplitPlanIsConfigured,
} from '../data/weeklySplitPlanner';
import { getSundayStartOfWeekLocal } from './weeklyPplSetTotals';
import { hasLoggedWorkoutInCurrentWeek } from './consecutiveWeekStreak';

/**
 * @param {Date} d
 * @returns {Date}
 */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * @param {unknown[]} workoutHistory
 * @param {Date} dayStartLocal Midnight local start of calendar day.
 * @returns {boolean}
 */
function calendarDayHasWorkout(workoutHistory, dayStartLocal) {
  const start = dayStartLocal.getTime();
  const end = start + 24 * 60 * 60 * 1000;
  if (!Array.isArray(workoutHistory)) return false;
  for (let i = 0; i < workoutHistory.length; i += 1) {
    const w = workoutHistory[i];
    if (!w || typeof w !== 'object' || !w.completedAt) continue;
    const t = new Date(w.completedAt).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= start && t < end) return true;
  }
  return false;
}

/**
 * A “perfect” week (through `capDay` inclusive): every split training day in this Sun-start week
 * that falls on or before `capDay` has a logged workout, and there is no training day after `capDay`
 * in the same week (otherwise the week is not yet fully satisfied).
 *
 * For a **closed** past week, pass `capDay` = that week’s Saturday. For the **current** week, pass today.
 *
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} weekStartSunday
 * @param {Date} capDay Inclusive calendar day cap (usually start-of-day is enough for comparison).
 * @returns {boolean}
 */
export function isSplitWeekPerfectThroughDate(plan, workoutHistory, weekStartSunday, capDay) {
  if (!weeklySplitPlanIsConfigured(plan) || !plan.days) return false;
  const cap = startOfDay(capDay);
  let sawTraining = false;
  for (let i = 0; i < 7; i += 1) {
    const entry = plan.days[i];
    if (!isSplitPlanTrainingDay(entry)) continue;
    sawTraining = true;
    const dayDate = calendarDateForPlanIndexInSunWeek(weekStartSunday, i);
    if (dayDate.getTime() > cap.getTime()) return false;
    if (!calendarDayHasWorkout(workoutHistory, dayDate)) return false;
  }
  return sawTraining;
}

/**
 * Consecutive Sun–Sat weeks where the user hit **every** scheduled split training day (current split
 * applied to each week). Uses the same “skip incomplete current week” idea as the basic week streak.
 *
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export function computeConsecutivePerfectWeekStreak(plan, workoutHistory, referenceDate = new Date()) {
  if (!weeklySplitPlanIsConfigured(plan)) return 0;

  const ref = startOfDay(referenceDate);
  const currentSunday = getSundayStartOfWeekLocal(referenceDate);

  let walk = new Date(currentSunday);
  if (!isSplitWeekPerfectThroughDate(plan, workoutHistory, walk, ref)) {
    walk.setDate(walk.getDate() - 7);
  }

  let streak = 0;
  const curSunTs = startOfDay(currentSunday).getTime();

  while (streak < 520) {
    const walkDay = startOfDay(walk);
    const isCurrent = walkDay.getTime() === curSunTs;
    const weekSaturday = new Date(walk);
    weekSaturday.setDate(walk.getDate() + 6);
    weekSaturday.setHours(0, 0, 0, 0);
    const cap = isCurrent ? ref : weekSaturday;

    if (!isSplitWeekPerfectThroughDate(plan, workoutHistory, walk, cap)) break;
    streak += 1;
    walk.setDate(walk.getDate() - 7);
  }

  return streak;
}

/**
 * Carousel state for the current Sun–Sat week: day-by-day progress (7 steps) and whether
 * a past split training day was missed (inactive).
 *
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {{ completedDays: number; progress: number; isActive: boolean }}
 */
export function getCurrentWeekPerfectCarouselState(plan, workoutHistory, referenceDate = new Date()) {
  if (!weeklySplitPlanIsConfigured(plan) || !plan.days) {
    return { completedDays: 0, progress: 0, isActive: false };
  }

  const today = startOfDay(referenceDate);
  const weekStartSunday = getSundayStartOfWeekLocal(referenceDate);
  let completedDays = 0;
  let skipped = false;

  for (let i = 0; i < 7; i += 1) {
    const entry = plan.days[i];
    const dayDate = calendarDateForPlanIndexInSunWeek(weekStartSunday, i);
    if (dayDate.getTime() > today.getTime()) continue;

    if (!isSplitPlanTrainingDay(entry)) {
      completedDays += 1;
      continue;
    }

    if (calendarDayHasWorkout(workoutHistory, dayDate)) {
      completedDays += 1;
    } else if (dayDate.getTime() < today.getTime()) {
      skipped = true;
    }
  }

  const hasWorkoutThisWeek = hasLoggedWorkoutInCurrentWeek(workoutHistory, referenceDate);
  const isActive = !skipped && hasWorkoutThisWeek;

  return {
    completedDays: hasWorkoutThisWeek ? completedDays : 0,
    progress: hasWorkoutThisWeek ? completedDays / 7 : 0,
    isActive,
  };
}
