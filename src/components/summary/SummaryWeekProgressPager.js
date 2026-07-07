import React, { memo } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import AnimatedPageIndicator, { useSyncedPagerScrollX } from '../common/AnimatedPageIndicator';

function SummaryWeekProgressPager({
  styles,
  theme,
  cardWidth,
  onCardLayout,
  pagerRef,
  activePage,
  onPageChange,
  onScrollBeginDrag,
  goalCompleted,
  goalTarget,
  goalFillAnim,
  onGoalTrackLayout,
  streak,
  rankChanged,
  rankFillAnim,
  onRankTrackLayout,
}) {
  const scrollX = useSyncedPagerScrollX(activePage, cardWidth);
  const inactiveDotColor = theme.borderFaint;

  if (cardWidth <= 0) {
    return <View style={styles.summaryStreakCard} onLayout={onCardLayout} />;
  }

  return (
    <View style={styles.summaryStreakCard} onLayout={onCardLayout}>
      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth}
        style={{ width: cardWidth }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onPageChange}>
        <View style={[styles.summaryStreakPagerPage, { width: cardWidth }]}>
          <View style={styles.summaryStreakHeaderRow}>
            <View style={styles.summaryStreakTitleRow}>
              <Image source={require('../../../assets/images/streaklogo.png')} style={styles.summaryStreakIcon} />
              <Text style={styles.summaryStreakTitle}>Week goal</Text>
            </View>
            <Text style={styles.summaryStreakWeeks}>
              {goalCompleted} / {goalTarget}
            </Text>
          </View>
          <View style={styles.summaryStreakTrack} onLayout={onGoalTrackLayout}>
            <Animated.View
              style={[
                styles.summaryStreakFill,
                {
                  width: goalFillAnim,
                  backgroundColor: theme.navAccent,
                },
              ]}
            />
          </View>
          <Text style={styles.summaryStreakHint}>
            {goalCompleted >= goalTarget
              ? 'Week goal reached'
              : `${Math.max(0, goalTarget - goalCompleted)} workout${Math.max(0, goalTarget - goalCompleted) === 1 ? '' : 's'} to goal`}
          </Text>
        </View>

        <View style={[styles.summaryStreakPagerPage, { width: cardWidth }]}>
          <View style={styles.summaryStreakHeaderRow}>
            <View style={styles.summaryStreakTitleRow}>
              <Image source={streak.displayRank.image} style={styles.summaryRankIcon} />
              <Text style={styles.summaryStreakTitle}>Week rank</Text>
            </View>
            <Text style={styles.summaryStreakWeeks}>{streak.displayRank.label}</Text>
          </View>
          <View style={styles.summaryStreakTrack} onLayout={onRankTrackLayout}>
            <Animated.View
              style={[
                styles.summaryStreakFill,
                {
                  width: rankFillAnim,
                  backgroundColor: streak.displayRank.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.summaryStreakHint}>
            {rankChanged
              ? `New rank: ${streak.displayRank.label}`
              : streak.isMaxRank || !streak.nextRank
                ? 'Top rank reached'
                : `${streak.progressWeeksCurrent} / ${streak.progressWeeksTarget} weeks to ${streak.nextRank.label}`}
          </Text>
        </View>
      </Animated.ScrollView>

      <AnimatedPageIndicator
        scrollX={scrollX}
        pageWidth={cardWidth}
        pageCount={2}
        accentColor={theme.navAccent}
        inactiveColor={inactiveDotColor}
        style={styles.summaryStreakPagerDots}
      />
    </View>
  );
}

export default memo(SummaryWeekProgressPager);
