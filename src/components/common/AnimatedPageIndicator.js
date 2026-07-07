import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';

export const PAGE_INDICATOR_DOT_INACTIVE_WIDTH = 6;
export const PAGE_INDICATOR_DOT_ACTIVE_WIDTH = 16;
export const PAGE_INDICATOR_DOT_HEIGHT = 6;
export const PAGE_INDICATOR_DOT_RADIUS = 3;

function AnimatedPageIndicatorDot({ scrollX, pageWidth, pageIndex, pageCount, accentColor, inactiveColor }) {
  const { width, backgroundColor, scaleY } = useMemo(() => {
    const inputRange = [];
    const widthOutput = [];
    const colorOutput = [];
    const scaleOutput = [];

    for (let page = 0; page < pageCount; page += 1) {
      inputRange.push(page * pageWidth);
      const isActive = page === pageIndex;
      widthOutput.push(isActive ? PAGE_INDICATOR_DOT_ACTIVE_WIDTH : PAGE_INDICATOR_DOT_INACTIVE_WIDTH);
      colorOutput.push(isActive ? accentColor : inactiveColor);
      scaleOutput.push(isActive ? 1.08 : 1);
    }

    return {
      width: scrollX.interpolate({
        inputRange,
        outputRange: widthOutput,
        extrapolate: 'clamp',
      }),
      backgroundColor: scrollX.interpolate({
        inputRange,
        outputRange: colorOutput,
        extrapolate: 'clamp',
      }),
      scaleY: scrollX.interpolate({
        inputRange,
        outputRange: scaleOutput,
        extrapolate: 'clamp',
      }),
    };
  }, [scrollX, pageWidth, pageIndex, pageCount, accentColor, inactiveColor]);

  return (
    <Animated.View
      style={{
        width,
        height: PAGE_INDICATOR_DOT_HEIGHT,
        borderRadius: PAGE_INDICATOR_DOT_RADIUS,
        backgroundColor,
        transform: [{ scaleY }],
      }}
    />
  );
}

/**
 * Pill-style page indicator that animates with horizontal scroll position.
 */
function AnimatedPageIndicator({
  scrollX,
  pageWidth,
  pageCount,
  accentColor,
  inactiveColor,
  style,
}) {
  if (pageWidth <= 0 || pageCount <= 0) return null;

  return (
    <View style={style}>
      {Array.from({ length: pageCount }).map((_, index) => (
        <AnimatedPageIndicatorDot
          key={`page-indicator-dot-${index}`}
          scrollX={scrollX}
          pageWidth={pageWidth}
          pageIndex={index}
          pageCount={pageCount}
          accentColor={accentColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

export function useSyncedPagerScrollX(activePage, pageWidth) {
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pageWidth > 0) {
      scrollX.setValue(activePage * pageWidth);
    }
  }, [activePage, pageWidth, scrollX]);

  return scrollX;
}

export default memo(AnimatedPageIndicator);
