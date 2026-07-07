import React, { memo, useId, useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';

const CHART_WIDTH = 112;
const CHART_HEIGHT = 44;
const PAD_X = 4;
const PAD_Y = 6;

/**
 * @param {number[]} values
 * @param {number} width
 * @param {number} height
 */
function buildSparklineCoords(values, width, height) {
  if (!values.length) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - PAD_X * 2;
  const innerH = height - PAD_Y * 2;

  return values.map((value, index) => {
    const x =
      values.length === 1
        ? PAD_X + innerW / 2
        : PAD_X + (index / (values.length - 1)) * innerW;
    const y = PAD_Y + innerH - ((value - min) / range) * innerH;
    return { x, y };
  });
}

/**
 * @param {{ trendDelta: number | null }} props
 */
function formatTrendLabel(trendDelta) {
  if (trendDelta == null) return 'recent sessions';
  if (trendDelta > 0.5) return `↑ ${trendDelta.toFixed(1)}`;
  if (trendDelta < -0.5) return `↓ ${Math.abs(trendDelta).toFixed(1)}`;
  return 'holding steady';
}

/**
 * Mini line chart of recent overall strength scores.
 * @param {{
 *   scores: number[],
 *   trendDelta?: number | null,
 * }} props
 */
function StrengthScoreSparkline({ scores, trendDelta = null }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const accent = theme.navAccent;
  const rawId = useId().replace(/[^a-zA-Z0-9-_]/g, '');
  const gradientId = `strengthSparkFill-${rawId}`;

  const safeScores = useMemo(
    () => (Array.isArray(scores) ? scores.filter((v) => Number.isFinite(v)) : []),
    [scores],
  );

  const coords = useMemo(
    () => buildSparklineCoords(safeScores, CHART_WIDTH, CHART_HEIGHT),
    [safeScores],
  );

  const linePoints = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const lastPoint = coords.length > 0 ? coords[coords.length - 1] : null;

  const areaPath = useMemo(() => {
    if (coords.length < 2) return '';
    const baseY = CHART_HEIGHT - PAD_Y;
    const first = coords[0];
    const last = coords[coords.length - 1];
    const line = coords.map((p) => `L ${p.x} ${p.y}`).join(' ');
    return `M ${first.x} ${baseY} L ${first.x} ${first.y} ${line} L ${last.x} ${baseY} Z`;
  }, [coords]);

  const trendLabel = formatTrendLabel(trendDelta);
  const trendIsUp = trendDelta != null && trendDelta > 0.5;
  const trendIsDown = trendDelta != null && trendDelta < -0.5;

  if (safeScores.length === 0) {
    return (
      <View style={styles.progressStrengthSparklineWrap}>
        <View style={styles.progressStrengthSparklinePlaceholder}>
          <Text style={styles.progressStrengthSparklinePlaceholderText}>no trend yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.progressStrengthSparklineWrap}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} accessibilityLabel="Recent strength score trend">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {coords.length >= 2 ? (
          <Polyline
            points={linePoints}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {lastPoint ? (
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={accent} stroke="#FFFFFF" strokeWidth={1.5} />
        ) : null}
      </Svg>
      <Text
        style={[
          styles.progressStrengthSparklineTrend,
          trendIsUp && styles.progressStrengthSparklineTrendUp,
          trendIsDown && styles.progressStrengthSparklineTrendDown,
        ]}>
        {trendLabel}
      </Text>
    </View>
  );
}

export default memo(StrengthScoreSparkline);
