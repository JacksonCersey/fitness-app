import React, { memo, useEffect, useRef } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { SHARED_ACCENTS } from '../theme/gameTheme';
import { Animated, Text, View } from 'react-native';

const SHOW_MS = 3200;
const SLIDE_MS = 420;

/**
 * @param {{
 *   event: { kind: string; title: string; subtitle: string } | null;
 *   topInset?: number;
 *   embeddedInLogSheet?: boolean;
 *   onDismiss: () => void;
 * }} props
 */
function WorkoutCelebrationBanner({ event, topInset = 0, embeddedInLogSheet = false, onDismiss }) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const playKey = event?.id ?? null;

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!playKey) {
      translateY.setValue(-120);
      opacity.setValue(0);
      return undefined;
    }

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 70,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: SLIDE_MS,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismissRef.current();
      });
    }, SHOW_MS);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [playKey, opacity, translateY]);

  if (!event) return null;

  const accent =
    event.kind === 'e1rm_pr' || event.kind === 'weight_pr' || event.kind === 'rep_pr'
      ? SHARED_ACCENTS.prGreen
      : SHARED_ACCENTS.prBlue;

  const bannerTop = embeddedInLogSheet ? 8 : topInset + 52;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.workoutCelebrationBannerHost, { top: bannerTop }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.workoutCelebrationBannerWrap,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${event.title}. ${event.subtitle}`}>
        <View style={[styles.workoutCelebrationBannerCard, { borderColor: accent }]}>
          <View style={[styles.workoutCelebrationAccentBar, { backgroundColor: accent }]} />
          <View style={styles.workoutCelebrationTextCol}>
            <Text style={[styles.workoutCelebrationTitle, { color: wt.textPrimary }]}>{event.title}</Text>
            <Text style={[styles.workoutCelebrationSubtitle, { color: wt.textSecondary }]} numberOfLines={2}>
              {event.subtitle}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default memo(WorkoutCelebrationBanner);
