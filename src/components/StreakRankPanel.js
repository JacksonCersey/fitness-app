import React, { memo, useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { STREAK_RANKS, getStreakRankProgress } from '../data/streakRanks';
import { styles } from '../styles';

/**
 * Rank ladder for Streak screen (More → Streak & this week).
 * @param {{ consecutiveTrainingWeekStreak: number }} props
 */
function StreakRankPanel({ consecutiveTrainingWeekStreak }) {
  const rank = useMemo(
    () => getStreakRankProgress(consecutiveTrainingWeekStreak),
    [consecutiveTrainingWeekStreak],
  );

  const fillPct = Math.round(rank.progress * 100);
  const rankAccent = rank.displayRank.accent;

  return (
    <View style={styles.streakRankPanel}>
      <Text style={styles.streakRankPanelTitle}>Streak ranks</Text>
      <Text style={styles.streakRankPanelIntro}>
        Your rank is based on how many <Text style={styles.menuMoreEmphasisInline}>consecutive weeks</Text> you
        log at least one workout. Keep the chain going to level up.
      </Text>

      <View style={styles.streakRankCurrentRow}>
        <Image source={rank.displayRank.image} style={styles.streakRankCurrentBadge} resizeMode="contain" />
        <View style={styles.streakRankCurrentTextCol}>
          <Text style={styles.streakRankCurrentLabel}>
            {rank.currentRank ? rank.currentRank.label : 'Unranked'}
            {rank.currentRank ? '' : ` → ${STREAK_RANKS[0].label}`}
          </Text>
          <Text style={styles.streakRankCurrentSub}>
            {rank.streakWeeks} week{rank.streakWeeks === 1 ? '' : 's'} streak
          </Text>
          {!rank.isMaxRank && rank.nextRank ? (
            <>
              <View style={[styles.streakRankProgressTrack, { borderColor: `${rankAccent}44` }]}>
                <View
                  style={[styles.streakRankProgressFill, { width: `${fillPct}%`, backgroundColor: rankAccent }]}
                />
              </View>
              <Text style={styles.streakRankProgressHint}>
                {rank.progressWeeksCurrent} / {rank.progressWeeksTarget} weeks toward {rank.nextRank.label}
              </Text>
            </>
          ) : (
            <Text style={styles.streakRankProgressHint}>You reached the highest rank. Nice work.</Text>
          )}
        </View>
      </View>

      <Text style={styles.streakRankLadderHeading}>All ranks</Text>
      {STREAK_RANKS.map((tier) => {
        const earned = rank.streakWeeks >= tier.weeksRequired;
        const isCurrent = rank.currentRank?.id === tier.id;
        return (
          <View
            key={tier.id}
            style={[
              styles.streakRankLadderRow,
              earned && styles.streakRankLadderRowEarned,
              isCurrent && styles.streakRankLadderRowCurrent,
            ]}
            accessibilityLabel={`${tier.label}, ${tier.weeksRequired} week streak required${earned ? ', earned' : ''}`}>
            <Image
              source={tier.image}
              style={[styles.streakRankLadderIcon, !earned && styles.streakRankLadderIconLocked]}
              resizeMode="contain"
            />
            <View style={styles.streakRankLadderTextCol}>
              <Text style={[styles.streakRankLadderName, !earned && styles.streakRankLadderNameLocked]}>
                {tier.label}
              </Text>
              <Text style={styles.streakRankLadderWeeks}>
                {tier.weeksRequired} week{tier.weeksRequired === 1 ? '' : 's'} streak
              </Text>
            </View>
            {earned ? <Text style={styles.streakRankLadderCheck}>✓</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export default memo(StreakRankPanel);
