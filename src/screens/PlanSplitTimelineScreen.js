import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import { usePlanSplitTransition } from '../app/context/PlanSplitTransitionContext';
import PlanSplitTimelineCard from '../components/plan/PlanSplitTimelineCard';
import PlanTimelineDayDot from '../components/plan/PlanTimelineDayDot';
import PlanSplitDayTypeSheet from '../components/plan/PlanSplitDayTypeSheet';
import { isSplitPlanTrainingDay } from '../data/weeklySplitPlanner';
import {
  PLAN_DAY_LABELS,
  getWorkoutPlanForDay,
} from '../data/workoutPlans';
import { countSplitTypeSessions } from '../utils/homeDashboard';
import { getSplitDayAccentColor } from '../utils/splitDayColors';

const TOP_FADE_BASE_HEIGHT = 72;
const BOTTOM_FADE_BASE_HEIGHT = 56;
const CONTENT_FADE_MS = 280;
const DRAG_GHOST_SIZE = 48;
/** Display order: Sunday first (matches Plan weekday bar), still keyed by Mon-based planIndex. */
const SUN_FIRST_PLAN_INDEXES = [6, 0, 1, 2, 3, 4, 5];

function presentBottomSheet(ref) {
  requestAnimationFrame(() => {
    if (ref.current) {
      ref.current.present();
      return;
    }
    setTimeout(() => ref.current?.present(), 50);
  });
}

function measureNodeInWindow(nodeOrRef) {
  return new Promise((resolve) => {
    const node = nodeOrRef?.current ?? nodeOrRef;
    if (!node || typeof node.measureInWindow !== 'function') {
      resolve({ x: 0, y: 0, width: 48, height: 48 });
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      resolve({
        x: Number(x) || 0,
        y: Number(y) || 0,
        width: Number(width) || 48,
        height: Number(height) || 48,
      });
    });
  });
}

function findDropTargetPlanIndex(absoluteX, absoluteY, frames) {
  let bestIndex = null;
  let bestDist = Infinity;
  for (let planIndex = 0; planIndex < 7; planIndex += 1) {
    const frame = frames[planIndex];
    if (!frame) continue;
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    const dist = Math.hypot(absoluteX - centerX, absoluteY - centerY);
    const hitPad = 32;
    const inside =
      absoluteX >= frame.x - hitPad &&
      absoluteX <= frame.x + frame.width + hitPad &&
      absoluteY >= frame.y - hitPad &&
      absoluteY <= frame.y + frame.height + hitPad;
    if (inside && dist < bestDist) {
      bestDist = dist;
      bestIndex = planIndex;
    }
  }
  return bestIndex;
}

function PlanTimelineTopFade({ height, color, width }) {
  const styles = useStyles();
  const gradientId = useId().replace(/:/g, '_');
  const fadeWidth = Math.max(1, width);
  const fadeHeight = Math.max(1, height);

  return (
    <View
      pointerEvents="none"
      style={[styles.planTimelineTopFade, { height: fadeHeight }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={fadeWidth} height={fadeHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="0.45" stopColor={color} stopOpacity="0.72" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={fadeWidth} height={fadeHeight} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

function PlanTimelineBottomFade({ height, color, width }) {
  const styles = useStyles();
  const gradientId = useId().replace(/:/g, '_');
  const fadeWidth = Math.max(1, width);
  const fadeHeight = Math.max(1, height);

  return (
    <View
      pointerEvents="none"
      style={[styles.planTimelineBottomFade, { height: fadeHeight }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={fadeWidth} height={fadeHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0" />
            <Stop offset="0.45" stopColor={color} stopOpacity="0.55" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={fadeWidth} height={fadeHeight} fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

function PlanSplitTimelineScreen({
  screenTransitionOpacity,
  onBack,
  weeklySplitPlan,
  dayWorkoutAssignments,
  savedWorkoutPlans,
  workoutHistory,
  exerciseLookup,
  onSwapSplitDays,
  onChangeWeeklySplitPlan,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const topFadeHeight = insets.top + TOP_FADE_BASE_HEIGHT;
  const bottomFadeHeight = insets.bottom + BOTTOM_FADE_BASE_HEIGHT;
  const iconRefs = useRef([]);
  const scrollRef = useRef(null);
  const scrollOffsetYRef = useRef(0);
  const scrollToTopResolveRef = useRef(null);
  const returningRef = useRef(false);
  const typeSheetRef = useRef(null);
  const dragFramesRef = useRef([]);
  const draggingFromRef = useRef(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const [draggingFrom, setDraggingFrom] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [ghost, setGhost] = useState(null);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [typeTargetPlanIndex, setTypeTargetPlanIndex] = useState(0);

  const {
    phase,
    isBusy,
    timelineIconsHidden,
    timelineContentVisible,
    startReverse,
    registerTimelineTargets,
  } = usePlanSplitTransition();

  const timelineDays = useMemo(() => {
    const days = weeklySplitPlan?.days ?? [];
    return SUN_FIRST_PLAN_INDEXES.map((planIndex) => {
      const dayEntry = days[planIndex] ?? { type: 'rest', mixedMuscles: [] };
      const isTraining = isSplitPlanTrainingDay(dayEntry);
      const workoutPlan = isTraining
        ? getWorkoutPlanForDay(dayWorkoutAssignments, savedWorkoutPlans, planIndex, dayEntry)
        : null;

      return {
        planIndex,
        dayEntry,
        isTraining,
        dayLetter: PLAN_DAY_LABELS[planIndex]?.charAt(0) ?? '?',
        accent: getSplitDayAccentColor(dayEntry?.type, theme),
        workoutPlan,
        exerciseCount: Array.isArray(workoutPlan?.exercises) ? workoutPlan.exercises.length : 0,
        completionCount: isTraining
          ? countSplitTypeSessions(workoutHistory, weeklySplitPlan, dayEntry.type)
          : 0,
      };
    });
  }, [weeklySplitPlan, dayWorkoutAssignments, savedWorkoutPlans, workoutHistory, theme]);

  const measureIconFrames = useCallback(async () => {
    return Promise.all(
      Array.from({ length: 7 }, (_, planIndex) => measureNodeInWindow(iconRefs.current[planIndex])),
    );
  }, []);

  const getDayStyles = useCallback(() => {
    const byPlanIndex = Array.from({ length: 7 }, () => ({
      accent: '#64748B',
      isRest: true,
      borderColor: theme.textMuted,
    }));
    timelineDays.forEach((row) => {
      byPlanIndex[row.planIndex] = {
        accent: getSplitDayAccentColor(row.dayEntry?.type, theme),
        isRest: !row.isTraining,
        borderColor: theme.textMuted,
      };
    });
    return byPlanIndex;
  }, [timelineDays, theme]);

  useEffect(() => {
    contentOpacity.stopAnimation();
    Animated.timing(contentOpacity, {
      toValue: timelineContentVisible ? 1 : 0,
      duration: CONTENT_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [timelineContentVisible, contentOpacity]);

  useEffect(() => {
    if (phase !== 'forward') return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const frames = await measureIconFrames();
      if (!cancelled) registerTimelineTargets(frames);
    }, 48);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase, measureIconFrames, registerTimelineTargets]);

  const clearDrag = useCallback(() => {
    draggingFromRef.current = null;
    setDraggingFrom(null);
    setDropTarget(null);
    setGhost(null);
    setScrollLocked(false);
  }, []);

  const promptSwapDays = useCallback(
    (fromIndex, toIndex) => {
      const fromLabel = PLAN_DAY_LABELS[fromIndex] ?? 'Day';
      const toLabel = PLAN_DAY_LABELS[toIndex] ?? 'Day';
      Alert.alert('Swap days?', `Swap ${fromLabel} and ${toLabel}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just this week',
          onPress: () => {
            Alert.alert(
              'Coming soon',
              'Swapping for just this week isn’t available yet. Choose Every week to update your repeating plan.',
            );
          },
        },
        {
          text: 'Every week',
          onPress: () => onSwapSplitDays?.(fromIndex, toIndex),
        },
      ]);
    },
    [onSwapSplitDays],
  );

  const handleDragStart = useCallback(
    (planIndex, absoluteX, absoluteY) => {
      if (isBusy) return;
      draggingFromRef.current = planIndex;
      setDraggingFrom(planIndex);
      setScrollLocked(true);
      setDropTarget(null);
      const row = timelineDays.find((item) => item.planIndex === planIndex);
      setGhost({
        x: absoluteX - DRAG_GHOST_SIZE / 2,
        y: absoluteY - DRAG_GHOST_SIZE / 2,
        accent: row?.accent ?? theme.textMuted,
        isTraining: Boolean(row?.isTraining),
      });
      measureIconFrames().then((frames) => {
        dragFramesRef.current = frames;
      });
    },
    [isBusy, measureIconFrames, theme.textMuted, timelineDays],
  );

  const handleDragMove = useCallback((absoluteX, absoluteY) => {
    if (draggingFromRef.current == null) return;
    setGhost((previous) =>
      previous
        ? {
            ...previous,
            x: absoluteX - DRAG_GHOST_SIZE / 2,
            y: absoluteY - DRAG_GHOST_SIZE / 2,
          }
        : previous,
    );
    const target = findDropTargetPlanIndex(absoluteX, absoluteY, dragFramesRef.current);
    setDropTarget(target != null && target !== draggingFromRef.current ? target : null);
  }, []);

  const handleDragEnd = useCallback(
    (absoluteX, absoluteY) => {
      const fromIndex = draggingFromRef.current;
      const toIndex = findDropTargetPlanIndex(absoluteX, absoluteY, dragFramesRef.current);
      clearDrag();
      if (fromIndex == null || toIndex == null || fromIndex === toIndex) return;
      promptSwapDays(fromIndex, toIndex);
    },
    [clearDrag, promptSwapDays],
  );

  const handleDragCancel = useCallback(() => {
    clearDrag();
  }, [clearDrag]);

  const typeTargetDayEntry = useMemo(
    () => weeklySplitPlan?.days?.[typeTargetPlanIndex] ?? { type: 'rest', mixedMuscles: [] },
    [weeklySplitPlan, typeTargetPlanIndex],
  );

  const syncTypeSheetClosed = useCallback(() => {
    setTypeSheetOpen(false);
  }, []);

  const openTypeSheet = useCallback(
    (planIndex) => {
      if (isBusy || draggingFrom != null) return;
      setTypeTargetPlanIndex(planIndex);
      setTypeSheetOpen(true);
      presentBottomSheet(typeSheetRef);
    },
    [draggingFrom, isBusy],
  );

  const handleChangeDayType = useCallback(
    (planIndex, nextDay) => {
      if (!onChangeWeeklySplitPlan || !weeklySplitPlan?.days) return;
      const type = String(nextDay?.type || '').trim();
      if (!type) return;
      const nextDays = weeklySplitPlan.days.map((day, index) => {
        if (index !== planIndex) return day;
        if (type === 'mixed') {
          return {
            type: 'mixed',
            mixedMuscles: Array.isArray(nextDay.mixedMuscles) ? [...nextDay.mixedMuscles] : [],
          };
        }
        return { type, mixedMuscles: [] };
      });
      onChangeWeeklySplitPlan({ days: nextDays });
    },
    [onChangeWeeklySplitPlan, weeklySplitPlan],
  );

  const handleScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollOffsetYRef.current = y;
    // Resolve pending back-navigation as soon as the smooth scroll reaches the top.
    if (scrollToTopResolveRef.current && y <= 1) {
      const resolve = scrollToTopResolveRef.current;
      scrollToTopResolveRef.current = null;
      resolve();
    }
  }, []);

  const scrollToTopSmooth = useCallback(() => {
    if (scrollOffsetYRef.current <= 1) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      scrollToTopResolveRef.current = resolve;
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      // Safety only — normally onScroll resolves as soon as y hits 0.
      setTimeout(() => {
        if (scrollToTopResolveRef.current === resolve) {
          scrollToTopResolveRef.current = null;
          resolve();
        }
      }, 450);
    });
  }, []);

  const handleBack = useCallback(async () => {
    if (isBusy || draggingFrom != null || returningRef.current) return;
    returningRef.current = true;
    // Smooth scroll when needed; starts reverse as soon as we're at the top (no fixed wait).
    await scrollToTopSmooth();
    const frames = await measureIconFrames();
    startReverse({
      frames,
      styles: getDayStyles(),
      navigateHome: () => onBack?.(),
    });
  }, [draggingFrom, getDayStyles, isBusy, measureIconFrames, onBack, scrollToTopSmooth, startReverse]);

  const underlayTransparent = phase === 'forward' || phase === 'reverse';
  const dragEnabled = !isBusy && timelineContentVisible && Boolean(onSwapSplitDays);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView
          style={[
            styles.planTimelineScreen,
            underlayTransparent ? { backgroundColor: 'transparent' } : null,
          ]}
          edges={['top', 'left', 'right']}>
          <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity, flex: 1 }]}>
            <View
              style={[
                styles.planTimelineBody,
                styles.historyProgressBody,
                underlayTransparent ? { backgroundColor: 'transparent' } : null,
              ]}>
              <View
                style={[
                  styles.planScreenTitleSection,
                  phase === 'reverse' ? { opacity: 0 } : null,
                ]}>
                <View style={styles.planScreenTitleRow}>
                  <Text style={styles.planScreenTitle}>Week Split</Text>
                  <Image
                    source={require('../../assets/images/icons/calendaricon.png')}
                    style={styles.planScreenTitleIcon}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                  />
                </View>
              </View>

              <ScrollView
                ref={scrollRef}
                style={styles.planTimelineScroll}
                contentContainerStyle={[
                  styles.planTimelineScrollContent,
                  { paddingBottom: bottomFadeHeight + 24 },
                ]}
                scrollEnabled={!isBusy && !scrollLocked}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}>
                <View style={styles.planTimelineList}>
                  {timelineDays.map((row, index) => {
                    const isLast = index === timelineDays.length - 1;
                    return (
                      <View key={row.planIndex} style={styles.planTimelineRow}>
                        <View style={styles.planTimelineRail}>
                          {!isLast ? (
                            <Animated.View
                              style={[styles.planTimelineConnector, { opacity: contentOpacity }]}
                              pointerEvents="none"
                            />
                          ) : null}
                          <PlanTimelineDayDot
                            planIndex={row.planIndex}
                            accent={row.accent}
                            isTraining={row.isTraining}
                            borderColor={theme.textMuted}
                            dayLetter={row.dayLetter}
                            letterOpacity={contentOpacity}
                            iconsHidden={timelineIconsHidden}
                            dragEnabled={dragEnabled}
                            isDragSource={draggingFrom === row.planIndex}
                            isDropTarget={dropTarget === row.planIndex}
                            circleRef={(node) => {
                              iconRefs.current[row.planIndex] = node;
                            }}
                            onDragStart={handleDragStart}
                            onDragMove={handleDragMove}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                          />
                        </View>

                        <Animated.View
                          style={[styles.planTimelineCardSlot, { opacity: contentOpacity }]}
                          pointerEvents={timelineContentVisible && draggingFrom == null ? 'auto' : 'none'}>
                          <PlanSplitTimelineCard
                            isRest={!row.isTraining}
                            workoutPlan={row.workoutPlan}
                            dayEntry={row.dayEntry}
                            exerciseLookup={exerciseLookup}
                            exerciseCount={row.exerciseCount}
                            completionCount={row.completionCount}
                            onPressType={() => openTypeSheet(row.planIndex)}
                          />
                        </Animated.View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <Animated.View style={{ opacity: contentOpacity }} pointerEvents="none">
                <PlanTimelineTopFade height={topFadeHeight} color={theme.screenBg} width={screenWidth} />
              </Animated.View>

              <Animated.View style={{ opacity: contentOpacity }} pointerEvents="none">
                <PlanTimelineBottomFade height={bottomFadeHeight} color={theme.screenBg} width={screenWidth} />
              </Animated.View>

              <Animated.View
                style={[styles.planTimelineHeaderOverlay, { opacity: contentOpacity }]}
                pointerEvents={timelineContentVisible && draggingFrom == null ? 'box-none' : 'none'}>
                <TouchableOpacity
                  style={styles.planTimelineBackButton}
                  activeOpacity={0.85}
                  onPress={handleBack}
                  disabled={isBusy || draggingFrom != null}
                  accessibilityRole="button"
                  accessibilityLabel="Go back">
                  <Text style={styles.homeTopBackToTodayText}>‹</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {typeSheetOpen ? (
            <PlanSplitDayTypeSheet
              ref={typeSheetRef}
              planIndex={typeTargetPlanIndex}
              dayEntry={typeTargetDayEntry}
              onChangeDayType={handleChangeDayType}
              onDismiss={syncTypeSheetClosed}
            />
          ) : null}
        </SafeAreaView>
      </BottomSheetModalProvider>

      {ghost ? (
        <View
          pointerEvents="none"
          style={[
            styles.planTimelineDragGhost,
            {
              left: ghost.x,
              top: ghost.y,
              backgroundColor: ghost.isTraining ? ghost.accent : 'transparent',
              borderColor: ghost.isTraining ? ghost.accent : theme.textMuted,
            },
          ]}
        />
      ) : null}
    </GestureHandlerRootView>
  );
}

export default memo(PlanSplitTimelineScreen);
