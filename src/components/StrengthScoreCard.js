import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

/**
 * @param {{
 *   summary: import('../data/strengthScore').StrengthScoreSummary | null,
 *   compact?: boolean,
 *   onOpenMovements?: () => void,
 *   colors: { textPrimary: string, textSecondary: string, accentSolid: string, cardBg: string, cardBorder: string },
 * }} props
 */
function StrengthScoreCard({ summary, compact = false, onOpenMovements, colors }) {
  if (!summary) return null;

  const trend =
    summary.trendDelta != null
      ? summary.trendDelta > 0.5
        ? `↑ ${summary.trendDelta.toFixed(1)} vs prior workouts`
        : summary.trendDelta < -0.5
          ? `↓ ${Math.abs(summary.trendDelta).toFixed(1)} vs prior workouts`
          : 'Holding steady'
      : null;

  return (
    <View
      style={[
        styles.strengthScoreCard,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        compact && styles.strengthScoreCardCompact,
      ]}>
      <View style={styles.strengthScoreHeaderRow}>
        <Text style={[styles.strengthScoreTitle, { color: colors.textPrimary }]}>Strength Score</Text>
        <View style={[styles.strengthScoreLevelPill, { backgroundColor: colors.accentSolid }]}>
          <Text style={styles.strengthScoreLevelPillText}>{summary.levelLabel}</Text>
        </View>
      </View>

      <Text style={[styles.strengthScoreValue, { color: colors.textPrimary }]}>
        {summary.hasData ? summary.overallScore : '—'}
      </Text>

      {summary.hasData ? (
        <>
          <View style={[styles.strengthScoreLevelTrack, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
            <View
              style={[
                styles.strengthScoreLevelFill,
                { backgroundColor: colors.accentSolid, width: `${Math.round(summary.levelProgress * 100)}%` },
              ]}
            />
          </View>

          {!compact ? (
            <Text style={[styles.strengthScoreCaption, { color: colors.textSecondary }]}>
              Built from recent sessions, lifetime bests, and your training streak. Log compound lifts (squat, bench,
              deadlift, rows, pull-ups) for the fastest gains.
            </Text>
          ) : null}

          <View style={styles.strengthScorePillarRow}>
            <Text style={[styles.strengthScorePillar, { color: colors.textSecondary }]}>
              Recent <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{summary.recentPillar}</Text>
            </Text>
            <Text style={[styles.strengthScorePillar, { color: colors.textSecondary }]}>
              PRs <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{summary.lifetimePillar}</Text>
            </Text>
            <Text style={[styles.strengthScorePillar, { color: colors.textSecondary }]}>
              Streak <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{summary.consistencyPillar}</Text>
            </Text>
          </View>

          {summary.lastWorkoutScore != null ? (
            <Text style={[styles.strengthScoreMeta, { color: colors.textSecondary }]}>
              Last session: {summary.lastWorkoutScore} pts
              {summary.lastWorkoutHadPr ? ' · new PR 🔥' : ''}
              {trend ? ` · ${trend}` : ''}
            </Text>
          ) : null}

          {!compact && summary.topLifetimeLifts.length > 0 ? (
            <Text style={[styles.strengthScoreMeta, { color: colors.textSecondary, marginTop: 6 }]}>
              Top lifts:{' '}
              {summary.topLifetimeLifts.map((l) => `${l.movement} (${l.bestScore})`).join(' · ')}
            </Text>
          ) : null}

          {onOpenMovements ? (
            <TouchableOpacity
              style={styles.strengthScoreMovementsButton}
              onPress={onOpenMovements}
              accessibilityRole="button"
              accessibilityLabel="View all movements and recent sets">
              <Text style={styles.strengthScoreMovementsButtonText}>Movements</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <>
          <Text style={[styles.strengthScoreCaption, { color: colors.textSecondary }]}>
            Finish a workout with working sets (1–12 reps) to unlock your score. Compound barbell lifts count the most.
          </Text>
          {onOpenMovements ? (
            <TouchableOpacity
              style={[styles.strengthScoreMovementsButton, { opacity: 0.65 }]}
              onPress={onOpenMovements}
              accessibilityRole="button"
              accessibilityLabel="View movements">
              <Text style={styles.strengthScoreMovementsButtonText}>Movements</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

export default memo(StrengthScoreCard);
