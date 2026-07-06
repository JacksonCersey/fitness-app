import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { MAIN_TAB_SCREEN_KEYS, MAIN_TAB_FADE_OUT_MS } from '../constants/layout';
import HistoryTabScreen from '../screens/HistoryTabScreen';
import MainTabsWeightLogModal from '../screens/MainTabsWeightLogModal';
import MenuHomeTabScreen from '../screens/MenuHomeTabScreen';
import MoreHubTabScreen from '../screens/MoreHubTabScreen';
import MuscleMapTabScreen from '../screens/MuscleMapTabScreen';

const TAB_SCREEN_KEYS = ['menu', 'settings', 'history', 'muscles'];

function createPanelOpacities(initialActive) {
  return TAB_SCREEN_KEYS.reduce((acc, key) => {
    acc[key] = new Animated.Value(key === initialActive ? 1 : 0);
    return acc;
  }, /** @type {Record<string, Animated.Value>} */ ({}));
}

function MainTabPanel({ screenKey, activeScreen, outgoingScreen, panelOpacity, children }) {
  const isActive = activeScreen === screenKey;
  const isOutgoing = outgoingScreen === screenKey;
  const zIndex = isOutgoing ? 2 : isActive ? 1 : 0;
  const canInteract = isActive && !isOutgoing;

  return (
    <Animated.View
      style={[styles.panel, { zIndex, opacity: panelOpacity }]}
      collapsable={false}
      pointerEvents={canInteract ? 'auto' : 'none'}
      accessibilityElementsHidden={!canInteract}
      importantForAccessibility={canInteract ? 'auto' : 'no-hide-descendants'}>
      {children}
    </Animated.View>
  );
}

/**
 * Keeps all bottom-tab screens mounted so switching tabs does not rebuild heavy trees.
 * Tab switches fade the outgoing screen out over the incoming screen underneath.
 */
function MainTabsRoot({ activeScreen, menu, settings, history, muscles, weightLog }) {
  const panelOpacitiesRef = useRef(null);
  if (!panelOpacitiesRef.current) {
    panelOpacitiesRef.current = createPanelOpacities(activeScreen);
  }
  const panelOpacities = panelOpacitiesRef.current;

  const [committedActive, setCommittedActive] = useState(activeScreen);
  const [outgoingScreen, setOutgoingScreen] = useState(null);
  const isReadyForTabTransitions = useRef(false);
  const animationGenerationRef = useRef(0);

  useLayoutEffect(() => {
    isReadyForTabTransitions.current = true;
  }, []);

  // Sync opacities + outgoing layer during render so the first painted frame is correct.
  if (activeScreen !== committedActive) {
    const previousActive = committedActive;
    const shouldAnimate =
      isReadyForTabTransitions.current &&
      MAIN_TAB_SCREEN_KEYS.has(activeScreen) &&
      MAIN_TAB_SCREEN_KEYS.has(previousActive) &&
      previousActive !== activeScreen;

    TAB_SCREEN_KEYS.forEach((key) => {
      const opacity = panelOpacities[key];
      opacity.stopAnimation();
      if (key === activeScreen) {
        opacity.setValue(1);
      } else if (shouldAnimate && key === previousActive) {
        opacity.setValue(1);
      } else {
        opacity.setValue(0);
      }
    });

    setCommittedActive(activeScreen);
    setOutgoingScreen(shouldAnimate ? previousActive : null);
  }

  useLayoutEffect(() => {
    if (!outgoingScreen) return undefined;

    const leaving = outgoingScreen;
    animationGenerationRef.current += 1;
    const generation = animationGenerationRef.current;
    const outgoingOpacity = panelOpacities[leaving];
    if (!outgoingOpacity) return undefined;

    const animation = Animated.timing(outgoingOpacity, {
      toValue: 0,
      duration: MAIN_TAB_FADE_OUT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (!finished || animationGenerationRef.current !== generation) return;
      setOutgoingScreen((current) => (current === leaving ? null : current));
    });

    return () => {
      animation.stop();
    };
  }, [outgoingScreen, activeScreen, panelOpacities]);

  return (
    <View style={styles.stack} pointerEvents="box-none">
      <MainTabPanel
        screenKey="menu"
        activeScreen={activeScreen}
        outgoingScreen={outgoingScreen}
        panelOpacity={panelOpacities.menu}>
        <MenuHomeTabScreen {...menu} />
      </MainTabPanel>
      <MainTabPanel
        screenKey="settings"
        activeScreen={activeScreen}
        outgoingScreen={outgoingScreen}
        panelOpacity={panelOpacities.settings}>
        <MoreHubTabScreen {...settings} />
      </MainTabPanel>
      <MainTabPanel
        screenKey="history"
        activeScreen={activeScreen}
        outgoingScreen={outgoingScreen}
        panelOpacity={panelOpacities.history}>
        <HistoryTabScreen {...history} />
      </MainTabPanel>
      <MainTabPanel
        screenKey="muscles"
        activeScreen={activeScreen}
        outgoingScreen={outgoingScreen}
        panelOpacity={panelOpacities.muscles}>
        <MuscleMapTabScreen {...muscles} />
      </MainTabPanel>
      <MainTabsWeightLogModal {...weightLog} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    position: 'relative',
  },
  panel: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default memo(MainTabsRoot);
