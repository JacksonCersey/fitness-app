/** @type {Record<string, number>} */
const LEVEL_ICON_BY_TYPE = {
  push: require('../../assets/images/levelicons/levelicon-push.png'),
  pull: require('../../assets/images/levelicons/levelicon-pull.png'),
  legs: require('../../assets/images/levelicons/levelicon-legs.png'),
  upper: require('../../assets/images/levelicons/levelicon-upper.png'),
  lower: require('../../assets/images/levelicons/levelicon-lower.png'),
  full: require('../../assets/images/levelicons/levelicon-full.png'),
  mixed: require('../../assets/images/levelicons/levelicon-mixed.png'),
};

const LEVEL_ICON_INACTIVE = require('../../assets/images/levelicons/levelicon-inactive.png');

/**
 * PNG for the gamified level-select circle.
 * @param {{ type: string; mixedMuscles?: string[] } | null | undefined} dayEntry
 * @param {boolean} useAccent Full-color icon vs grey inactive
 * @returns {number | null} `require()` asset id, or null for rest days
 */
export function getLevelIconSource(dayEntry, useAccent) {
  if (!dayEntry || dayEntry.type === 'rest') return null;
  if (!useAccent) return LEVEL_ICON_INACTIVE;
  return LEVEL_ICON_BY_TYPE[dayEntry.type] ?? LEVEL_ICON_INACTIVE;
}
