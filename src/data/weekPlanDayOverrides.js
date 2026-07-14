import { getMondayBasedDayIndex } from './weeklySplitPlanner';

/**
 * Local calendar Monday 00:00 for the week containing `date`.
 * Aligns with `getMondayBasedDayIndex` (Mon = 0 … Sun = 6).
 * @param {Date} date
 * @returns {Date}
 */
export function getMondayWeekStartLocal(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const mondayIndex = getMondayBasedDayIndex(d);
  d.setDate(d.getDate() - mondayIndex);
  return d;
}

/**
 * Stable key for the Mon–Sun plan week containing `date` (e.g. "2026-07-13").
 * @param {Date} date
 * @returns {string}
 */
export function getMondayWeekKey(date = new Date()) {
  const monday = getMondayWeekStartLocal(date);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @returns {number[]} */
export function createIdentityDaySourceMap() {
  return [0, 1, 2, 3, 4, 5, 6];
}

/**
 * @param {unknown} raw
 * @returns {{ weekKey: string; daySourceByPlanIndex: number[] }}
 */
export function normalizeWeekPlanDayOverrides(raw) {
  const weekKey = typeof raw?.weekKey === 'string' ? raw.weekKey.trim() : '';
  const identity = createIdentityDaySourceMap();
  const source = Array.isArray(raw?.daySourceByPlanIndex) ? raw.daySourceByPlanIndex : null;

  if (!source || source.length !== 7) {
    return { weekKey, daySourceByPlanIndex: identity };
  }

  const mapped = source.map((value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : -1;
  });

  const seen = new Set(mapped);
  const isPermutation = mapped.every((n) => n >= 0) && seen.size === 7;
  return {
    weekKey,
    daySourceByPlanIndex: isPermutation ? mapped : identity,
  };
}

/**
 * True when both dates fall in the same Mon–Sun plan week.
 * @param {Date} a
 * @param {Date} b
 */
export function isSameMondayWeek(a, b) {
  return getMondayWeekKey(a) === getMondayWeekKey(b);
}

/**
 * Which base-plan day index to read for a calendar plan slot this week.
 * @param {{ weekKey?: string; daySourceByPlanIndex?: number[] } | null | undefined} overrides
 * @param {Date} date
 * @param {number} planIndex
 * @returns {number}
 */
export function resolveWeekPlanSourceIndex(overrides, date, planIndex) {
  const idx = Number.isInteger(planIndex) ? planIndex : getMondayBasedDayIndex(date);
  if (idx < 0 || idx > 6) return 0;

  const normalized = normalizeWeekPlanDayOverrides(overrides);
  const weekKey = getMondayWeekKey(date);
  if (!normalized.weekKey || normalized.weekKey !== weekKey) return idx;

  const source = normalized.daySourceByPlanIndex[idx];
  return Number.isInteger(source) && source >= 0 && source <= 6 ? source : idx;
}

/**
 * Swap which base split/workout feeds two plan-day slots for one week only.
 * @param {{ weekKey?: string; daySourceByPlanIndex?: number[] } | null | undefined} overrides
 * @param {string} weekKey
 * @param {number} indexA
 * @param {number} indexB
 */
export function applyWeekPlanDayIndexSwap(overrides, weekKey, indexA, indexB) {
  const key = typeof weekKey === 'string' ? weekKey.trim() : '';
  if (!key) return normalizeWeekPlanDayOverrides(overrides);
  if (
    !Number.isInteger(indexA) ||
    !Number.isInteger(indexB) ||
    indexA < 0 ||
    indexA > 6 ||
    indexB < 0 ||
    indexB > 6 ||
    indexA === indexB
  ) {
    return normalizeWeekPlanDayOverrides(
      overrides?.weekKey === key ? overrides : { weekKey: key, daySourceByPlanIndex: createIdentityDaySourceMap() },
    );
  }

  const normalized = normalizeWeekPlanDayOverrides(overrides);
  const map =
    normalized.weekKey === key
      ? [...normalized.daySourceByPlanIndex]
      : createIdentityDaySourceMap();

  const temp = map[indexA];
  map[indexA] = map[indexB];
  map[indexB] = temp;

  return { weekKey: key, daySourceByPlanIndex: map };
}
