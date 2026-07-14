import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getStreakRankProgress } from '../data/streakRanks';

/**
 * Home menu header: profile (left), optional streak XP bar (center), rank badge (right).
 * @param {{ consecutiveTrainingWeekStreak: number; onOpenProfile: () => void }} props
 */
function MenuRankTopBar({ consecutiveTrainingWeekStreak, onOpenProfile }) {
  const styles = useStyles();
  const [showRankProgress, setShowRankProgress] = useState(false);

  const rank = useMemo(
    () => getStreakRankProgress(consecutiveTrainingWeekStreak),
    [consecutiveTrainingWeekStreak],
  );

  const fillPct = Math.round(rank.progress * 100);
  const progressHint = rank.isMaxRank
    ? 'Max rank'
    : `${rank.progressWeeksCurrent} / ${rank.progressWeeksTarget} wk`;

  const rankAccent = rank.displayRank.accent;
  const fillProgress = useSharedValue(0);

  useEffect(() => {
    if (showRankProgress) {
      fillProgress.value = 0;
      fillProgress.value = withTiming(fillPct, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }
    fillProgress.value = 0;
  }, [showRankProgress, fillPct, fillProgress]);

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value}%`,
  }));

  const toggleRankProgress = useCallback(() => {
    setShowRankProgress((open) => !open);
  }, []);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(200)}
      style={[
        styles.menuTopBar,
        styles.menuRankTopBarHome,
        !showRankProgress && styles.menuRankTopBarCompact,
      ]}>
      <TouchableOpacity
        style={styles.menuProfileLink}
        activeOpacity={0.9}
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel="Open profile">
        <View style={styles.menuProfileButtonSmall}>
          <Image source={require('../../assets/images/icons/profileicon.png')} style={styles.menuProfileIconSmall} />
        </View>
        <Text style={styles.menuProfileLinkText}>Profile</Text>
        <Text style={styles.menuProfileLinkChevron}>›</Text>
      </TouchableOpacity>

      <View style={styles.menuRankProgressSlot}>
        {showRankProgress ? (
          <Animated.View
            entering={FadeIn.duration(240).springify().damping(16)}
            exiting={FadeOut.duration(180)}
            style={styles.menuRankProgressBlock}
            accessibilityRole="progressbar"
            accessibilityLabel={
              rank.nextRank
                ? `Progress toward ${rank.nextRank.label}, ${progressHint}`
                : `${rank.displayRank.label} rank, maximum tier`
            }
            accessibilityValue={{ min: 0, max: rank.progressWeeksTarget, now: rank.progressWeeksCurrent }}>
            <Text style={styles.menuRankProgressHint} numberOfLines={1}>
              {progressHint}
            </Text>
            <View
              style={[
                styles.menuRankProgressTrack,
                { backgroundColor: 'rgba(0, 0, 0, 0.32)', borderColor: `${rankAccent}44` },
              ]}>
              <Animated.View
                style={[
                  styles.menuRankProgressFill,
                  { backgroundColor: rankAccent },
                  fillAnimatedStyle,
                ]}
              />
            </View>
          </Animated.View>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.menuRankBadgeWrap, showRankProgress && styles.menuRankBadgeWrapActive]}
        onPress={toggleRankProgress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityState={{ expanded: showRankProgress }}
        accessibilityLabel={
          showRankProgress
            ? `Hide ${rank.displayRank.label} rank progress`
            : `Show ${rank.displayRank.label} rank progress`
        }>
        <Image source={rank.displayRank.image} style={styles.menuRankBadge} resizeMode="contain" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(MenuRankTopBar);
