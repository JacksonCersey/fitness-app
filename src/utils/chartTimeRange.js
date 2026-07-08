/** @typedef {'week' | 'month' | 'year' | 'all'} ChartTimeRange */

export const CHART_TIME_RANGE_OPTIONS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All' },
];

/** Month / Year / All — used on weekly-bucket streak graphs where Week is rarely useful. */
export const STREAK_CHART_TIME_RANGE_OPTIONS = [
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All' },
];

/**
 * Milliseconds to keep for a range filter (rolling window ending now).
 * `all` returns null (no cutoff).
 * @param {ChartTimeRange} range
 * @returns {number | null}
 */
export function getChartRangeCutoffMs(range) {
  const dayMs = 24 * 60 * 60 * 1000;
  switch (range) {
    case 'week':
      return Date.now() - 7 * dayMs;
    case 'month':
      return Date.now() - 30 * dayMs;
    case 'year':
      return Date.now() - 365 * dayMs;
    case 'all':
    default:
      return null;
  }
}

/**
 * Keep chart points whose `timestamp` falls within the selected range.
 * Points without a valid timestamp are kept only for `all`.
 * @template {{ timestamp?: number }} T
 * @param {T[]} points
 * @param {ChartTimeRange} range
 * @returns {T[]}
 */
export function filterPointsByChartRange(points, range) {
  const list = Array.isArray(points) ? points : [];
  const cutoff = getChartRangeCutoffMs(range);
  if (cutoff == null) return list;
  return list.filter((point) => {
    const t = Number(point?.timestamp);
    return Number.isFinite(t) && t >= cutoff;
  });
}
