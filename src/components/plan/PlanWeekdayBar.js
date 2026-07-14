import React, { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Animated as RNAnimated, Image, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { isSplitPlanTrainingDay } from '../../data/weeklySplitPlanner';
import { getSplitDayAccentColor } from '../../utils/splitDayColors';

const SUN_FIRST_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SELECTION_ANIM_MS = 240;
const HERO_FADE_MS = 220;

function planIndexFromSunFirstColumn(colIndex) {
  return (colIndex + 6) % 7;
}

function measureNodeInWindow(nodeOrRef) {
  return new Promise((resolve) => {
    const node = nodeOrRef?.current ?? nodeOrRef;
    if (!node || typeof node.measureInWindow !== 'function') {
      resolve({ x: 0, y: 0, width: 22, height: 22 });
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      resolve({
        x: Number(x) || 0,
        y: Number(y) || 0,
        width: Number(width) || 22,
        height: Number(height) || 22,
      });
    });
  });
}

function PlanWeekdayDayCell({
  letter,
  planIndex,
  dayEntry,
  isSelected,
  onSelectDay,
  gameTheme,
  heroMode,
  heroSnapHide,
  dotsHidden,
  circleRef,
}) {
  const styles = useStyles();
  const isTraining = isSplitPlanTrainingDay(dayEntry);
  const accent = getSplitDayAccentColor(dayEntry?.type, gameTheme);
  const selectedProgress = useSharedValue(isSelected ? 1 : 0);
  const heroHideProgress = useSharedValue(heroMode ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: SELECTION_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSelected, selectedProgress]);

  useEffect(() => {
    if (heroMode && heroSnapHide) {
      heroHideProgress.value = 1;
      return;
    }
    heroHideProgress.value = withTiming(heroMode ? 1 : 0, {
      duration: HERO_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [heroMode, heroSnapHide, heroHideProgress]);

  const underlineAnimatedStyle = useAnimatedStyle(() => ({
    // selectedProgress alone would override a static opacity:0 — multiply by hero hide.
    opacity: selectedProgress.value * (1 - heroHideProgress.value),
    transform: [{ scaleX: interpolate(selectedProgress.value, [0, 1], [0.2, 1]) }],
  }));

  const chromeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - heroHideProgress.value,
  }));

  return (
    <TouchableOpacity
      style={styles.planWeekdayCell}
      onPress={() => onSelectDay(planIndex)}
      disabled={heroMode}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${letter}, ${dayEntry?.type ?? 'rest'} day`}>
      <Animated.Text
        style={[
          styles.planWeekdayLetter,
          isSelected && styles.planWeekdayLetterSelected,
          chromeAnimatedStyle,
        ]}>
        {letter}
      </Animated.Text>
      <View style={styles.planWeekdayDotStack}>
        <View style={styles.planWeekdayCircleWrap}>
          <View
            ref={circleRef}
            collapsable={false}
            style={[
              styles.planWeekdayCircle,
              isTraining
                ? { backgroundColor: accent, borderColor: accent }
                : { backgroundColor: 'transparent', borderColor: gameTheme.textMuted },
              dotsHidden && styles.planWeekdayHeroHidden,
            ]}
          />
        </View>
        <Animated.View style={[styles.planWeekdayUnderline, underlineAnimatedStyle]} />
      </View>
    </TouchableOpacity>
  );
}

const PlanWeekdayBar = forwardRef(function PlanWeekdayBar(
  {
    weeklySplitPlan,
    selectedPlanIndex,
    onSelectDay,
    onPressEditSplit,
    heroMode = false,
    heroSnapHide = false,
    dotsHidden = false,
    editOpacity = 1,
  },
  ref,
) {
  const styles = useStyles();
  const theme = useGameTheme();
  const days = useMemo(() => weeklySplitPlan?.days ?? [], [weeklySplitPlan]);
  const circleRefs = useRef([]);

  useImperativeHandle(
    ref,
    () => ({
      async measureDotFrames() {
        const frames = [];
        for (let planIndex = 0; planIndex < 7; planIndex += 1) {
          frames[planIndex] = await measureNodeInWindow(circleRefs.current[planIndex]);
        }
        return frames;
      },
      getDayStyles() {
        return Array.from({ length: 7 }, (_, planIndex) => {
          const dayEntry = days[planIndex] ?? { type: 'rest', mixedMuscles: [] };
          const isRest = !isSplitPlanTrainingDay(dayEntry);
          return {
            accent: getSplitDayAccentColor(dayEntry?.type, theme),
            isRest,
            borderColor: theme.textMuted,
          };
        });
      },
    }),
    [days, theme],
  );

  return (
    <View style={styles.planWeekdayShell}>
      <View
        style={[
          styles.planWeekdayBar,
          heroMode && styles.planWeekdayBarHero,
        ]}>
        {SUN_FIRST_LETTERS.map((letter, colIndex) => {
          const planIndex = planIndexFromSunFirstColumn(colIndex);

          return (
            <PlanWeekdayDayCell
              key={`${letter}-${colIndex}`}
              letter={letter}
              planIndex={planIndex}
              dayEntry={days[planIndex]}
              isSelected={selectedPlanIndex === planIndex}
              onSelectDay={onSelectDay}
              gameTheme={theme}
              heroMode={heroMode}
              heroSnapHide={heroSnapHide}
              dotsHidden={dotsHidden}
              circleRef={(node) => {
                circleRefs.current[planIndex] = node;
              }}
            />
          );
        })}
      </View>
      <RNAnimated.View
        style={{ opacity: editOpacity }}
        pointerEvents={heroMode ? 'none' : 'auto'}>
        <TouchableOpacity
          style={styles.planEditButton}
          onPress={onPressEditSplit}
          disabled={heroMode}
          accessibilityRole="button"
          accessibilityLabel="Edit split">
          <Image
            source={require('../../../assets/images/icons/editicon.png')}
            style={styles.planEditButtonIcon}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </TouchableOpacity>
      </RNAnimated.View>
    </View>
  );
});

export default memo(PlanWeekdayBar);
