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
