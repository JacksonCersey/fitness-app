import React, { useId } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import { Animated, useWindowDimensions, View } from 'react-native';
import { SafeAreaView as TabsSafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Soft fade so scrollable content eases out above the floating tab bar (does not intercept touches).
 * Tab bar sits outside the fade wrapper so it stays responsive during tab switches.
 */
export default function MainTabsLayout({
  edges,
  safeAreaStyle,
  screenTransitionOpacity,
  contentShellBackgroundColor,
  children,
  bottomBar,
  bottomEdgeFadeColor,
  bottomEdgeFadeHeight = 120,
}) {
  const styles = useStyles();
  const { width: windowWidth } = useWindowDimensions();
  const gradientId = useId().replace(/:/g, '_');
  const fadeWidth = Math.max(1, windowWidth);
  const fadeHeight = Math.max(1, bottomEdgeFadeHeight);
  const showBottomFade = Boolean(bottomEdgeFadeColor);
  const contentShellStyle = contentShellBackgroundColor
    ? [styles.mainTabsContentShell, { backgroundColor: contentShellBackgroundColor }]
    : styles.mainTabsContentShell;

  return (
    <TabsSafeAreaView style={safeAreaStyle} edges={edges}>
      <View style={contentShellStyle}>
        <Animated.View
          style={[
            styles.mainTabsScreenFade,
            contentShellBackgroundColor ? { backgroundColor: contentShellBackgroundColor } : null,
            { opacity: screenTransitionOpacity },
          ]}>
          {children}
          {showBottomFade ? (
            <View
              pointerEvents="none"
              style={[styles.mainTabsBottomFade, { height: fadeHeight }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <Svg width={fadeWidth} height={fadeHeight}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={bottomEdgeFadeColor} stopOpacity="0" />
                    <Stop offset="0.55" stopColor={bottomEdgeFadeColor} stopOpacity="0.45" />
                    <Stop offset="1" stopColor={bottomEdgeFadeColor} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width={fadeWidth} height={fadeHeight} fill={`url(#${gradientId})`} />
              </Svg>
            </View>
          ) : null}
        </Animated.View>
        <View style={styles.mainTabsFloatingNav} pointerEvents="box-none">
          {bottomBar}
        </View>
      </View>
    </TabsSafeAreaView>
  );
}
