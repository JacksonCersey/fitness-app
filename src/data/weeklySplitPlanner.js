/**
 * Weekly workout split planner (Targets → Split).
 * One entry per calendar day Mon → Sun.
 */

import { getSundayStartOfWeekLocal } from '../utils/weeklyPplSetTotals';

/**
 * Plan index Mon=0 … Sun=6 → calendar date within the Sun–Sat week starting `weekStartSunday`.
 * @param {Date} weekStartSunday
 * @param {number} planIndex
 * @returns {Date}
 */
export function calendarDateForPlanIndexInSunWeek(weekStartSunday, planIndex) {
  const sunFirstCol = planIndex === 6 ? 0 : planIndex + 1;
  const d = new Date(weekStartSunday);
  d.setDate(weekStartSunday.getDate() + sunFirstCol);
  d.setHours(0, 0, 0, 0);
  return d;
}
export const SPLIT_DAY_TYPES = [
  'rest',
  'push',
  'pull',
  'legs',
  'upper',
  'lower',
  'full',
  'mixed',
];

/** @type {Record<string, string>} */
export const SPLIT_DAY_TYPE_LABELS = {
  rest: 'Rest',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full body',
  mixed: 'Mixed',
};

const VALID_TYPES = new Set(SPLIT_DAY_TYPES);

/** Muscles user can pick on a Mixed day (matches exercise / diagram labels). */
export const MIXED_DAY_MUSCLE_OPTIONS = [
  'Chest',
  'Upper Chest',
  'Lower Chest',
  'Front Delts',
  'Side Delts',
  'Rear Delts',
  'Biceps',
  'Brachialis',
  'Triceps',
  'Forearms',
  'Lats',
  'Upper Back',
  'Lower Back',
  'Traps',
  'Upper Traps',
  'Teres Major',
  'Abs',
  'Obliques',
  'Core',
  'Hip Flexors',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Adductors',
  'Abductors',
  'Rotator Cuff',
  'Neck',
];

/** For mini-diagram preview on planner rows (non-mixed). */
export const SPLIT_TYPE_PREVIEW_MUSCLES = {
  rest: [],
  push: ['Chest', 'Upper Chest', 'Front Delts', 'Side Delts', 'Triceps'],
  pull: ['Lats', 'Upper Back', 'Rear Delts', 'Traps', 'Biceps', 'Forearms'],
  legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  upper: [
    'Chest',
    'Upper Chest',
    'Front Delts',
    'Side Delts',
    'Rear Delts',
    'Lats',
    'Upper Back',
    'Traps',
    'Biceps',
    'Triceps',
    'Forearms',
  ],
  lower: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Lower Back', 'Adductors'],
  full: [
    'Chest',
    'Upper Chest',
    'Front Delts',
    'Side Delts',
    'Lats',
    'Upper Back',
    'Biceps',
    'Triceps',
    'Quads',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Core',
  ],
  mixed: [],
};

/**
 * @param {unknown} t
 * @returns {string}
 */
function coerceDayType(t) {
  if (typeof t === 'string' && VALID_TYPES.has(t)) return t;
  return 'rest';
}

/**
 * @param {unknown} raw
 * @returns {{ type: string; mixedMuscles: string[] }}
 */
function normalizeDayEntry(raw) {
  if (!raw || typeof raw !== 'object') {
    return { type: 'rest', mixedMuscles: [] };
  }
  const type = coerceDayType(raw.type ?? raw.dayType);
  let muscles = Array.isArray(raw.mixedMuscles) ? raw.mixedMuscles.map((x) => String(x)) : [];
  const allowed = new Set(MIXED_DAY_MUSCLE_OPTIONS);
  muscles = muscles.filter((m) => allowed.has(m));
  if (type !== 'mixed') {
    return { type, mixedMuscles: [] };
  }
  return { type: 'mixed', mixedMuscles: [...new Set(muscles)] };
}

/**
 * @param {unknown} raw
 * @returns {{ days: { type: string; mixedMuscles: string[] }[] }}
 */
export function normalizeWeeklySplitPlan(raw) {
  const fromRaw = raw && typeof raw === 'object' && Array.isArray(raw.days) ? raw.days : null;
  const base = fromRaw ? fromRaw.map(normalizeDayEntry) : Array.from({ length: 7 }, () => ({ type: 'rest', mixedMuscles: [] }));
  while (base.length < 7) {
    base.push({ type: 'rest', mixedMuscles: [] });
  }
  return { days: base.slice(0, 7) };
}

export function getDefaultWeeklySplitPlan() {
  return normalizeWeeklySplitPlan(null);
}

/** Monday = 0 … Sunday = 6 (matches `days` array order in weekly split plan). */
export function getMondayBasedDayIndex(date = new Date()) {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

/** Muscles targeted on that calendar day (from split type presets or mixed picks). */
export function getMusclesForSplitDayEntry(dayEntry) {
  if (!dayEntry || dayEntry.type === 'rest') return [];
  if (dayEntry.type === 'mixed') return [...(dayEntry.mixedMuscles ?? [])];
  return [...(SPLIT_TYPE_PREVIEW_MUSCLES[dayEntry.type] ?? [])];
}

/** True once the user has at least one training day (not all rest / empty mixed). */
export function weeklySplitPlanIsConfigured(plan) {
  if (!plan?.days) return false;
  return plan.days.some((d) => {
    if (d.type === 'mixed') return (d.mixedMuscles ?? []).length > 0;
    return d.type !== 'rest';
  });
}

/**
 * @param {{ type: string; mixedMuscles?: string[] } | null | undefined} dayEntry
 * @returns {boolean}
 */
export function isSplitPlanTrainingDay(dayEntry) {
  if (!dayEntry || dayEntry.type === 'rest') return false;
  if (dayEntry.type === 'mixed') return (dayEntry.mixedMuscles ?? []).length > 0;
  return true;
}

/**
 * How many Mon–Sun slots in the plan are real training days (not rest / empty mixed).
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] } | null | undefined} plan
 * @returns {number}
 */
export function countWeeklySplitTrainingDays(plan) {
  if (!plan?.days) return 0;
  let n = 0;
  for (let i = 0; i < 7 && i < plan.days.length; i += 1) {
    if (isSplitPlanTrainingDay(plan.days[i])) n += 1;
  }
  return n;
}

/**
 * Completed training days this local Sun–Sat week (same week as the home menu strip): each plan
 * training day counts if the user logged at least one workout on that calendar date.
 * @param {{ days: { type: string; mixedMuscles?: string[] }[] }} plan
 * @param {unknown[]} workoutHistory
 * @param {Date} [referenceDate]
 * @returns {{ completed: number; target: number }}
 */
export function getSplitWeekWorkoutProgress(plan, workoutHistory, referenceDate = new Date()) {
  const weekStartSunday = getSundayStartOfWeekLocal(referenceDate);
  const weekEndMs = weekStartSunday.getTime() + 7 * 24 * 60 * 60 * 1000;

  const workoutDayKeys = new Set();
  if (Array.isArray(workoutHistory)) {
    for (let i = 0; i < workoutHistory.length; i += 1) {
      const w = workoutHistory[i];
      if (!w || typeof w !== 'object' || !w.completedAt) continue;
      const completedAt = new Date(w.completedAt);
      if (Number.isNaN(completedAt.getTime())) continue;
      const t = completedAt.getTime();
      if (t < weekStartSunday.getTime() || t >= weekEndMs) continue;
      workoutDayKeys.add(`${completedAt.getFullYear()}-${completedAt.getMonth()}-${completedAt.getDate()}`);
    }
  }

  const target = countWeeklySplitTrainingDays(plan);
  let completed = 0;
  if (!plan?.days) return { completed: 0, target };

  for (let i = 0; i < 7; i += 1) {
    const dayEntry = plan.days[i];
    if (!isSplitPlanTrainingDay(dayEntry)) continue;
    const d = calendarDateForPlanIndexInSunWeek(weekStartSunday, i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (workoutDayKeys.has(key)) completed += 1;
  }

  return { completed, target };
}
