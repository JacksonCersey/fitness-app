import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { GAME_THEME_DARK } from '../src/theme/gameTheme';

const PAD_LEFT = 34;
const PAD_RIGHT = 10;
const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const Y_TICK_COUNT = 5;

function getNiceBounds(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return { min: 0, max: 1 };
  }
  const values = points.map((point) => point.value).filter((value) => Number.isFinite(value));
  if (values.length === 0) return { min: 0, max: 1 };
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  if (minValue === maxValue) {
    return { min: minValue - 1, max: maxValue + 1 };
  }
  const pad = Math.max(1, (maxValue - minValue) * 0.1);
  return { min: minValue - pad, max: maxValue + pad };
}

function buildYTicks(min, max, count) {
  if (count <= 1) return [min];
  return Array.from({ length: count }, (_, index) => min + ((max - min) * index) / (count - 1));
}

export default function WeightProgressChart({
  points,
  lineColor,
  axisColor,
  textColor,
  pointColor,
  showCaption = false,
  emptyMessage = 'No weight logs yet. Tap + to add your first entry.',
}) {
  const chartW = Math.min(340, Math.max(260, Dimensions.get('window').width - 44));
  const chartH = 174;
  const innerW = chartW - PAD_LEFT - PAD_RIGHT;
  const innerH = chartH - PAD_TOP - PAD_BOTTOM;
  const safePoints = (Array.isArray(points) ? points : []).filter(
    (point) => Number.isFinite(point?.value) && point.value > 0,
  );

  if (safePoints.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: textColor }]}>{emptyMessage}</Text>
      </View>
    );
  }

  const { min, max } = getNiceBounds(safePoints);
  const range = max - min || 1;
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
    const normalized = (point.value - min) / range;
    const y = PAD_TOP + innerH - normalized * innerH;
    return { x, y, label: point.label, value: point.value };
  });

  const strokeColor = lineColor || GAME_THEME_DARK.navAccent;
  const yTicks = buildYTicks(min, max, Y_TICK_COUNT);

  return (
    <View style={styles.wrap}>
      <Svg width={chartW} height={chartH}>
        {yTicks.map((tick, index) => {
          const ratio = (tick - min) / range;
          const y = PAD_TOP + innerH - ratio * innerH;
          const isEdge = index === 0 || index === yTicks.length - 1;
          return (
            <React.Fragment key={`y-${index}`}>
              <Line
                x1={PAD_LEFT}
                y1={y}
                x2={PAD_LEFT + innerW}
                y2={y}
                stroke={axisColor}
                strokeOpacity={isEdge ? 0.7 : 0.45}
                strokeWidth={1.25}
              />
              <SvgText x={PAD_LEFT - 6} y={y + 3} fill={textColor} fontSize="9" textAnchor="end">
                {Math.round(tick)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {svgPoints.map((point, index) => {
          const n = svgPoints.length;
          const labelStep = n <= 8 ? 1 : Math.ceil((n - 1) / 7);
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
              strokeOpacity={0.28}
              strokeWidth={1}
            />
          );
        })}

        {safePoints.length > 1 ? (
          svgPoints.slice(1).map((point, index) => {
            const prev = svgPoints[index];
            return (
              <Line
                key={`seg-${index}`}
                x1={prev.x}
                y1={prev.y}
                x2={point.x}
                y2={point.y}
                stroke={strokeColor}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            );
          })
        ) : (
          <Line
            x1={svgPoints[0].x - 0.1}
            y1={svgPoints[0].y}
            x2={svgPoints[0].x + 0.1}
            y2={svgPoints[0].y}
            stroke={strokeColor}
            strokeWidth={2.2}
          />
        )}

        {svgPoints.map((point, index) => (
          <Circle key={`p-${index}`} cx={point.x} cy={point.y} r={3.2} fill={pointColor || strokeColor} />
        ))}

        {svgPoints.map((point, index) => {
          const n = svgPoints.length;
          const labelStep = n <= 8 ? 1 : Math.ceil((n - 1) / 7);
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
      {showCaption ? (
        <Text style={[styles.caption, { color: textColor }]}>
          All saved weigh-ins in time order (lb). Along the bottom, dates use month/day (like 5/11). Tap + to add one.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  caption: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    opacity: 0.9,
  },
  emptyWrap: {
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
