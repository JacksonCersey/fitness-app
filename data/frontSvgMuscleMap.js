/**
 * Maps each SVG path id in `assets/images/musclessvglabeledfront.svg` to exercise-database muscle names.
 * path46 = outer outline (neutral). path48 = head / neck block (neutral for heat).
 */
export const FRONT_SVG_OUTLINE_IDS = new Set(['path46']);

// path id -> muscle name(s) that should turn this region green when worked
export const FRONT_SVG_PATH_MUSCLES = {
  path7: ['Front Delts'],
  path26: ['Front Delts'],
  path9: ['Front Delts'],
  path27: ['Front Delts'],
  path10: ['Chest', 'Front Delts'],
  path28: ['Chest', 'Front Delts'],
  path11: ['Side Delts', 'Biceps'],
  path29: ['Side Delts', 'Biceps'],
  path12: ['Calves'],
  path30: ['Calves'],
  path13: ['Quads'],
  path31: ['Quads'],
  path14: ['Chest'],
  path32: ['Chest'],
  path15: ['Chest', 'Upper Chest'],
  path33: ['Chest', 'Upper Chest'],
  path16: ['Chest'],
  path34: ['Chest'],
  path17: ['Chest'],
  path35: ['Chest'],
  path18: ['Abs', 'Core', 'Hip Flexors'],
  path36: ['Abs', 'Core', 'Hip Flexors'],
  path19: ['Forearms'],
  path37: ['Forearms'],
  path20: ['Forearms'],
  path38: ['Forearms'],
  path21: ['Quads'],
  path39: ['Quads'],
  path22: ['Quads', 'Adductors'],
  path40: ['Quads', 'Adductors'],
  path23: ['Calves'],
  path41: ['Calves'],
  path24: ['Calves'],
  path42: ['Calves'],
  path25: ['Calves'],
  path43: ['Calves'],
};

export const FRONT_SVG_BASE_FILL = {
  path46: '#b3b3b3',
  path48: '#cccccc',
  defaultMuscles: '#666666',
};

/** @param {string} pathId */
export function baseFillForPathId(pathId) {
  if (FRONT_SVG_BASE_FILL[pathId]) return FRONT_SVG_BASE_FILL[pathId];
  return FRONT_SVG_BASE_FILL.defaultMuscles;
}
