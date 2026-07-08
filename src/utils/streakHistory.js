import {
  calendarDateForPlanIndexInSunWeek,
  isSplitPlanTrainingDay,
  weeklySplitPlanIsConfigured,
} from '../data/weeklySplitPlanner';
import { STREAK_RANKS, getStreakRankProgress } from '../data/streakRanks';
import { getSundayStartOfWeekLocal } from './weeklyPplSetTotals';
import { isSplitWeekPerfectThroughDate } from './consecutivePerfectWeekStreak';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
 * @returns {Set<number>}
 */
function collectWorkoutWeekStarts(workoutHistory) {
  const weekStarts = new Set();
  if (!Array.isArray(workoutHistory)) return weekStarts;
  for (let i = 0; i < workoutHistory.length; i += 1) {
    const w = workoutHistory[i];
    if (!w || typeof w !== 'object' || !w.completedAt) continue;
    const t = new Date(w.completedAt);
    if (Number.isNaN(t.getTime())) continue;
    weekStarts.add(getSundayStartOfWeekLocal(t).getTime());
  }
  return weekStarts;
}

/**
 * @param {unknown[]} workoutHistory
 * @returns {number | null}
 */
function earliestWorkoutWeekStart(workoutHistory) {
  const set = collectWorkoutWeekStarts(workoutHistory);
  if (set.size === 0) return null;
  return Math.min(...set);
}

/**
 * Consecutive training-week streak ending at `weekStartSunday` (inclusive),
 * counting backward through weeks that had ≥1 workout.
 * @param {Set<number>} workoutWeekStarts
 * @param {number} weekStartTs
 * @returns {number}
 */
function trainingStreakEndingAt(workoutWeekStarts, weekStartTs) {
  let streak = 0;
  let cur = weekStartTs;
  while (workoutWeekStarts.has(cur)) {
    streak += 1;
    cur -= WEEK_MS;
  }
  return streak;
}

/**
 * Format a short month/day (or month/day/yy) label for chart points.
 * @param {Date} d
 * @param {boolean} multiYear
 */
function formatWeekLabel(d, multiYear) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return multiYear ? `${m}/${day}/${String(d.getFullYear()).slice(-2)}` : `${m}/${day}`;
}

/**
 * Training-week streak length at the end of each Sunday-start week from first workout through now.
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {Array<{ value: number; timestamp: number; label: string }>}
 */
export function buildTrainingStreakHistorySeries(workoutHistory, referenceDate = new Date()) {
  const workoutWeekStarts = collectWorkoutWeekStarts(workoutHistory);
  const first = earliestWorkoutWeekStart(workoutHistory);
  if (first == null) return [];

  const currentSunday = getSundayStartOfWeekLocal(referenceDate).getTime();
  const years = new Set();
  const points = [];

  for (let ts = first; ts <= currentSunday; ts += WEEK_MS) {
    const value = trainingStreakEndingAt(workoutWeekStarts, ts);
    const d = new Date(ts);
    years.add(d.getFullYear());
    points.push({ value, timestamp: ts, label: '' });
  }

  const multiYear = years.size > 1;
  return points.map((point) => ({
    ...point,
    label: formatWeekLabel(new Date(point.timestamp), multiYear),
  }));
}

/**
 * Perfect-week streak length at the end of each closed (or current capped) week.
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {Array<{ value: number; timestamp: number; label: string }>}
 */
export function buildPerfectStreakHistorySeries(plan, workoutHistory, referenceDate = new Date()) {
  if (!weeklySplitPlanIsConfigured(plan)) return [];
  const first = earliestWorkoutWeekStart(workoutHistory);
  if (first == null) return [];

  const ref = startOfDay(referenceDate);
  const currentSunday = getSundayStartOfWeekLocal(referenceDate);
  const currentSundayTs = startOfDay(currentSunday).getTime();
  const years = new Set();
  const points = [];

  for (let ts = first; ts <= currentSundayTs; ts += WEEK_MS) {
    const walk = new Date(ts);
    const isCurrent = ts === currentSundayTs;
    const weekSaturday = new Date(walk);
    weekSaturday.setDate(walk.getDate() + 6);
    weekSaturday.setHours(0, 0, 0, 0);
    const cap = isCurrent ? ref : weekSaturday;

    let streak = 0;
    let back = new Date(walk);
    while (streak < 520) {
      const backDay = startOfDay(back);
      const backIsCurrent = backDay.getTime() === currentSundayTs;
      const backSaturday = new Date(back);
      backSaturday.setDate(back.getDate() + 6);
      backSaturday.setHours(0, 0, 0, 0);
      const backCap = backIsCurrent ? ref : backSaturday;
      if (!isSplitWeekPerfectThroughDate(plan, workoutHistory, back, backCap)) break;
      streak += 1;
      back.setDate(back.getDate() - 7);
    }

    years.add(walk.getFullYear());
    points.push({ value: streak, timestamp: ts, label: '' });
  }

  const multiYear = years.size > 1;
  return points.map((point) => ({
    ...point,
    label: formatWeekLabel(new Date(point.timestamp), multiYear),
  }));
}

/**
 * Longest-ever consecutive run of perfect split weeks.
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export function computeBestPerfectWeekStreak(plan, workoutHistory, referenceDate = new Date()) {
  if (!weeklySplitPlanIsConfigured(plan)) return 0;
  const first = earliestWorkoutWeekStart(workoutHistory);
  if (first == null) return 0;

  const ref = startOfDay(referenceDate);
  const currentSunday = getSundayStartOfWeekLocal(referenceDate);
  const currentSundayTs = startOfDay(currentSunday).getTime();

  let best = 0;
  let current = 0;

  for (let ts = first; ts <= currentSundayTs; ts += WEEK_MS) {
    const walk = new Date(ts);
    const isCurrent = ts === currentSundayTs;
    const weekSaturday = new Date(walk);
    weekSaturday.setDate(walk.getDate() + 6);
    weekSaturday.setHours(0, 0, 0, 0);
    const cap = isCurrent ? ref : weekSaturday;

    if (isSplitWeekPerfectThroughDate(plan, workoutHistory, walk, cap)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

/**
 * Share of Sunday-start weeks (from first workout through current) with ≥1 workout.
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {{ hit: number; total: number; rate: number | null }}
 */
export function computeWeeksHitRate(workoutHistory, referenceDate = new Date()) {
  const workoutWeekStarts = collectWorkoutWeekStarts(workoutHistory);
  const first = earliestWorkoutWeekStart(workoutHistory);
  if (first == null) return { hit: 0, total: 0, rate: null };

  const currentSunday = getSundayStartOfWeekLocal(referenceDate).getTime();
  let total = 0;
  let hit = 0;
  for (let ts = first; ts <= currentSunday; ts += WEEK_MS) {
    total += 1;
    if (workoutWeekStarts.has(ts)) hit += 1;
  }
  return { hit, total, rate: total > 0 ? hit / total : null };
}

/**
 * Share of closed weeks (plus current if perfect-so-far) that were perfect under the current split.
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {{ perfect: number; total: number; rate: number | null }}
 */
export function computePerfectWeekRate(plan, workoutHistory, referenceDate = new Date()) {
  if (!weeklySplitPlanIsConfigured(plan)) {
    return { perfect: 0, total: 0, rate: null };
  }
  const first = earliestWorkoutWeekStart(workoutHistory);
  if (first == null) return { perfect: 0, total: 0, rate: null };

  const ref = startOfDay(referenceDate);
  const currentSunday = getSundayStartOfWeekLocal(referenceDate);
  const currentSundayTs = startOfDay(currentSunday).getTime();
  let total = 0;
  let perfect = 0;

  for (let ts = first; ts <= currentSundayTs; ts += WEEK_MS) {
    const walk = new Date(ts);
    const isCurrent = ts === currentSundayTs;
    const weekSaturday = new Date(walk);
    weekSaturday.setDate(walk.getDate() + 6);
    weekSaturday.setHours(0, 0, 0, 0);
    const cap = isCurrent ? ref : weekSaturday;

    // Skip counting current week if it can't be perfect yet (training day remaining).
    if (isCurrent) {
      let hasFutureTraining = false;
      if (plan.days) {
        for (let i = 0; i < 7; i += 1) {
          if (!isSplitPlanTrainingDay(plan.days[i])) continue;
          const dayDate = calendarDateForPlanIndexInSunWeek(walk, i);
          if (dayDate.getTime() > ref.getTime()) {
            hasFutureTraining = true;
            break;
          }
        }
      }
      if (hasFutureTraining) continue;
    }

    total += 1;
    if (isSplitWeekPerfectThroughDate(plan, workoutHistory, walk, cap)) perfect += 1;
  }

  return { perfect, total, rate: total > 0 ? perfect / total : null };
}

/**
 * Week-by-week streak-rank index (0 = Unranked, 1 = Bronze … 7 = Platinum).
 * Uses the training streak at each Sunday week end.
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {Array<{
 *   value: number;
 *   timestamp: number;
 *   label: string;
 *   rankId: string;
 *   rankLabel: string;
 *   accent: string;
 * }>}
 */
export function buildRankHistorySeries(workoutHistory, referenceDate = new Date()) {
  const streakSeries = buildTrainingStreakHistorySeries(workoutHistory, referenceDate);
  return streakSeries.map((point) => {
    const progress = getStreakRankProgress(point.value);
    const tierIndex = progress.currentRank
      ? STREAK_RANKS.findIndex((tier) => tier.id === progress.currentRank.id) + 1
      : 0;
    return {
      value: Math.max(0, tierIndex),
      timestamp: point.timestamp,
      label: point.label,
      rankId: progress.displayRank.id,
      rankLabel: progress.displayRank.label,
      accent: progress.displayRank.accent,
    };
  });
}

/**
 * Rank milestones relative to the user's best training streak (highest tier ever attained).
 * @param {number} bestStreakWeeks
 * @param {number} currentStreakWeeks
 * @returns {Array<{
 *   id: string;
 *   label: string;
 *   weeksRequired: number;
 *   image: number;
 *   accent: string;
 *   attained: boolean;
 *   isCurrent: boolean;
 *   isBest: boolean;
 * }>}
 */
export function buildRankHistoryTimeline(bestStreakWeeks, currentStreakWeeks) {
  const best = Math.max(0, Math.floor(Number(bestStreakWeeks) || 0));
  const current = Math.max(0, Math.floor(Number(currentStreakWeeks) || 0));
  const bestRank = getStreakRankProgress(best);
  const currentRank = getStreakRankProgress(current);

  return STREAK_RANKS.map((tier) => {
    const attained = best >= tier.weeksRequired;
    return {
      id: tier.id,
      label: tier.label,
      weeksRequired: tier.weeksRequired,
      image: tier.image,
      accent: tier.accent,
      attained,
      isCurrent: currentRank.currentRank?.id === tier.id,
      isBest: bestRank.currentRank?.id === tier.id,
    };
  });
}
