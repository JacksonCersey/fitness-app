import React from 'react';
import { Dimensions, View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { formatVolumeCompact } from '../utils/workoutStats';

const PADDING_LEFT = 40;
const PADDING_RIGHT = 8;
const PADDING_TOP = 6;
const PADDING_BOTTOM = 26;

export default function MonthlyVolumeChart({
  values,
  xLabels,
  maxVolume,
  accentColor,
  axisColor,
  captionColor,
  barMutedColor,
  captionText,
  peakLabelPrefix = 'Peak',
}) {
  const points = Array.isArray(values) ? values : [];
  const pointCount = points.length;
  const windowW = Dimensions.get('window').width;
  const chartWidth = Math.min(340, Math.max(260, windowW - 44));
  const chartHeight = 168;
  const innerW = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const innerH = chartHeight - PADDING_TOP - PADDING_BOTTOM;

  const max = Number.isFinite(maxVolume) && maxVolume > 0 ? maxVolume : 1;

  if (pointCount < 1) return null;

  const slotW = innerW / pointCount;
  const muted = barMutedColor || axisColor;
  const lowerTickStep = max <= 50 ? 5 : 10;
  const lowerTick2Raw = Math.floor((max * 0.66) / lowerTickStep) * lowerTickStep;
  const lowerTick1Raw = Math.floor((max * 0.33) / lowerTickStep) * lowerTickStep;
  const yTicks = [
    max,
    ...[lowerTick2Raw, lowerTick1Raw].filter(
      (tickValue, index, all) => tickValue > 0 && tickValue < max && all.indexOf(tickValue) === index,
    ),
    0,
  ];
  const xLabelIndices = points
    .map((_, index) => index)
    .filter((index) => {
      if (pointCount <= 12) return true;
      return index === 0 || index === pointCount - 1 || index % 5 === 0;
    });

  return (
    <View style={styles.wrap} accessibilityLabel="Monthly training volume bar chart">
      <Svg width={chartWidth} height={chartHeight}>
        {yTicks.map((tickValue) => {
          const ratio = tickValue / max;
          const y = PADDING_TOP + innerH - innerH * ratio;
          return (
            <React.Fragment key={`y-${tickValue}`}>
              <Line
                x1={PADDING_LEFT}
                y1={y}
                x2={PADDING_LEFT + innerW}
                y2={y}
                stroke={axisColor}
                strokeOpacity={tickValue === 0 ? 0.45 : 0.2}
                strokeWidth={1}
              />
              <SvgText
                x={PADDING_LEFT - 6}
                y={y + 3}
                fill={captionColor}
                fontSize="9"
                textAnchor="end">
                {Math.round(tickValue)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Rect
          x={PADDING_LEFT}
          y={PADDING_TOP + innerH}
          width={innerW}
          height={1}
          fill={axisColor}
          opacity={0.45}
        />
        {points.map((vol, index) => {
          const hasLift = typeof vol === 'number' && vol > 0;
          const frac = hasLift ? Math.max(0, vol) / max : 0;
          const barH = hasLift ? Math.max(innerH * frac, 4) : 2;
          const x = PADDING_LEFT + index * slotW + slotW * 0.12;
          const w = slotW * 0.76;
          const y = PADDING_TOP + innerH - barH;
          return (
            <Rect
              key={String(index)}
              x={x}
              y={y}
              width={w}
              height={barH}
              rx={Math.min(Math.max(w / 5, 1), 3)}
              fill={hasLift ? accentColor : muted}
              fillOpacity={hasLift ? 0.92 : 0.22}
            />
          );
        })}
        {xLabelIndices.map((index) => {
          const x = PADDING_LEFT + index * slotW + slotW * 0.5;
          return (
            <SvgText
              key={`x-${index}`}
              x={x}
              y={PADDING_TOP + innerH + 14}
              fill={captionColor}
              fontSize="9"
              textAnchor="middle">
              {Array.isArray(xLabels) && typeof xLabels[index] === 'string' ? xLabels[index] : `${index + 1}`}
            </SvgText>
          );
        })}
      </Svg>
      <Text style={[styles.caption, { color: captionColor }]}>
        {captionText || 'Y-axis is pounds lifted. X-axis is period label.'}
      </Text>
      <Text style={[styles.dayHint, { color: captionColor }]}>
        {peakLabelPrefix}: {formatVolumeCompact(max)} lb
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: 4,
    position: 'relative',
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    opacity: 0.9,
    paddingHorizontal: 2,
  },
  dayHint: {
    position: 'absolute',
    bottom: 0,
    right: PADDING_RIGHT,
    fontSize: 10,
    opacity: 0.75,
    fontVariant: ['tabular-nums'],
  },
});
