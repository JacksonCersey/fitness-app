import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { Animated, Easing, Image, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MAIN_NAV_TAB_COUNT, MAIN_NAV_TRACK_HEIGHT, MAIN_SCREEN_TO_NAV_TAB } from '../../constants/layout';

const NAV_TAB_ORDER = ['home', 'history', 'muscles', 'settings'];

/** Keeps pill geometry across brief unmounts so the indicator does not wait on layout. */
const indicatorGeometryCache = { left: 0, width: 0 };

/** Horizontal ⋯ icon for the More tab (matches active / inactive nav colors). */
function MenuNavMoreDotsIcon({ active, theme }) {
  const styles = useStyles();
  const dotColor = active ? theme.navAccent : theme.navIconInactive;
  return (
    <View style={styles.menuNavMoreDotsIcon} accessibilityElementsHidden>
      <View style={[styles.menuNavMoreDot, { backgroundColor: dotColor }]} />
      <View style={[styles.menuNavMoreDot, { backgroundColor: dotColor }]} />
      <View style={[styles.menuNavMoreDot, { backgroundColor: dotColor }]} />
    </View>
  );
}

function getActiveMainNavTabKey(currentScreen) {
  return MAIN_SCREEN_TO_NAV_TAB[currentScreen] ?? null;
}

function getNavIconTint(active, theme) {
  return active ? theme.navAccent : theme.navIconInactive;
}

function MainBottomTabBar({
  currentScreen,
  bottomInset,
  mainTabTransitionLockRef,
  onPressHome,
  onPressHistory,
  onPressSettings,
  onPressMuscles,
  onPressStartWorkout,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const blurTint = 'dark';
  const mainNavIndicatorX = useRef(new Animated.Value(0)).current;
  const mainNavTrackInnerRef = useRef(null);
  const mainNavTabsRowRef = useRef(null);
  const [indicatorGeometry, setIndicatorGeometry] = useState(() => ({ ...indicatorGeometryCache }));

  const activeTab = getActiveMainNavTabKey(currentScreen);
  const activeIndex = activeTab ? NAV_TAB_ORDER.indexOf(activeTab) : -1;
  const slotWidth = indicatorGeometry.width;

  const moveIndicatorToIndex = useCallback(
    (index, animated) => {
      if (index < 0 || slotWidth <= 0) return;
      const toValue = index * slotWidth;
      mainNavIndicatorX.stopAnimation();
      if (animated) {
        Animated.timing(mainNavIndicatorX, {
          toValue,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else {
        mainNavIndicatorX.setValue(toValue);
      }
    },
    [mainNavIndicatorX, slotWidth],
  );

  const syncIndicatorGeometry = useCallback(() => {
    const inner = mainNavTrackInnerRef.current;
    const tabsRow = mainNavTabsRowRef.current;
    if (!inner || !tabsRow) return;

    tabsRow.measureLayout(
      inner,
      (relativeX, _relativeY, measuredWidth) => {
        const nextSlotWidth = measuredWidth / MAIN_NAV_TAB_COUNT;
        if (nextSlotWidth <= 0) return;
        const nextGeometry = { left: relativeX, width: nextSlotWidth };
        indicatorGeometryCache.left = relativeX;
        indicatorGeometryCache.width = nextSlotWidth;
        setIndicatorGeometry(nextGeometry);
        const index = activeTab ? NAV_TAB_ORDER.indexOf(activeTab) : -1;
        if (index >= 0) {
          mainNavIndicatorX.setValue(index * nextSlotWidth);
        }
      },
      () => {},
    );
  }, [activeTab, mainNavIndicatorX]);

  useEffect(() => {
    if (activeIndex >= 0 && slotWidth > 0) {
      moveIndicatorToIndex(activeIndex, true);
    }
  }, [activeIndex, slotWidth, moveIndicatorToIndex]);

  const handleTabPress = useCallback(
    (tabKey, onPress) => {
      const targetScreen = { home: 'menu', history: 'history', muscles: 'muscles', settings: 'settings' }[tabKey];
      if (mainTabTransitionLockRef?.current) return;
      if (targetScreen === currentScreen) return;
      const index = NAV_TAB_ORDER.indexOf(tabKey);
      if (index >= 0) {
        moveIndicatorToIndex(index, true);
      }
      onPress();
    },
    [currentScreen, mainTabTransitionLockRef, moveIndicatorToIndex],
  );

  const navBottomPad = 12 + bottomInset;

  return (
    <View style={[styles.menuBottomNav, { paddingBottom: navBottomPad }]} pointerEvents="box-none">
      <View style={styles.menuBottomNavRow}>
        <View style={styles.menuNavTrack}>
          <BlurView intensity={40} tint={blurTint} style={styles.menuNavTrackBlur} />
          <View style={styles.menuNavTrackScrim} pointerEvents="none" />
          <View
            ref={mainNavTrackInnerRef}
            style={styles.menuNavTrackInner}
            collapsable={false}
            onLayout={syncIndicatorGeometry}>
            {slotWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.menuNavTabIndicator,
                  {
                    top: 0,
                    left: indicatorGeometry.left,
                    height: MAIN_NAV_TRACK_HEIGHT,
                    width: slotWidth,
                    transform: [{ translateX: mainNavIndicatorX }],
                  },
                ]}>
                <BlurView intensity={58} tint={blurTint} style={styles.menuNavTabIndicatorBlur} />
                <View style={styles.menuNavTabIndicatorScrim} pointerEvents="none" />
              </Animated.View>
            ) : null}
            <View
              ref={mainNavTabsRowRef}
              style={styles.menuNavTabsRow}
              collapsable={false}
              onLayout={syncIndicatorGeometry}>
              <TouchableOpacity
                style={styles.menuNavTabTouchable}
                onPress={() => handleTabPress('home', onPressHome)}
                accessibilityRole="button"
                accessibilityLabel="Home">
                <View style={styles.menuNavSlotAnchor}>
                  <Image
                    source={require('../../../assets/images/icons/houseicon.png')}
                    style={[
                      styles.menuNavGearIcon,
                      activeTab === 'home' ? styles.menuNavIconActive : styles.menuNavIconInactive,
                      { tintColor: getNavIconTint(activeTab === 'home', theme) },
                    ]}
                    fadeDuration={0}
                  />
                  <Text
                    style={[
                      styles.menuNavTabLabel,
                      activeTab === 'home' ? styles.menuNavTabLabelActive : styles.menuNavTabLabelInactive,
                    ]}>
                    Home
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuNavTabTouchable}
                onPress={() => handleTabPress('history', onPressHistory)}
                accessibilityRole="button"
                accessibilityLabel="History">
                <View style={styles.menuNavSlotAnchor}>
                  <Image
                    source={require('../../../assets/images/icons/progressicon.png')}
                    style={[
                      styles.menuNavGearIcon,
                      activeTab === 'history' ? styles.menuNavIconActive : styles.menuNavIconInactive,
                      { tintColor: getNavIconTint(activeTab === 'history', theme) },
                    ]}
                    fadeDuration={0}
                  />
                  <Text
                    style={[
                      styles.menuNavTabLabel,
                      activeTab === 'history' ? styles.menuNavTabLabelActive : styles.menuNavTabLabelInactive,
                    ]}>
                    Progress
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuNavTabTouchable}
                onPress={() => handleTabPress('muscles', onPressMuscles)}
                accessibilityRole="button"
                accessibilityLabel="Plan tab">
                <View style={styles.menuNavSlotAnchor}>
                  <Image
                    source={require('../../../assets/images/icons/targetlogo.png')}
                    style={[
                      styles.menuNavTargetIcon,
                      activeTab === 'muscles' ? styles.menuNavIconActive : styles.menuNavIconInactive,
                      { tintColor: getNavIconTint(activeTab === 'muscles', theme) },
                    ]}
                    fadeDuration={0}
                  />
                  <Text
                    style={[
                      styles.menuNavTabLabel,
                      activeTab === 'muscles' ? styles.menuNavTabLabelActive : styles.menuNavTabLabelInactive,
                    ]}>
                    Plan
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuNavTabTouchable}
                onPress={() => handleTabPress('settings', onPressSettings)}
                accessibilityRole="button"
                accessibilityLabel="More">
                <View style={styles.menuNavSlotAnchor}>
                  <MenuNavMoreDotsIcon active={activeTab === 'settings'} theme={theme} />
                  <Text
                    style={[
                      styles.menuNavTabLabel,
                      activeTab === 'settings' ? styles.menuNavTabLabelActive : styles.menuNavTabLabelInactive,
                    ]}>
                    More
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.menuNavFabWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.menuNavFab}
            onPress={onPressStartWorkout}
            accessibilityRole="button"
            accessibilityLabel="Start new workout">
            <Text style={styles.menuNavFabPlus}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default memo(MainBottomTabBar);
