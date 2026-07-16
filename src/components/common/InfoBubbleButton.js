import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';

const ENTER_MS = 200;
const EXIT_MS = 200;
const EXIT_EASE = Easing.out(Easing.cubic);

/**
 * Glass info popup — same bubble look as the home level-select press popup.
 * @param {{
 *   title: string;
 *   message: string;
 *   accessibilityLabel?: string;
 * }} props
 */
function InfoBubbleButton({ title, message, accessibilityLabel = 'More information' }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const buttonRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState(null);

  /** Keep Modal mounted for exit; RN `visible={false}` would skip fade-out. */
  const [presented, setPresented] = useState(false);
  const presentedRef = useRef(false);
  const closingRef = useRef(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  const frozenRef = useRef({ title, message, anchor });
  if (visible) {
    frozenRef.current = { title, message, anchor };
  }

  const activeTitle = visible ? title : frozenRef.current.title;
  const activeMessage = visible ? message : frozenRef.current.message;
  const activeAnchor = visible ? anchor : frozenRef.current.anchor;

  const paragraphs = useMemo(
    () =>
      String(activeMessage || '')
        .split(/\n\n+/)
        .map((part) => part.trim())
        .filter(Boolean),
    [activeMessage],
  );

  const bubblePositionStyle = useMemo(() => {
    if (!activeAnchor) {
      return { top: windowHeight * 0.28, left: 16, right: 16 };
    }
    const gapBelow = 10;
    const preferredTop = activeAnchor.y + activeAnchor.height + gapBelow;
    // Keep bubble on-screen if the button is near the bottom.
    const maxTop = Math.max(24, windowHeight - 280);
    return {
      left: 16,
      right: 16,
      top: Math.min(preferredTop, maxTop),
    };
  }, [activeAnchor, windowHeight]);

  const unmountAfterExit = useCallback(() => {
    closingRef.current = false;
    presentedRef.current = false;
    setPresented(false);
  }, []);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      presentedRef.current = true;
      setPresented(true);
      opacity.value = 0;
      translateY.value = 6;
      opacity.value = withTiming(1, { duration: ENTER_MS, easing: EXIT_EASE });
      translateY.value = withTiming(0, { duration: ENTER_MS, easing: EXIT_EASE });
      return;
    }

    if (!presentedRef.current || closingRef.current) return;

    closingRef.current = true;
    opacity.value = withTiming(0, { duration: EXIT_MS, easing: EXIT_EASE });
    translateY.value = withTiming(8, { duration: EXIT_MS, easing: EXIT_EASE }, (finished) => {
      if (finished) {
        runOnJS(unmountAfterExit)();
      }
    });
  }, [opacity, translateY, unmountAfterExit, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const open = useCallback(() => {
    const show = (nextAnchor) => {
      setAnchor(nextAnchor);
      setVisible(true);
    };

    if (buttonRef.current?.measureInWindow) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        show({ x, y, width, height });
      });
      return;
    }

    show(null);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setAnchor(null);
  }, []);

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.progressStrengthBodyInfoBtn}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}>
          <Text style={styles.progressStrengthBodyInfoBtnText}>i</Text>
        </TouchableOpacity>
      </View>

      {presented ? (
        <Modal transparent animationType="none" visible={presented} onRequestClose={close}>
          <Animated.View style={[styles.homeMuscleBubbleOverlay, overlayStyle]} accessibilityViewIsModal>
            <Pressable
              style={styles.homeMuscleBubbleBackdropPress}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            />

            <Animated.View
              style={[
                styles.homeMuscleBubble,
                bubblePositionStyle,
                bubbleStyle,
                { borderColor: theme.borderSubtle, maxWidth: windowWidth - 32 },
              ]}
              accessibilityLabel={activeTitle}>
              <View
                style={[
                  styles.homeMuscleBubbleTail,
                  {
                    backgroundColor: theme.innerCardBg,
                    borderColor: theme.borderSubtle,
                  },
                ]}
              />
              <BlurView intensity={48} tint="dark" style={styles.homeMuscleBubbleGlass}>
                <View style={styles.homeMuscleBubbleInner}>
                  <Text style={styles.homeMuscleBubbleTitle}>{activeTitle}</Text>
                  {paragraphs.map((paragraph, index) => (
                    <Text
                      key={`${index}-${paragraph.slice(0, 12)}`}
                      style={[
                        styles.homeMuscleBubbleEmpty,
                        index === 0 ? { marginTop: 10 } : { marginTop: 12 },
                      ]}>
                      {paragraph}
                    </Text>
                  ))}
                  <TouchableOpacity
                    style={[styles.infoBubbleGotItBtn, { backgroundColor: theme.navAccent }]}
                    activeOpacity={0.88}
                    onPress={close}
                    accessibilityRole="button"
                    accessibilityLabel="Got it">
                    <Text style={styles.infoBubbleGotItBtnText}>Got it</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          </Animated.View>
        </Modal>
      ) : null}
    </>
  );
}

export default memo(InfoBubbleButton);
