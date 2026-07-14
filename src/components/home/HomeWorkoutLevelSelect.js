import React, { memo, useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useStyles } from '../../app/context/ThemeStylesContext';
import {
  buildDateRangeAround,
  formatWeekdayShort,
  getSplitEntryForDate,
  indexOfSameDay,
  isSameLocalDay,
  isTodayLocalDay,
  shouldLevelCircleUseAccentColor,
  startOfLocalDay,
} from '../../utils/homeDashboard';
import { getLevelIconSource } from '../../utils/levelIcons';
import { SPLIT_DAY_TYPE_LABELS } from '../../data/weeklySplitPlanner';
import HomeSplitDayMuscleModal from './HomeSplitDayMuscleModal';

const LEVEL_CELL_WIDTH = 104;
const DAYS_BEFORE = 7;
const DAYS_AFTER = 7;
/** Matches `homeScreenContent` horizontal padding in MenuHomeTabScreen. */
const PARENT_HORIZONTAL_PADDING = 16;

const RING_BOUNCE_CYCLE_MS = 1400;
const RING_SCALE_MIN = 1;
const RING_SCALE_MAX = 1.05;
const RING_OPACITY_MIN = 0.28;
const RING_OPACITY_MAX = 0.72;
const RING_STROKE_WIDTH = 4;
const RING_ARC_DEGREES = 105;
const RING_GAP_DEGREES = 15;
/** SVG circles start at 3 o'clock; 90° is 6 o'clock (bottom). */
const RING_BOTTOM_GAP_CENTER_DEG = 90;

/**
 * Three arc segments with gaps at 6, 10, and 2 o'clock (bottom + symmetric upper pair).
 */
function getTripleArcDash(radius) {
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (RING_ARC_DEGREES / 360);
  const gap = circumference * (RING_GAP_DEGREES / 360);
  const defaultFirstGapCenter = RING_ARC_DEGREES + RING_GAP_DEGREES / 2;
  const offsetDegrees = defaultFirstGapCenter - RING_BOTTOM_GAP_CENTER_DEG;
  const strokeDashoffset = circumference * (offsetDegrees / 360);

  return { dash, gap, strokeDashoffset };
}

function LevelSelectedBounceRing({ variant = 'icon' }) {
  const styles = useStyles();
  const pulse = useSharedValue(0);
  const isIcon = variant === 'icon';
  const size = isIcon ? 86 : 62;
  const radius = size / 2 - RING_STROKE_WIDTH / 2;
  const { dash, gap, strokeDashoffset } = getTripleArcDash(radius);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: RING_BOUNCE_CYCLE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(pulse);
      pulse.value = 0;
    };
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [RING_OPACITY_MIN, RING_OPACITY_MAX]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [RING_SCALE_MIN, RING_SCALE_MAX]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.homeLevelSelectedRing,
        isIcon ? styles.homeLevelSelectedRingIcon : styles.homeLevelSelectedRingRest,
        animatedStyle,
      ]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={RING_STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
    </Animated.View>
  );
}

function LevelIconDateOverlay({ date, isToday, variant = 'icon' }) {
  const styles = useStyles();

  if (isToday) {
    return null;
  }

  return (
    <View
      style={[
        styles.homeLevelDayDateOverlay,
        variant === 'rest' && styles.homeLevelDayDateOverlayRest,
      ]}
      pointerEvents="none">
      <Text
        style={[
          styles.homeLevelDayWeekday,
          variant === 'rest' && styles.homeLevelDayWeekdayRest,
        ]}>
        {formatWeekdayShort(date)}
      </Text>
      <Text
        style={[
          styles.homeLevelDayNumber,
          variant === 'rest' && styles.homeLevelDayNumberRest,
        ]}>
        {date.getDate()}
      </Text>
    </View>
  );
}

function LevelTodayStar({ variant = 'icon' }) {
  const styles = useStyles();

  return (
    <View
      style={[
        styles.homeLevelTodayStarWrap,
        variant === 'rest' && styles.homeLevelTodayStarWrapRest,
      ]}
      pointerEvents="none">
      <Text style={[styles.homeLevelTodayStar, variant === 'rest' && styles.homeLevelTodayStarRest]}>
        ★
      </Text>
    </View>
  );
}

function LevelDayCircle({ date, dayEntry, isSelected, useAccent, onPress }) {
  const styles = useStyles();
  const isToday = isTodayLocalDay(date);
  const isRest = !dayEntry || dayEntry.type === 'rest';
  const label = SPLIT_DAY_TYPE_LABELS[dayEntry?.type] ?? 'Rest';
  const iconSource = getLevelIconSource(dayEntry, useAccent);

  return (
    <TouchableOpacity
      style={styles.homeLevelCircleCell}
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${label}${isToday ? ', today' : ''}, ${date.toLocaleDateString()}`}>
      {isRest ? (
        <View style={styles.homeLevelRestWrap}>
          {isSelected ? <LevelSelectedBounceRing variant="rest" /> : null}
          <View style={styles.homeLevelCircleRest}>
            {isToday ? (
              <LevelTodayStar variant="rest" />
            ) : (
              <LevelIconDateOverlay
                date={date}
                isToday={isToday}
                variant="rest"
              />
            )}
          </View>
        </View>
      ) : iconSource ? (
        <View style={styles.homeLevelIconShell}>
          {isSelected ? <LevelSelectedBounceRing variant="icon" /> : null}
          <View style={styles.homeLevelIconWrap}>
            <Image
              source={iconSource}
              style={styles.homeLevelIconImage}
              resizeMode="contain"
            />
            {isToday ? <LevelTodayStar /> : null}
            {!isToday ? (
              <LevelIconDateOverlay date={date} isToday={isToday} />
            ) : null}
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

/**
 * @param {{
 *   selectedDate: Date;
 *   onSelectDate: (date: Date) => void;
 *   onScrolledFromTodayChange?: (isScrolledAway: boolean) => void;
 *   weeklySplitPlan: { days: unknown[] } | null | undefined;
 *   workoutHistory: unknown[];
 *   exerciseLookup: Record<string, unknown>;
 *   savedWorkoutPlans?: { id: string }[] | null;
 *   dayWorkoutAssignments?: { assignments: (string | null)[] } | null;
 *   weekPlanDayOverrides?: { weekKey?: string; daySourceByPlanIndex?: number[] } | null;
 *   onStartWorkout?: (date: Date) => void;
 * }} props
 */
const HomeWorkoutLevelSelect = forwardRef(function HomeWorkoutLevelSelect(
  {
    selectedDate,
    onSelectDate,
    onScrolledFromTodayChange,
    weeklySplitPlan,
    workoutHistory,
    exerciseLookup,
    savedWorkoutPlans,
    dayWorkoutAssignments,
    weekPlanDayOverrides,
    onStartWorkout,
  },
  ref,
) {
  const styles = useStyles();
  const { width: screenWidth } = useWindowDimensions();
  const listWidth = screenWidth - PARENT_HORIZONTAL_PADDING * 2;
  const sideInset = Math.max(0, (listWidth - LEVEL_CELL_WIDTH) / 2);
  const listRef = useRef(null);
  const iconTrackRef = useRef(null);
  const hasInitialScroll = useRef(false);
  const isScrollingFromParent = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalEntry, setModalEntry] = useState({ type: 'rest', mixedMuscles: [] });
  const [bubbleAnchor, setBubbleAnchor] = useState(null);

  const dates = useMemo(() => buildDateRangeAround(new Date(), DAYS_BEFORE, DAYS_AFTER), []);
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const todayIndex = useMemo(() => indexOfSameDay(dates, today), [dates, today]);

  const reportScrolledFromToday = useCallback(
    (offsetX) => {
      if (isScrollingFromParent.current) return;
      const index = Math.round(offsetX / LEVEL_CELL_WIDTH);
      const clamped = Math.max(0, Math.min(dates.length - 1, index));
      onScrolledFromTodayChange?.(clamped !== todayIndex);
    },
    [dates.length, onScrolledFromTodayChange, todayIndex],
  );

  const scrollToDay = useCallback(
    (date, animated = true) => {
      const index = indexOfSameDay(dates, date);
      if (index < 0 || !listRef.current) return;
      isScrollingFromParent.current = true;
      listRef.current.scrollToIndex({ index, animated });
      setTimeout(
        () => {
          isScrollingFromParent.current = false;
          onScrolledFromTodayChange?.(index !== todayIndex);
        },
        animated ? 350 : 50,
      );
    },
    [dates, onScrolledFromTodayChange, todayIndex],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToToday: () => scrollToDay(today, true),
    }),
    [scrollToDay, today],
  );

  const handleScroll = useCallback(
    (event) => {
      reportScrolledFromToday(event.nativeEvent.contentOffset.x);
    },
    [reportScrolledFromToday],
  );

  const handleListLayout = useCallback(() => {
    if (hasInitialScroll.current) return;
    hasInitialScroll.current = true;
    requestAnimationFrame(() => scrollToDay(startOfLocalDay(new Date()), false));
  }, [scrollToDay]);

  useEffect(() => {
    if (!hasInitialScroll.current) return;
    scrollToDay(selectedDate, true);
  }, [selectedDate, scrollToDay]);

  const openModalForDate = useCallback(
    (date) => {
      const entry = getSplitEntryForDate(weeklySplitPlan, date, weekPlanDayOverrides);
      setModalDate(date);
      setModalEntry(entry);

      const showModal = (anchor) => {
        setBubbleAnchor(anchor);
        setModalVisible(true);
      };

      if (iconTrackRef.current?.measureInWindow) {
        iconTrackRef.current.measureInWindow((x, y, width, height) => {
          showModal({ x, y, width, height });
        });
        return;
      }

      showModal(null);
    },
    [weekPlanDayOverrides, weeklySplitPlan],
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalDate(null);
    setBubbleAnchor(null);
  }, []);

  const handleCirclePress = useCallback(
    (date, entry) => {
      scrollToDay(date, true);

      if (isSameLocalDay(date, selectedDate) && entry.type !== 'rest') {
        openModalForDate(date);
        return;
      }
      if (!isSameLocalDay(date, selectedDate)) {
        onSelectDate(date);
      }
    },
    [onSelectDate, openModalForDate, scrollToDay, selectedDate],
  );

  const renderDay = useCallback(
    ({ item: date }) => {
      const entry = getSplitEntryForDate(weeklySplitPlan, date, weekPlanDayOverrides);
      const isSelected = isSameLocalDay(date, selectedDate);
      const useAccent = shouldLevelCircleUseAccentColor(date, workoutHistory);

      return (
        <LevelDayCircle
          date={date}
          dayEntry={entry}
          isSelected={isSelected}
          useAccent={useAccent}
          onPress={() => handleCirclePress(date, entry)}
        />
      );
    },
    [handleCirclePress, selectedDate, weekPlanDayOverrides, weeklySplitPlan, workoutHistory],
  );

  return (
    <View style={styles.homeLevelSelectWrap}>
      <HomeSplitDayMuscleModal
        visible={modalVisible}
        date={modalDate}
        dayEntry={modalEntry}
        workoutHistory={workoutHistory}
        exerciseLookup={exerciseLookup}
        savedWorkoutPlans={savedWorkoutPlans}
        dayWorkoutAssignments={dayWorkoutAssignments}
        weekPlanDayOverrides={weekPlanDayOverrides}
        anchor={bubbleAnchor}
        onClose={closeModal}
        onStartWorkout={onStartWorkout}
      />
      <View ref={iconTrackRef} style={[styles.homeLevelSelectIconTrack, { width: listWidth }]}>
        <FlatList
          ref={listRef}
          data={dates}
          keyExtractor={(d) => `level-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
          renderItem={renderDay}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={{ width: listWidth, overflow: 'visible' }}
          contentContainerStyle={{ paddingHorizontal: sideInset, alignItems: 'center', paddingVertical: 4 }}
          getItemLayout={(_, index) => ({
            length: LEVEL_CELL_WIDTH,
            offset: LEVEL_CELL_WIDTH * index,
            index,
          })}
          onScroll={handleScroll}
          onLayout={handleListLayout}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
        />
      </View>
    </View>
  );
});

export default memo(HomeWorkoutLevelSelect);
