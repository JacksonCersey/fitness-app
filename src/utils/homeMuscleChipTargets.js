import { ESTIMATED_WEEKLY_SUBTARGETS } from './weeklyPplSetTotals';

/**
 * Maps home highlight chip ids (see splitDayHighlightIcons) to PPL subcategory keys
 * used on the Targets tab for weekly set counts and estimated goals.
 */
const HIGHLIGHT_CHIP_TO_PPL_SUB = {
  chest: { category: 'push', sub: 'chest' },
  shoulders: { category: 'push', sub: 'shoulders' },
  triceps: { category: 'push', sub: 'triceps' },
  back: { category: 'pull', sub: 'back' },
  biceps: { category: 'pull', sub: 'biceps' },
  quads: { category: 'legs', sub: 'quads' },
  hamstrings: { category: 'legs', sub: 'hamstrings' },
  glutes: { category: 'legs', sub: 'glutes' },
  calves: { category: 'legs', sub: 'calves' },
};

/**
 * @param {string} chipId
 * @param {Record<string, Record<string, number>> | null | undefined} weeklySubcategorySetCounts
 * @returns {{ done: number; target: number } | null}
 */
export function getHomeMuscleChipLoggedGoal(chipId, weeklySubcategorySetCounts) {
  const loc = HIGHLIGHT_CHIP_TO_PPL_SUB[chipId];
  if (!loc) return null;
  const done = weeklySubcategorySetCounts?.[loc.category]?.[loc.sub] ?? 0;
  const target = ESTIMATED_WEEKLY_SUBTARGETS[loc.category]?.[loc.sub] ?? 0;
  return { done, target };
}
