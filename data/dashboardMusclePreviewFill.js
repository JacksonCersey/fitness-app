/**
 * Fill colors for dashboard muscle diagrams (SVG): given display label(s), paths that match go white.
 */

import {
  BACK_SVG_OUTLINE_IDS,
  BACK_SVG_PATH_MUSCLES,
  baseFillForBackPathId,
} from './backSvgMuscleMap';
import {
  FRONT_SVG_OUTLINE_IDS,
  FRONT_SVG_PATH_MUSCLES,
  baseFillForPathId,
} from './frontSvgMuscleMap';
import { DISPLAY_LABEL_TO_SLUGS } from './workoutMuscleHeat';

const DIM_MUSCLE = '#4B4B55';
const HIGHLIGHT = '#F8F8FF';

/** Labeled front SVG: single head/neck path `path48`. */
const NECK_PATH_IDS_FRONT = new Set(['path48']);
/** Labeled back SVG: head / neck paths. */
const NECK_PATH_IDS_BACK = new Set(['path52', 'path53', 'path54']);

/** @param {string | string[] | null | undefined} input */
function normalizeHighlightInput(input) {
  if (input == null || input === '') return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  return [String(input)];
}

function slugSetFromDisplayLabels(displayLabels) {
  const set = new Set();
  const labels = displayLabels ?? [];
  for (let i = 0; i < labels.length; i += 1) {
    const slugs = DISPLAY_LABEL_TO_SLUGS[labels[i]];
    if (!slugs) continue;
    for (let j = 0; j < slugs.length; j += 1) set.add(slugs[j]);
  }
  return set;
}

function pathIntersectsSlugSet(pathId, slugSet, pathToLabels) {
  const mapped = pathToLabels[pathId];
  if (!mapped || mapped.length === 0) return false;
  for (let i = 0; i < mapped.length; i += 1) {
    const muscleLabel = mapped[i];
    const slugs = DISPLAY_LABEL_TO_SLUGS[muscleLabel];
    if (!slugs) continue;
    for (let j = 0; j < slugs.length; j += 1) {
      if (slugSet.has(slugs[j])) return true;
    }
  }
  return false;
}

/**
 * @param {string} pathId
 * @param {string | string[]} highlightInput
 * @param {{ onlyPathIds?: string[] }} [options]
 */
export function dashboardPreviewFillFront(pathId, highlightInput, options = {}) {
  const { onlyPathIds } = options;
  const labels = normalizeHighlightInput(highlightInput);

  if (onlyPathIds?.length) {
    if (FRONT_SVG_OUTLINE_IDS.has(pathId)) return baseFillForPathId(pathId);
    if (labels.includes('Neck') && NECK_PATH_IDS_FRONT.has(pathId)) return HIGHLIGHT;
    if (onlyPathIds.includes(pathId)) return HIGHLIGHT;
    if (!FRONT_SVG_PATH_MUSCLES[pathId]) return baseFillForPathId(pathId);
    return DIM_MUSCLE;
  }

  if (labels.length === 0) return baseFillForPathId(pathId);
  if (labels.includes('Neck') && NECK_PATH_IDS_FRONT.has(pathId)) return HIGHLIGHT;

  const slugSet = slugSetFromDisplayLabels(labels.filter((l) => l !== 'Neck'));
  const mapped = FRONT_SVG_PATH_MUSCLES[pathId];
  if (!mapped) return baseFillForPathId(pathId);
  if (slugSet.size === 0) return baseFillForPathId(pathId);
  if (pathIntersectsSlugSet(pathId, slugSet, FRONT_SVG_PATH_MUSCLES)) return HIGHLIGHT;
  return DIM_MUSCLE;
}

/**
 * @param {string} pathId
 * @param {string | string[]} highlightInput
 * @param {{ onlyPathIds?: string[] }} [options]
 */
export function dashboardPreviewFillBack(pathId, highlightInput, options = {}) {
  const { onlyPathIds } = options;
  const labels = normalizeHighlightInput(highlightInput);

  if (onlyPathIds?.length) {
    if (BACK_SVG_OUTLINE_IDS.has(pathId)) return baseFillForBackPathId(pathId);
    if (labels.includes('Neck') && NECK_PATH_IDS_BACK.has(pathId)) return HIGHLIGHT;
    if (onlyPathIds.includes(pathId)) return HIGHLIGHT;
    if (!BACK_SVG_PATH_MUSCLES[pathId]) return baseFillForBackPathId(pathId);
    return DIM_MUSCLE;
  }

  if (labels.length === 0) return baseFillForBackPathId(pathId);
  if (labels.includes('Neck') && NECK_PATH_IDS_BACK.has(pathId)) return HIGHLIGHT;

  const slugSet = slugSetFromDisplayLabels(labels.filter((l) => l !== 'Neck'));
  const mapped = BACK_SVG_PATH_MUSCLES[pathId];
  if (!mapped) return baseFillForBackPathId(pathId);
  if (slugSet.size === 0) return baseFillForBackPathId(pathId);
  if (pathIntersectsSlugSet(pathId, slugSet, BACK_SVG_PATH_MUSCLES)) return HIGHLIGHT;
  return DIM_MUSCLE;
}
