import React, { memo, useId, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';

const CHART_HEIGHT = 72;
const PAD_X = 6;
const PAD_Y = 8;
const MIN_CHART_WIDTH = 180;

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
 * @param {number[]} averages Oldest → newest averages on the chart.
 */
function getTrendDelta(averages) {
  if (!Array.isArray(averages) || averages.length < 2) return null;
  return averages[averages.length - 1] - averages[0];
}

/**
 * @param {number | null} trendDelta
 */
function formatTrendLabel(trendDelta) {
  if (trendDelta == null) return 'recent avgs';
  if (trendDelta > 0.5) return `↑ ${trendDelta.toFixed(1)} lb vs recent`;
  if (trendDelta < -0.5) return `↓ ${Math.abs(trendDelta).toFixed(1)} lb vs recent`;
  return 'same as recent';
}

/**
 * Mini line chart of average weight per recent workout for one movement.
 * @param {{ averages: number[] }} props
 */
function MovementWeightSparkline({ averages }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const accent = theme.navAccent;
  const rawId = useId().replace(/[^a-zA-Z0-9-_]/g, '');
  const gradientId = `movementWeightSparkFill-${rawId}`;
  const [chartWidth, setChartWidth] = useState(MIN_CHART_WIDTH);

  const safeAverages = useMemo(
    () => (Array.isArray(averages) ? averages.filter((v) => Number.isFinite(v)) : []),
    [averages],
  );

  const coords = useMemo(
    () => buildSparklineCoords(safeAverages, chartWidth, CHART_HEIGHT),
    [safeAverages, chartWidth],
  );

  const linePoints = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const lastPoint = coords.length > 0 ? coords[coords.length - 1] : null;
  const trendDelta = getTrendDelta(safeAverages);
  const trendLabel = formatTrendLabel(trendDelta);
  const trendIsUp = trendDelta != null && trendDelta > 0.5;
  const trendIsDown = trendDelta != null && trendDelta < -0.5;

  const areaPath = useMemo(() => {
    if (coords.length < 2) return '';
    const baseY = CHART_HEIGHT - PAD_Y;
    const first = coords[0];
    const last = coords[coords.length - 1];
    const line = coords.map((p) => `L ${p.x} ${p.y}`).join(' ');
    return `M ${first.x} ${baseY} L ${first.x} ${first.y} ${line} L ${last.x} ${baseY} Z`;
  }, [coords]);

  if (safeAverages.length === 0) {
    return (
      <View style={styles.homeMovementSparklineWrap}>
        <View style={styles.homeMovementSparklinePlaceholder}>
          <Text style={styles.homeMovementSparklinePlaceholderText}>no trend yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.homeMovementSparklineWrap}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth >= MIN_CHART_WIDTH && nextWidth !== chartWidth) {
          setChartWidth(nextWidth);
        }
      }}>
      <Svg width={chartWidth} height={CHART_HEIGHT} accessibilityLabel="Recent average weight trend">
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
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {lastPoint ? (
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={accent} stroke="#FFFFFF" strokeWidth={1.5} />
        ) : null}
      </Svg>
      <Text
        style={[
          styles.homeMovementSparklineTrend,
          trendIsUp && styles.homeMovementSparklineTrendUp,
          trendIsDown && styles.homeMovementSparklineTrendDown,
        ]}>
        {trendLabel}
      </Text>
    </View>
  );
}

export default memo(MovementWeightSparkline);
