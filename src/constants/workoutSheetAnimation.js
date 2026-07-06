/**
 * Softer spring than @gorhom/bottom-sheet defaults (damping 500 / stiffness 1000),
 * so releasing a partial swipe-down slides back smoothly instead of snapping.
 */
export const WORKOUT_SHEET_SPRING_CONFIG = {
  damping: 36,
  stiffness: 290,
  mass: 0.9,
  overshootClamping: false,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
};
