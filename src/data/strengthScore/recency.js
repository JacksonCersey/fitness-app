/**
 * Recency decay for workout contributions (days since workout).
 * last 30 days = 100%, 31–90 = 90%, 91–180 = 75%, older = 60%
 */

/**
 * @param {Date} workoutDate
 * @param {Date} [referenceDate]
 * @returns {number} multiplier in (0, 1]
 */
export function getRecencyMultiplier(workoutDate, referenceDate = new Date()) {
  const ref = referenceDate.getTime();
  const t = workoutDate.getTime();
  if (Number.isNaN(t) || Number.isNaN(ref)) return 0.6;
  const days = Math.max(0, (ref - t) / (24 * 60 * 60 * 1000));

  if (days <= 30) return 1.0;
  if (days <= 90) return 0.9;
  if (days <= 180) return 0.75;
  return 0.6;
}

/**
 * @param {number} rawScore
 * @param {Date} workoutDate
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export function applyRecencyToWorkoutScore(rawScore, workoutDate, referenceDate = new Date()) {
  return rawScore * getRecencyMultiplier(workoutDate, referenceDate);
}
