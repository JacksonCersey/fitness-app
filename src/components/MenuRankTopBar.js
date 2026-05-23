import React, { memo, useMemo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { getStreakRankProgress } from '../data/streakRanks';
import { styles } from '../styles';

/**
 * Home menu header: profile (left), streak XP bar (center), rank badge (right).
 * @param {{ consecutiveTrainingWeekStreak: number; onOpenProfile: () => void }} props
 */
function MenuRankTopBar({ consecutiveTrainingWeekStreak, onOpenProfile }) {
  const rank = useMemo(
    () => getStreakRankProgress(consecutiveTrainingWeekStreak),
    [consecutiveTrainingWeekStreak],
  );

  const fillPct = Math.round(rank.progress * 100);
  const progressHint = rank.isMaxRank
    ? 'Max rank'
    : `${rank.progressWeeksCurrent} / ${rank.progressWeeksTarget} wk`;

  const rankAccent = rank.displayRank.accent;

  return (
    <View style={styles.menuTopBar}>
      <TouchableOpacity
        style={styles.menuProfileButton}
        activeOpacity={0.9}
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel="Open profile">
        <Image source={require('../../assets/images/profileicon.png')} style={styles.menuProfileIcon} />
      </TouchableOpacity>

      <View
        style={styles.menuRankProgressBlock}
        accessibilityRole="progressbar"
        accessibilityLabel={
          rank.nextRank
            ? `Progress toward ${rank.nextRank.label}, ${progressHint}`
            : `${rank.displayRank.label} rank, maximum tier`
        }
        accessibilityValue={{ min: 0, max: rank.progressWeeksTarget, now: rank.progressWeeksCurrent }}>
        <View
          style={[
            styles.menuRankProgressTrack,
            { backgroundColor: 'rgba(0, 0, 0, 0.32)', borderColor: `${rankAccent}44` },
          ]}>
          <View
            style={[
              styles.menuRankProgressFill,
              { width: `${fillPct}%`, backgroundColor: rankAccent },
            ]}
          />
        </View>
        <Text style={styles.menuRankProgressHint} numberOfLines={1}>
          {progressHint}
        </Text>
      </View>

      <View style={styles.menuRankBadgeWrap} accessibilityLabel={`${rank.displayRank.label} rank`}>
        <Image source={rank.displayRank.image} style={styles.menuRankBadge} resizeMode="contain" />
      </View>
    </View>
  );
}

export default memo(MenuRankTopBar);
