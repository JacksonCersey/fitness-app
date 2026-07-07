import { getSundayStartOfWeekLocal } from './weeklyPplSetTotals';

/**
 * Sunday-start calendar weeks (matches home weekday strip).
 * Streak counts consecutive weeks with ≥1 logged workout; if the current week has none yet,
 * counting starts from the previous week so an empty early-week does not erase the streak.
 */

export { getSundayStartOfWeekLocal };

/**
 * @param {unknown[]} workoutHistory
 * @param {Date} weekStartSunday
 * @returns {boolean}
 */
function weekHasAnyWorkout(workoutHistory, weekStartSunday) {
  const start = weekStartSunday.getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
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
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export function computeConsecutiveTrainingWeekStreak(workoutHistory, referenceDate = new Date()) {
  let weekStart = getSundayStartOfWeekLocal(referenceDate);
  if (!weekHasAnyWorkout(workoutHistory, weekStart)) {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() - 7);
  }
  let streak = 0;
  const cur = new Date(weekStart);
  while (weekHasAnyWorkout(workoutHistory, cur)) {
    streak += 1;
    cur.setDate(cur.getDate() - 7);
  }
  return streak;
}

/**
 * Whether the user has logged at least one workout in the current Sunday-start week.
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {boolean}
 */
export function hasLoggedWorkoutInCurrentWeek(workoutHistory, referenceDate = new Date()) {
  const weekStart = getSundayStartOfWeekLocal(referenceDate);
  return weekHasAnyWorkout(workoutHistory, weekStart);
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Longest-ever run of consecutive Sunday-start weeks with at least one logged workout.
 * @param {unknown[]} workoutHistory
 * @returns {number}
 */
export function computeBestTrainingWeekStreak(workoutHistory) {
  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) return 0;

  const weekStarts = new Set();
  for (let i = 0; i < workoutHistory.length; i += 1) {
    const w = workoutHistory[i];
    if (!w || typeof w !== 'object' || !w.completedAt) continue;
    const t = new Date(w.completedAt);
    if (Number.isNaN(t.getTime())) continue;
    weekStarts.add(getSundayStartOfWeekLocal(t).getTime());
  }

  const sorted = [...weekStarts].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] - sorted[i - 1] === WEEK_MS) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}
