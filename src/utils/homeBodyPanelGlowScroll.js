const OVERSCROLL_FADE_DISTANCE = 56;
const OVERSCROLL_TUCK_DISTANCE = 120;
const OVERSCROLL_TUCK_TRANSLATE = 72;
const OVERSCROLL_COVER_FADE_DISTANCE = 20;

/**
 * Animated styles for the home/summary body-panel glow during top rubber-band pulls.
 * @param {import('react-native').Animated.Value} scrollY
 * @param {{ counterScroll?: boolean }} [options]
 */
export function createBodyPanelGlowScrollStyle(scrollY, { counterScroll = false } = {}) {
  const opacity = scrollY.interpolate({
    inputRange: [-OVERSCROLL_FADE_DISTANCE, 0],
    outputRange: [0, 1],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (counterScroll) {
    return {
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [-OVERSCROLL_TUCK_DISTANCE, 0, 1, 2000],
            outputRange: [OVERSCROLL_TUCK_TRANSLATE, 0, 1, 2000],
            extrapolateLeft: 'clamp',
          }),
        },
      ],
      opacity,
    };
  }

  return {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-OVERSCROLL_TUCK_DISTANCE, 0],
          outputRange: [OVERSCROLL_TUCK_TRANSLATE, 0],
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      },
    ],
    opacity,
  };
}

/** Masks clipped glow edges while pulling past the top of the sheet. */
export function createBodyPanelOverscrollCoverStyle(scrollY) {
  return {
    opacity: scrollY.interpolate({
      inputRange: [-OVERSCROLL_COVER_FADE_DISTANCE, 0],
      outputRange: [1, 0],
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  };
}
