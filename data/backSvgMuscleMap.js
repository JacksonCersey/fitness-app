/**
 * Maps each path id in `assets/images/musclessvglabeledback.svg` to exercise-database muscle names.
 * path50 = outer outline. path52–path54 = head / neck (neutral for heat).
 */
export const BACK_SVG_OUTLINE_IDS = new Set(['path50']);

export const BACK_SVG_PATH_MUSCLES = {
  path56: ['Rear Delts', 'Traps', 'Rotator Cuff'],
  path69: ['Rear Delts', 'Traps', 'Rotator Cuff'],
  path57: ['Traps', 'Upper Back'],
  path70: ['Traps', 'Upper Back'],
  path58: ['Rear Delts'],
  path71: ['Rear Delts'],
  path59: ['Triceps', 'Rear Delts'],
  path72: ['Triceps', 'Rear Delts'],
  path60: ['Lower Back', 'Upper Back'],
  path73: ['Lower Back', 'Upper Back'],
  path61: ['Triceps'],
  path74: ['Triceps'],
  path62: ['Triceps'],
  path75: ['Triceps'],
  path63: ['Lats', 'Teres Major', 'Upper Back'],
  path76: ['Lats', 'Teres Major', 'Upper Back'],
  path64: ['Lats', 'Teres Major'],
  path77: ['Lats', 'Teres Major'],
  path65: ['Lower Back'],
  path78: ['Lower Back'],
  path66: ['Glutes'],
  path79: ['Glutes'],
  path67: ['Hamstrings', 'Glutes', 'Calves'],
  path80: ['Hamstrings', 'Glutes', 'Calves'],
  path68: ['Calves'],
  path81: ['Calves'],
};

export const BACK_SVG_BASE_FILL = {
  path50: '#b3b3b3',
  path52: '#cccccc',
  path53: '#cccccc',
  path54: '#cccccc',
  defaultMuscles: '#666666',
};

/** @param {string} pathId */
export function baseFillForBackPathId(pathId) {
  if (BACK_SVG_BASE_FILL[pathId]) return BACK_SVG_BASE_FILL[pathId];
  return BACK_SVG_BASE_FILL.defaultMuscles;
}
