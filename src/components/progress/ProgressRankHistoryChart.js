import React, { memo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { STREAK_RANKS, UNRANKED_RANK } from '../../data/streakRanks';

const PAD_LEFT = 44;
const PAD_RIGHT = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

const RANK_AXIS = [UNRANKED_RANK, ...STREAK_RANKS].map((tier, index) => ({
  index,
  id: tier.id,
  shortLabel: tier.label.slice(0, 3),
  accent: tier.accent,
}));

const MAX_RANK_INDEX = STREAK_RANKS.length; // Platinum = 7

/**
 * Step chart of streak rank over time (Y = rank tier, X = week).
 * Best shape for discrete rank levels that hold until the streak breaks or climbs.
 *
 * @param {{
 *   points: Array<{ value: number; timestamp?: number; label?: string; accent?: string }>;
 *   axisColor: string;
 *   textColor: string;
 *   emptyMessage?: string;
 * }} props
 */
function ProgressRankHistoryChart({
  points,
  axisColor,
  textColor,
  emptyMessage = 'Complete workouts to start your rank history.',
}) {
  const chartW = Math.min(340, Math.max(260, Dimensions.get('window').width - 56));
  const chartH = 190;
  const innerW = chartW - PAD_LEFT - PAD_RIGHT;
  const innerH = chartH - PAD_TOP - PAD_BOTTOM;
  const safePoints = (Array.isArray(points) ? points : []).filter((point) =>
    Number.isFinite(point?.value),
  );

  if (safePoints.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: textColor }]}>{emptyMessage}</Text>
      </View>
    );
  }

  const timestamps = safePoints.map((point, index) =>
    Number.isFinite(point.timestamp) ? point.timestamp : index,
  );
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime || 1;

  const svgPoints = safePoints.map((point, index) => {
    const t = timestamps[index];
    const xRatio = safePoints.length === 1 ? 0.5 : (t - minTime) / timeRange;
    const x = PAD_LEFT + xRatio * innerW;
    const clamped = Math.min(MAX_RANK_INDEX, Math.max(0, point.value));
    const y = PAD_TOP + innerH - (clamped / MAX_RANK_INDEX) * innerH;
    const accent = point.accent || RANK_AXIS[clamped]?.accent || '#64748B';
    return { x, y, label: point.label, value: clamped, accent };
  });

  return (
    <View style={styles.wrap}>
      <Svg width={chartW} height={chartH}>
        {RANK_AXIS.map((tier) => {
          const y = PAD_TOP + innerH - (tier.index / MAX_RANK_INDEX) * innerH;
          return (
            <React.Fragment key={`y-${tier.id}`}>
              <Line
                x1={PAD_LEFT}
                y1={y}
                x2={PAD_LEFT + innerW}
                y2={y}
                stroke={axisColor}
                strokeOpacity={tier.index === 0 ? 0.55 : 0.28}
                strokeWidth={1}
              />
              <SvgText x={PAD_LEFT - 6} y={y + 3} fill={textColor} fontSize="8" textAnchor="end">
                {tier.shortLabel}
              </SvgText>
            </React.Fragment>
          );
        })}

        {svgPoints.map((point, index) => {
          const n = svgPoints.length;
          const labelStep = n <= 6 ? 1 : Math.ceil((n - 1) / 5);
          const show = index === 0 || index === n - 1 || index % labelStep === 0;
          if (!show) return null;
          return (
            <Line
              key={`v-${index}`}
              x1={point.x}
              y1={PAD_TOP}
              x2={point.x}
              y2={PAD_TOP + innerH}
              stroke={axisColor}
              strokeOpacity={0.22}
              strokeWidth={1}
            />
          );
        })}

        {svgPoints.slice(1).map((point, index) => {
          const prev = svgPoints[index];
          return (
            <React.Fragment key={`step-${index}`}>
              <Line
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={prev.y}
                stroke={prev.accent}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              <Line
                x1={point.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke={point.accent}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </React.Fragment>
          );
        })}

        {svgPoints.map((point, index) => (
          <Circle key={`p-${index}`} cx={point.x} cy={point.y} r={3.4} fill={point.accent} />
        ))}

        {svgPoints.map((point, index) => {
          const n = svgPoints.length;
          const labelStep = n <= 6 ? 1 : Math.ceil((n - 1) / 5);
          const show = index === 0 || index === n - 1 || index % labelStep === 0;
          if (!show) return null;
          return (
            <SvgText
              key={`x-${index}`}
              x={point.x}
              y={PAD_TOP + innerH + 14}
              fill={textColor}
              fontSize="9"
              textAnchor="middle">
              {point.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  emptyWrap: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default memo(ProgressRankHistoryChart);
