/**
 * Workout helpers for history summaries and charts.
 *
 * Volume = sum over all sets of (weight × reps) in lb.
 */

/** Total training volume for one logged workout (lb). */
export function getWorkoutVolumeLb(workout) {
  let total = 0;
  const map = workout?.setsByMovement;
  if (!map || typeof map !== 'object') return 0;

  Object.values(map).forEach((sets) => {
    if (!Array.isArray(sets)) return;
    sets.forEach((setItem) => {
      const w = Number(setItem?.weight ?? 0);
      const r = Number(setItem?.reps ?? 0);
      if (!Number.isNaN(w) && !Number.isNaN(r)) total += Math.max(0, w) * Math.max(0, r);
    });
  });
  return total;
}

/** Number of calendar days in a month (monthIndex 0–11). */
export function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Builds per-day volumes for workouts completed in `now`'s month (local timezone).
 *
 * @param {object[]} workouts
 * @param {Date} [now]
 * @returns {{ year: number, monthIndex: number, daysInMonth: number, byDay: number[], maxVolume: number, monthTotal: number }}
 */
export function buildMonthlyDailyVolume(workouts, now = new Date()) {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const byDay = Array.from({ length: daysInMonth }, () => 0);

  if (Array.isArray(workouts)) {
    workouts.forEach((workout) => {
      if (!workout?.completedAt) return;
      const d = new Date(workout.completedAt);
      if (
        Number.isNaN(d.getTime()) ||
        d.getFullYear() !== year ||
        d.getMonth() !== monthIndex
      )
        return;
      const dom = d.getDate();
      if (dom >= 1 && dom <= daysInMonth) byDay[dom - 1] += getWorkoutVolumeLb(workout);
    });
  }

  const monthTotal = byDay.reduce((acc, x) => acc + x, 0);
  const maxVolume = Math.max(...byDay, 1);

  return { year, monthIndex, daysInMonth, byDay, maxVolume, monthTotal };
}

export function countWorkoutsInMonth(workouts, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (!Array.isArray(workouts)) return 0;
  return workouts.filter((workout) => {
    if (!workout?.completedAt) return false;
    const d = new Date(workout.completedAt);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m;
  }).length;
}

/**
 * Builds per-month volume totals for one selected year.
 *
 * @param {object[]} workouts
 * @param {number} year
 * @returns {{ year: number, byMonth: number[], maxVolume: number, yearTotal: number }}
 */
export function buildYearlyMonthlyVolume(workouts, year) {
  const byMonth = Array.from({ length: 12 }, () => 0);

  if (Array.isArray(workouts)) {
    workouts.forEach((workout) => {
      if (!workout?.completedAt) return;
      const d = new Date(workout.completedAt);
      if (Number.isNaN(d.getTime())) return;
      if (d.getFullYear() !== year) return;
      byMonth[d.getMonth()] += getWorkoutVolumeLb(workout);
    });
  }

  const yearTotal = byMonth.reduce((acc, x) => acc + x, 0);
  const maxVolume = Math.max(...byMonth, 1);
  return { year, byMonth, maxVolume, yearTotal };
}

export function formatVolumeCompact(lb) {
  if (!Number.isFinite(lb) || lb < 0) return '0';
  if (lb >= 10000) return `${Math.round(lb / 1000)}k`;
  if (lb >= 1000) return `${(lb / 1000).toFixed(1)}k`;
  return String(Math.round(lb));
}

/** BMI from weight (lb) and height (inches). */
export function bmiLbIn(weightLb, heightIn) {
  if (
    typeof weightLb !== 'number' ||
    typeof heightIn !== 'number' ||
    weightLb <= 0 ||
    heightIn <= 0
  )
    return null;
  return (703 * weightLb) / (heightIn * heightIn);
}

/** Feet wheel: not set (-1); valid feet values are FEET_OPTIONS_MIN … FEET_OPTIONS_MAX. */
export const PROFILE_HEIGHT_FT_SENTINEL = -1;
export const PROFILE_HEIGHT_FT_OPTIONS_MIN = 4;
export const PROFILE_HEIGHT_FT_OPTIONS_MAX = 8;

/** Rounded inch total that matches the tallest option (8′11″). */
const PROFILE_HEIGHT_IN_TOTAL_MAX =
  PROFILE_HEIGHT_FT_OPTIONS_MAX * 12 + 11;
const PROFILE_HEIGHT_IN_TOTAL_MIN =
  PROFILE_HEIGHT_FT_OPTIONS_MIN * 12;

/** Map stored inch total → spinner values (clamp into supported range). */
export function inchesToProfileHeightPickers(heightInTotal) {
  if (heightInTotal == null || !Number.isFinite(Number(heightInTotal)) || Number(heightInTotal) <= 0) {
    return {
      feet: PROFILE_HEIGHT_FT_SENTINEL,
      inches: 0,
    };
  }
  let r = Math.round(Number(heightInTotal));
  r = Math.min(PROFILE_HEIGHT_IN_TOTAL_MAX, Math.max(PROFILE_HEIGHT_IN_TOTAL_MIN, r));
  return {
    feet: Math.floor(r / 12),
    inches: r % 12,
  };
}

/** Map feet + inch wheels → total inches saved in profile (`null` = “not set”). */
export function profileHeightPickersToInches(feet, inches) {
  if (
    feet === PROFILE_HEIGHT_FT_SENTINEL ||
    feet < PROFILE_HEIGHT_FT_OPTIONS_MIN ||
    feet > PROFILE_HEIGHT_FT_OPTIONS_MAX
  )
    return null;
  let inchPart = inches;
  if (!Number.isFinite(inchPart) || inchPart < 0) inchPart = 0;
  if (inchPart > 11) inchPart = 11;
  return feet * 12 + inchPart;
}

/** Human-readable height for displays (stored value is inches). */
export function formatHeightFeetInchesLabel(heightInTotal) {
  if (heightInTotal == null || !Number.isFinite(Number(heightInTotal)) || Number(heightInTotal) <= 0) {
    return '';
  }
  const r = Math.round(Number(heightInTotal));
  const ft = Math.floor(r / 12);
  const inch = r % 12;
  return `${ft} ft ${inch} in`;
}
