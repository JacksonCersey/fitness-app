import {
  getMondayBasedDayIndex,
  getMusclesForSplitDayEntry,
  normalizeWeeklySplitPlan,
  SPLIT_DAY_TYPE_LABELS,
} from '../data/weeklySplitPlanner';
import { resolveWeekPlanSourceIndex } from '../data/weekPlanDayOverrides';
import { buildMovementCatalog, sortMovementCatalogRows } from './movementCatalog';

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {Date} date */
export function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** @param {Date} a @param {Date} b */
export function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** @param {Date} date */
export function localDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Build a contiguous date range centered on `anchor` for horizontal pickers.
 * @param {Date} anchor
 * @param {number} [daysBefore]
 * @param {number} [daysAfter]
 */
export function buildDateRangeAround(anchor, daysBefore = 90, daysAfter = 90) {
  const center = startOfLocalDay(anchor);
  const out = [];
  for (let offset = -daysBefore; offset <= daysAfter; offset += 1) {
    const d = new Date(center.getTime() + offset * DAY_MS);
    out.push(d);
  }
  return out;
}

/**
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] } | null | undefined} plan
 * @param {Date} date
 */
/**
 * Split day entry for a calendar date.
 * Optional `weekPlanDayOverrides` remaps this week only (home Swap Workout).
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] } | null | undefined} plan
 * @param {Date} date
 * @param {{ weekKey?: string; daySourceByPlanIndex?: number[] } | null | undefined} [weekPlanDayOverrides]
 */
export function getSplitEntryForDate(plan, date, weekPlanDayOverrides = null) {
  const normalized = normalizeWeeklySplitPlan(plan);
  const planIndex = getMondayBasedDayIndex(date);
  const sourceIndex = resolveWeekPlanSourceIndex(weekPlanDayOverrides, date, planIndex);
  return normalized.days[sourceIndex] ?? { type: 'rest', mixedMuscles: [] };
}

/** @param {Date} date @param {Date} [referenceToday] */
export function compareLocalDay(date, referenceToday = new Date()) {
  return startOfLocalDay(date).getTime() - startOfLocalDay(referenceToday).getTime();
}

/** @param {Date} date @param {Date} [referenceToday] */
export function isTodayLocalDay(date, referenceToday = new Date()) {
  return compareLocalDay(date, referenceToday) === 0;
}

/** @param {Date} date @param {Date} [referenceToday] */
export function isFutureLocalDay(date, referenceToday = new Date()) {
  return compareLocalDay(date, referenceToday) > 0;
}

/**
 * Whether a level-select circle uses full split accent color.
 * Today and future training days: yes. Past: only if a workout was logged (missed days stay grey).
 * @param {Date} date
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceToday]
 */
export function shouldLevelCircleUseAccentColor(date, workoutHistory, referenceToday = new Date()) {
  if (isTodayLocalDay(date, referenceToday)) return true;
  if (isFutureLocalDay(date, referenceToday)) return true;
  return dateHasLoggedWorkout(workoutHistory, date);
}

/**
 * @param {unknown[]} workoutHistory
 * @param {Date} date
 */
export function dateHasLoggedWorkout(workoutHistory, date) {
  const key = localDayKey(date);
  if (!Array.isArray(workoutHistory)) return false;
  for (let i = 0; i < workoutHistory.length; i += 1) {
    const w = workoutHistory[i];
    if (!w?.completedAt) continue;
    const d = new Date(w.completedAt);
    if (Number.isNaN(d.getTime())) continue;
    if (localDayKey(d) === key) return true;
  }
  return false;
}

/**
 * Completed workouts on a calendar day, newest first.
 * @param {unknown[]} workoutHistory
 * @param {Date} date
 */
export function getWorkoutsForLocalDay(workoutHistory, date) {
  const key = localDayKey(date);
  if (!Array.isArray(workoutHistory)) return [];
  return workoutHistory
    .filter((workoutItem) => {
      if (!workoutItem?.completedAt) return false;
      const completed = new Date(workoutItem.completedAt);
      if (Number.isNaN(completed.getTime())) return false;
      return localDayKey(completed) === key;
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

/**
 * Count logged workouts whose split type on that calendar day matches `splitType`.
 * Uses the current weekly split plan to classify each workout date.
 * @param {unknown[]} workoutHistory
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] } | null | undefined} plan
 * @param {string} splitType
 */
export function countSplitTypeSessions(workoutHistory, plan, splitType) {
  if (!Array.isArray(workoutHistory) || !splitType || splitType === 'rest') return 0;
  let count = 0;
  for (let i = 0; i < workoutHistory.length; i += 1) {
    const w = workoutHistory[i];
    if (!w?.completedAt) continue;
    const d = new Date(w.completedAt);
    if (Number.isNaN(d.getTime())) continue;
    const entry = getSplitEntryForDate(plan, d);
    if (entry.type === splitType) count += 1;
  }
  return count;
}

/**
 * Past split day with no logged workout (shown grey in level select).
 * @param {Date} date
 * @param {{ type: string; mixedMuscles?: string[] }} dayEntry
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceToday]
 */
export function isSkippedSplitDay(date, dayEntry, workoutHistory, referenceToday = new Date()) {
  if (!dayEntry || dayEntry.type === 'rest') return false;
  if (isTodayLocalDay(date, referenceToday)) return false;
  if (isFutureLocalDay(date, referenceToday)) return false;
  return !dateHasLoggedWorkout(workoutHistory, date);
}

/**
 * Title for gamified level select, e.g. "Push Day 12" or "Push Day - Skipped".
 * @param {{ type: string; mixedMuscles?: string[] }} dayEntry
 * @param {unknown[]} workoutHistory
 * @param {{ days: unknown[] } | null | undefined} plan
 * @param {Date} [date] Selected calendar day (needed for skipped label).
 */
export function getSplitDaySessionTitle(dayEntry, workoutHistory, plan, date) {
  if (!dayEntry || dayEntry.type === 'rest') return 'Rest Day';
  const label = SPLIT_DAY_TYPE_LABELS[dayEntry.type] ?? dayEntry.type;
  if (date && isSkippedSplitDay(date, dayEntry, workoutHistory)) {
    return `${label} Day - Skipped`;
  }
  const count = countSplitTypeSessions(workoutHistory, plan, dayEntry.type);
  return `${label} Day ${Math.max(1, count)}`;
}

/**
 * Prioritize movements for the selected split day; rest days fall back to recency.
 * @param {unknown[]} workoutHistory
 * @param {{ type: string; mixedMuscles?: string[] }} dayEntry
 * @param {Record<string, unknown>} exerciseLookup
 * @param {number} [limit]
 */
export function prioritizeMovementsForSplitDay(
  workoutHistory,
  dayEntry,
  exerciseLookup,
  limit = 10,
) {
  const catalog = buildMovementCatalog(workoutHistory);
  const logged = catalog.filter((row) => row.isLogged && row.summary);
  if (logged.length === 0) return [];

  const targetMuscles = new Set(getMusclesForSplitDayEntry(dayEntry));
  const isRest = !dayEntry || dayEntry.type === 'rest' || targetMuscles.size === 0;

  const scored = logged.map((row) => {
    const meta = exerciseLookup?.[row.movement.trim().toLowerCase()];
    const prim = Array.isArray(meta?.primaryMuscles) ? meta.primaryMuscles : [];
    const sec = Array.isArray(meta?.secondaryMuscles) ? meta.secondaryMuscles : [];
    const muscles = [...prim, ...sec, row.primaryMuscle];
    let muscleScore = 0;
    if (!isRest) {
      for (let i = 0; i < muscles.length; i += 1) {
        if (targetMuscles.has(muscles[i])) muscleScore += 2;
      }
    }
    const recentMs = row.summary?.recentSets?.[0]?.completedAtISO
      ? new Date(row.summary.recentSets[0].completedAtISO).getTime()
      : 0;
    return { row, muscleScore, recentMs };
  });

  scored.sort((a, b) => {
    if (b.muscleScore !== a.muscleScore) return b.muscleScore - a.muscleScore;
    return b.recentMs - a.recentMs;
  });

  return scored.slice(0, limit).map((s) => s.row);
}

/** Short weekday label e.g. THU */
export function formatWeekdayShort(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
}

/** @param {Date[]} dates @param {Date} target */
export function indexOfSameDay(dates, target) {
  for (let i = 0; i < dates.length; i += 1) {
    if (isSameLocalDay(dates[i], target)) return i;
  }
  return -1;
}

export { sortMovementCatalogRows };
