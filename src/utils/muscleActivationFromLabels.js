import { MUSCLE_GROUPS } from '../../data/exerciseMuscleMap';
import { DISPLAY_LABEL_TO_SLUGS } from '../../data/workoutMuscleHeat';

/**
 * Builds slug → activation (0–1) for SVG heat coloring from human-readable muscle labels.
 * @param {string[]} displayLabels
 * @returns {Record<string, number>}
 */
export function muscleActivationFromDisplayLabels(displayLabels) {
  /** @type {Record<string, number>} */
  const out = {};
  MUSCLE_GROUPS.forEach((g) => {
    out[g] = 0;
  });

  const labels = displayLabels ?? [];
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    const slugs = DISPLAY_LABEL_TO_SLUGS[label];
    if (!slugs) continue;
    for (let j = 0; j < slugs.length; j += 1) {
      const s = slugs[j];
      out[s] = Math.max(out[s] ?? 0, 1);
    }
  }
  return out;
}
