import { DEFAULT_BODYWEIGHT_LB } from './constants';

/**
 * Closest bodyweight on or before `date` from weight logs.
 * @param {Array<{ dateISO?: string, weightLb?: number }>} weightLogs
 * @param {Date} date
 * @returns {number}
 */
export function getBodyweightLbAtDate(weightLogs, date) {
  if (!Array.isArray(weightLogs) || weightLogs.length === 0) return DEFAULT_BODYWEIGHT_LB;
  const target = date.getTime();
  if (Number.isNaN(target)) return DEFAULT_BODYWEIGHT_LB;

  let best = null;
  let bestTime = -1;

  for (let i = 0; i < weightLogs.length; i += 1) {
    const log = weightLogs[i];
    const t = new Date(log?.dateISO || '').getTime();
    const w = Number(log?.weightLb);
    if (Number.isNaN(t) || t > target || Number.isNaN(w) || w <= 0) continue;
    if (t >= bestTime) {
      bestTime = t;
      best = w;
    }
  }

  return best != null ? best : DEFAULT_BODYWEIGHT_LB;
}

/**
 * @param {Array<{ dateISO?: string, weightLb?: number }>} weightLogs
 * @returns {number}
 */
export function getLatestBodyweightLb(weightLogs) {
  if (!Array.isArray(weightLogs) || weightLogs.length === 0) return DEFAULT_BODYWEIGHT_LB;
  const sorted = [...weightLogs]
    .filter((l) => l?.dateISO && !Number.isNaN(new Date(l.dateISO).getTime()))
    .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  const w = Number(sorted[0]?.weightLb);
  return !Number.isNaN(w) && w > 0 ? w : DEFAULT_BODYWEIGHT_LB;
}
