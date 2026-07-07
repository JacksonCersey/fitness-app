import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Image, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import AnimatedPageIndicator, { useSyncedPagerScrollX } from '../common/AnimatedPageIndicator';
import { getStreakRankProgress } from '../../data/streakRanks';
import { SHARED_ACCENTS } from '../../theme/gameTheme';
import { getCurrentWeekPerfectCarouselState } from '../../utils/consecutivePerfectWeekStreak';
import { hasLoggedWorkoutInCurrentWeek } from '../../utils/consecutiveWeekStreak';

const PAGE_COUNT = 3;
const AUTO_INTERVAL_MS = 5000;
const CAROUSEL_BADGE_SIZE = 56;
const CAROUSEL_BADGE_STROKE = 3.5;

const STREAK_LOGO_ACTIVE = require('../../../assets/images/streaklogo.png');
const STREAK_LOGO_INACTIVE = require('../../../assets/images/streaklogo-inactive.png');
const PERFECT_STREAK_LOGO_ACTIVE = require('../../../assets/images/perfectstreaklogo.png');

/** Matches the cyan → purple → pink on `perfectstreaklogo.png`. */
const PERFECT_STREAK_RING_GRADIENT = {
  start: '#22D3EE',
  mid: '#818CF8',
  end: '#E879F9',
};

/**
 * @param {{
 *   progress: number;
 *   progressColor?: string;
 *   progressGradient?: { start: string; mid?: string; end: string };
 *   trackColor: string;
 *   imageSource: import('react-native').ImageSourcePropType;
 *   imageStyle: import('react-native').StyleProp<import('react-native').ImageStyle>;
 *   inactive?: boolean;
 * }} props
 */
function CarouselIconRing({
  progress,
  progressColor,
  progressGradient,
  trackColor,
  imageSource,
  imageStyle,
  inactive = false,
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9-_]/g, '');
  const gradientId = `carouselRingGrad-${rawId}`;
  const size = CAROUSEL_BADGE_SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - CAROUSEL_BADGE_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = inactive ? 0 : Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - frac);
  const useGradient = !inactive && progressGradient && frac > 0;
  const ringProgressColor = inactive ? trackColor : progressColor;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        {useGradient ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={progressGradient.start} />
              <Stop offset="48%" stopColor={progressGradient.mid ?? progressGradient.end} />
              <Stop offset="100%" stopColor={progressGradient.end} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={CAROUSEL_BADGE_STROKE} fill="none" />
        {frac > 0 ? (
          <G transform={`rotate(-90 ${cx} ${cy})`}>
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={useGradient ? `url(#${gradientId})` : ringProgressColor}
              strokeWidth={CAROUSEL_BADGE_STROKE}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        ) : null}
      </Svg>
      <Image source={imageSource} style={imageStyle} />
    </View>
  );
}

/**
 * @param {{
 *   consecutiveTrainingWeekStreak: number;
 *   consecutivePerfectWeekStreak: number;
 *   workoutHistory: unknown[];
 *   weeklySplitPlan: { days: { type: string; mixedMuscles?: string[] }[] } | null | undefined;
 * }} props
 */
function HomeStreakRankCarousel({
  consecutiveTrainingWeekStreak,
  consecutivePerfectWeekStreak,
  workoutHistory,
  weeklySplitPlan,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = screenWidth - 32;
  const scrollRef = useRef(null);
  const [activePage, setActivePage] = useState(0);
  const scrollX = useSyncedPagerScrollX(activePage, pageWidth);
  const isDragging = useRef(false);
  const timerRef = useRef(null);

  const rank = getStreakRankProgress(consecutiveTrainingWeekStreak);
  const trainingWeeks = Math.max(0, consecutiveTrainingWeekStreak);
  const perfectWeeks = Math.max(0, consecutivePerfectWeekStreak);
  const isStreakActiveThisWeek = hasLoggedWorkoutInCurrentWeek(workoutHistory);
  const inactiveRingTrack = theme.homeGamifiedInactive ?? '#4B5563';
  const activeRingTrack = 'rgba(255, 255, 255, 0.18)';

  const perfectWeekCarousel = useMemo(
    () => getCurrentWeekPerfectCarouselState(weeklySplitPlan, workoutHistory),
    [weeklySplitPlan, workoutHistory],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      if (isDragging.current) return;
      setActivePage((prev) => {
        const next = (prev + 1) % PAGE_COUNT;
        scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
        return next;
      });
    }, AUTO_INTERVAL_MS);
  }, [clearTimer, pageWidth]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const handleScrollEnd = useCallback(
    (event) => {
      const x = event.nativeEvent.contentOffset.x;
      const page = Math.round(x / pageWidth);
      const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, page));
      setActivePage(clamped);
      isDragging.current = false;
      startTimer();
    },
    [pageWidth, startTimer],
  );

  return (
    <View style={styles.homeCarouselWrap}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onScrollBeginDrag={() => {
          isDragging.current = true;
          clearTimer();
        }}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        snapToInterval={pageWidth}
        style={{ width: pageWidth }}>
        <View style={[styles.homeCarouselPage, { width: pageWidth }]}>
          <View style={styles.homeCarouselTextCol}>
            <Text style={styles.homeCarouselValue}>
              {trainingWeeks} {trainingWeeks === 1 ? 'week' : 'weeks'}
            </Text>
            <Text style={styles.homeCarouselLabel}>current streak</Text>
          </View>
          <CarouselIconRing
            progress={rank.progress}
            progressColor={SHARED_ACCENTS.streakGold}
            trackColor={isStreakActiveThisWeek ? activeRingTrack : inactiveRingTrack}
            inactive={!isStreakActiveThisWeek}
            imageSource={isStreakActiveThisWeek ? STREAK_LOGO_ACTIVE : STREAK_LOGO_INACTIVE}
            imageStyle={styles.homeCarouselBadgeImage}
          />
        </View>

        <View style={[styles.homeCarouselPage, { width: pageWidth }]}>
          <View style={styles.homeCarouselTextCol}>
            <Text style={styles.homeCarouselValue}>
              {perfectWeeks} {perfectWeeks === 1 ? 'week' : 'weeks'}
            </Text>
            <Text style={styles.homeCarouselLabel}>perfect weeks</Text>
          </View>
          <CarouselIconRing
            progress={perfectWeekCarousel.progress}
            progressGradient={PERFECT_STREAK_RING_GRADIENT}
            trackColor={perfectWeekCarousel.isActive ? activeRingTrack : inactiveRingTrack}
            inactive={!perfectWeekCarousel.isActive}
            imageSource={
              perfectWeekCarousel.isActive ? PERFECT_STREAK_LOGO_ACTIVE : STREAK_LOGO_INACTIVE
            }
            imageStyle={styles.homeCarouselBadgeImage}
          />
        </View>

        <View style={[styles.homeCarouselPage, { width: pageWidth }]}>
          <View style={styles.homeCarouselTextCol}>
            <Text style={styles.homeCarouselValue}>{rank.displayRank.label}</Text>
            <Text style={styles.homeCarouselLabel}>current rank</Text>
          </View>
          <Image source={rank.displayRank.image} style={styles.homeCarouselRankImage} />
        </View>
      </Animated.ScrollView>

      <AnimatedPageIndicator
        scrollX={scrollX}
        pageWidth={pageWidth}
        pageCount={PAGE_COUNT}
        accentColor={theme.navAccent}
        inactiveColor={theme.borderFaint}
        style={styles.homeCarouselDots}
      />
    </View>
  );
}

export default memo(HomeStreakRankCarousel);
