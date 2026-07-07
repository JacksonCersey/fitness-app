import React, { memo, useCallback } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import StrengthScoreSparkline from './StrengthScoreSparkline';

function showStrengthScoreExplainer() {
  Alert.alert(
    'Strength Score',
    'Your score blends three things: how you are performing lately on each lift, your lifetime personal records, and your training streak.\n\nEach movement is compared to your own recent sessions — not to other lifts. The score stays steady when weights are consistent and only drops after a genuinely weak workout.',
    [{ text: 'Got it' }],
  );
}

/**
 * @param {{
 *   summary: import('../../data/strengthScore').StrengthScoreSummary | null;
 *   onOpenStrengthHistory?: () => void;
 * }} props
 */
function ProgressStrengthScoreBodyPanel({ summary, onOpenStrengthHistory }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const handleShowExplainer = useCallback(() => {
    showStrengthScoreExplainer();
  }, []);

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
    <View style={styles.progressStrengthBodyCard}>
      <View style={styles.progressStrengthBodyHeaderRow}>
        <Text style={styles.progressStrengthOverviewTitle}>Strength Score</Text>
        <View style={styles.progressStrengthBodyHeaderActions}>
          <TouchableOpacity
            style={styles.progressStrengthBodyInfoBtn}
            onPress={handleShowExplainer}
            accessibilityRole="button"
            accessibilityLabel="How strength score works">
            <Text style={styles.progressStrengthBodyInfoBtnText}>i</Text>
          </TouchableOpacity>
          {onOpenStrengthHistory ? (
            <TouchableOpacity
              style={styles.progressStrengthOverviewMovementsBtn}
              onPress={onOpenStrengthHistory}
              accessibilityRole="button"
              accessibilityLabel="View strength score history">
              <Text style={styles.progressStrengthOverviewMovementsBtnText}>›</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {summary.hasData ? (
        <>
          <View style={styles.progressStrengthBodyMainRow}>
            <Text style={styles.progressStrengthBodyValue}>{summary.overallScore}</Text>
            <View style={styles.progressStrengthBodySparklineCol}>
              <StrengthScoreSparkline
                scores={summary.recentOverallScores}
                trendDelta={summary.trendDelta}
                wide
              />
            </View>
          </View>

          <View style={styles.progressStrengthBodyMetaRow}>
            <View style={[styles.progressStrengthBodyLevelPill, { backgroundColor: theme.navAccent }]}>
              <Text style={styles.progressStrengthBodyLevelPillText}>{summary.levelLabel}</Text>
            </View>
            <View style={styles.progressStrengthBodyPillarRow}>
              <Text style={styles.progressStrengthBodyPillar}>
                Recent <Text style={styles.progressStrengthBodyPillarValue}>{summary.recentPillar}</Text>
              </Text>
              <Text style={styles.progressStrengthBodyPillar}>
                PRs <Text style={styles.progressStrengthBodyPillarValue}>{summary.lifetimePillar}</Text>
              </Text>
              <Text style={styles.progressStrengthBodyPillar}>
                Streak <Text style={styles.progressStrengthBodyPillarValue}>{summary.consistencyPillar}</Text>
              </Text>
            </View>
          </View>

          {summary.lastWorkoutScore != null ? (
            <Text style={styles.progressStrengthBodySessionMeta}>
              Last session: {summary.lastWorkoutScore} pts
              {summary.lastWorkoutHadPr ? ' · new PR' : ''}
              {trend ? ` · ${trend}` : ''}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.progressStrengthOverviewEmptyText}>
          Complete a workout to see your strength score.
        </Text>
      )}
    </View>
  );
}

export default memo(ProgressStrengthScoreBodyPanel);
