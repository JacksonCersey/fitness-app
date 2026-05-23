import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MAIN_NAV_TRACK_HEIGHT } from '../../constants/layout';
import { styles } from '../../styles';

function getActiveMainNavTabKey(currentScreen) {
  if (currentScreen === 'menu') return 'home';
  if (currentScreen === 'history') return 'history';
  if (currentScreen === 'settings') return 'settings';
  if (currentScreen === 'muscles') return 'muscles';
  return null;
}

/** Horizontal ⋯ icon for the More tab (matches active / inactive nav colors). */
function MenuNavMoreDotsIcon({ active }) {
  const dotColor = active ? '#4B3CC1' : '#FFFFFF';
  return (
    <View style={styles.menuNavMoreDotsIcon} accessibilityElementsHidden>
      <View style={[styles.menuNavMoreDot, { backgroundColor: dotColor }]} />
      <View style={[styles.menuNavMoreDot, { backgroundColor: dotColor }]} />
      <View style={[styles.menuNavMoreDot, { backgroundColor: dotColor }]} />
    </View>
  );
}

export default function MainBottomTabBar({
  currentScreen,
  bottomInset,
  onPressHome,
  onPressHistory,
  onPressSettings,
  onPressMuscles,
  onPressStartWorkout,
}) {
  const mainNavIndicatorX = useRef(new Animated.Value(0)).current;
  const mainNavIndicatorW = useRef(new Animated.Value(1)).current;
  const mainNavIndicatorOpacity = useRef(new Animated.Value(1)).current;
  const mainNavTrackInnerRef = useRef(null);
  const mainNavSlotHomeRef = useRef(null);
  const mainNavSlotHistoryRef = useRef(null);
  const mainNavSlotSettingsRef = useRef(null);
  const mainNavSlotMusclesRef = useRef(null);

  function mainNavSlotRefFor(tabKey) {
    if (tabKey === 'home') return mainNavSlotHomeRef;
    if (tabKey === 'history') return mainNavSlotHistoryRef;
    if (tabKey === 'settings') return mainNavSlotSettingsRef;
    if (tabKey === 'muscles') return mainNavSlotMusclesRef;
    return null;
  }

  function runMainNavIndicatorMeasureFor(tabKey) {
    const inner = mainNavTrackInnerRef.current;
    const slotRef = mainNavSlotRefFor(tabKey);
    const slot = slotRef?.current;
    if (!inner || !slot) return;
    slot.measureLayout(
      inner,
      (relativeX, _relativeY, measuredWidth) => {
        const w = Math.max(0, measuredWidth);
        Animated.parallel([
          Animated.spring(mainNavIndicatorX, {
            toValue: relativeX,
            friction: 8,
            tension: 72,
            useNativeDriver: false,
          }),
          Animated.spring(mainNavIndicatorW, {
            toValue: w,
            friction: 8,
            tension: 72,
            useNativeDriver: false,
          }),
          Animated.spring(mainNavIndicatorOpacity, {
            toValue: 1,
            friction: 8,
            tension: 72,
            useNativeDriver: false,
          }),
        ]).start();
      },
      () => {},
    );
  }

  function hideMainNavTabIndicator() {
    Animated.parallel([
      Animated.spring(mainNavIndicatorW, {
        toValue: 0,
        friction: 9,
        tension: 80,
        useNativeDriver: false,
      }),
      Animated.spring(mainNavIndicatorOpacity, {
        toValue: 0,
        friction: 9,
        tension: 80,
        useNativeDriver: false,
      }),
    ]).start();
  }

  function syncMainNavIndicatorIfSlotActive(slotKey) {
    requestAnimationFrame(() => {
      const active = getActiveMainNavTabKey(currentScreen);
      if (!active || slotKey !== active) return;
      runMainNavIndicatorMeasureFor(active);
    });
  }

  function syncMainNavIndicatorForCurrentScreen() {
    requestAnimationFrame(() => {
      const active = getActiveMainNavTabKey(currentScreen);
      if (!active) {
        hideMainNavTabIndicator();
        return;
      }
      runMainNavIndicatorMeasureFor(active);
    });
  }

  useEffect(() => {
    const onTabsWithBottomNav =
      currentScreen === 'menu' ||
      currentScreen === 'history' ||
      currentScreen === 'settings' ||
      currentScreen === 'muscles';
    if (!onTabsWithBottomNav) return undefined;

    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => syncMainNavIndicatorForCurrentScreen()),
    );
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match original: only re-sync when route changes; measure uses latest refs
  }, [currentScreen]);

  const activeTab = getActiveMainNavTabKey(currentScreen);
  const navBottomPad = 12 + bottomInset;

  return (
    <View style={[styles.menuBottomNav, { paddingBottom: navBottomPad }]} pointerEvents="box-none">
      <View style={styles.menuBottomNavRow}>
        <View style={styles.menuNavTrack}>
          <BlurView intensity={40} tint="light" style={styles.menuNavTrackBlur} />
          <View style={styles.menuNavTrackScrim} pointerEvents="none" />
          <View
            ref={mainNavTrackInnerRef}
            style={styles.menuNavTrackInner}
            collapsable={false}
            onLayout={() => requestAnimationFrame(() => syncMainNavIndicatorForCurrentScreen())}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.menuNavTabIndicator,
                {
                  top: 0,
                  height: MAIN_NAV_TRACK_HEIGHT,
                  width: mainNavIndicatorW,
                  opacity: mainNavIndicatorOpacity,
                  transform: [{ translateX: mainNavIndicatorX }],
                },
              ]}>
              <BlurView intensity={58} tint="light" style={styles.menuNavTabIndicatorBlur} />
              <View style={styles.menuNavTabIndicatorScrim} pointerEvents="none" />
            </Animated.View>
            <View style={styles.menuNavTabsRow}>
              <TouchableOpacity
                ref={mainNavSlotHomeRef}
                collapsable={false}
                style={styles.menuNavTabTouchable}
                onPress={onPressHome}
                accessibilityRole="button"
                accessibilityLabel="Home"
                onLayout={() => syncMainNavIndicatorIfSlotActive('home')}>
                <View style={styles.menuNavSlotAnchor}>
                  <Image
                    source={require('../../../assets/images/houseicon.png')}
                    style={[
                      styles.menuNavGearIcon,
                      activeTab === 'home' ? styles.menuNavIconActive : styles.menuNavIconInactive,
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
                ref={mainNavSlotHistoryRef}
                collapsable={false}
                style={styles.menuNavTabTouchable}
                onPress={onPressHistory}
                accessibilityRole="button"
                accessibilityLabel="History"
                onLayout={() => syncMainNavIndicatorIfSlotActive('history')}>
                <View style={styles.menuNavSlotAnchor}>
                  <Image
                    source={require('../../../assets/images/charticon.png')}
                    style={[
                      styles.menuNavGearIcon,
                      activeTab === 'history' ? styles.menuNavIconActive : styles.menuNavIconInactive,
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
                ref={mainNavSlotMusclesRef}
                collapsable={false}
                style={styles.menuNavTabTouchable}
                onPress={onPressMuscles}
                accessibilityRole="button"
                accessibilityLabel="Targets tab"
                onLayout={() => syncMainNavIndicatorIfSlotActive('muscles')}>
                <View style={styles.menuNavSlotAnchor}>
                  <Image
                    source={require('../../../assets/images/targetlogo.png')}
                    style={[
                      styles.menuNavTargetIcon,
                      activeTab === 'muscles' ? styles.menuNavIconActive : styles.menuNavIconInactive,
                    ]}
                    fadeDuration={0}
                  />
                  <Text
                    style={[
                      styles.menuNavTabLabel,
                      activeTab === 'muscles' ? styles.menuNavTabLabelActive : styles.menuNavTabLabelInactive,
                    ]}>
                    Targets
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                ref={mainNavSlotSettingsRef}
                collapsable={false}
                style={styles.menuNavTabTouchable}
                onPress={onPressSettings}
                accessibilityRole="button"
                accessibilityLabel="More"
                onLayout={() => syncMainNavIndicatorIfSlotActive('settings')}>
                <View style={styles.menuNavSlotAnchor}>
                  <MenuNavMoreDotsIcon active={activeTab === 'settings'} />
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
        <View style={styles.menuNavFabWrap}>
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
