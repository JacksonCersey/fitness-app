import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useStyles } from '../../app/context/ThemeStylesContext';

const GAP_PX = 32;
const PIXELS_PER_SECOND = 32;
const PAUSE_MS = 700;

/**
 * Single-line title. Shows the full name; if it is wider than the space, pans sideways.
 * Restarts the pan whenever the title text changes (e.g. switching weekdays).
 */
function PlanMarqueeTitle({ text, style }) {
  const styles = useStyles();
  const label = String(text || '').trim() || 'Workout';
  const offsetX = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);

  const needsMarquee = containerWidth > 0 && textWidth > 0 && textWidth > containerWidth + 2;

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }
    offsetX.stopAnimation();
    offsetX.setValue(0);
  }, [offsetX]);

  // Restart whenever the title changes — even if Upper Day and Lower Day share the same pixel width.
  // (Stopping on label change without restarting left the marquee dead after switching days.)
  useEffect(() => {
    stopLoop();
    if (!needsMarquee) return undefined;

    const travel = textWidth + GAP_PX;
    const duration = Math.max(1600, Math.round((travel / PIXELS_PER_SECOND) * 1000));

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(PAUSE_MS),
        Animated.timing(offsetX, {
          toValue: -travel,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(offsetX, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    loopRef.current = loop;
    loop.start();

    return () => {
      stopLoop();
    };
  }, [label, needsMarquee, offsetX, stopLoop, textWidth]);

  const labelStyle = [style, styles.planWorkoutTitleLabel, textWidth > 0 ? { width: textWidth } : null];

  return (
    <View style={styles.planWorkoutTitleMarqueeWrap}>
      <View style={styles.planWorkoutTitleMeasureHost} pointerEvents="none">
        <Text
          key={label}
          style={style}
          numberOfLines={1}
          ellipsizeMode="clip"
          onTextLayout={(event) => {
            const line = event.nativeEvent.lines?.[0];
            const next = Math.ceil(Number(line?.width) || 0);
            if (next > 0) {
              setTextWidth((previous) => (previous === next ? previous : next));
            }
          }}>
          {label}
        </Text>
      </View>

      <View
        style={styles.planWorkoutTitleMarquee}
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.width);
          setContainerWidth((previous) => (previous === next ? previous : next));
        }}>
        {needsMarquee ? (
          <Animated.View
            key={`marquee-${label}`}
            style={[
              styles.planWorkoutTitleMarqueeTrack,
              { width: textWidth * 2 + GAP_PX, transform: [{ translateX: offsetX }] },
            ]}>
            <Text style={labelStyle} numberOfLines={1} ellipsizeMode="clip">
              {label}
            </Text>
            <View style={{ width: GAP_PX }} />
            <Text style={labelStyle} numberOfLines={1} ellipsizeMode="clip">
              {label}
            </Text>
          </Animated.View>
        ) : (
          <Text key={`static-${label}`} style={labelStyle} numberOfLines={1} ellipsizeMode="clip">
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

export default memo(PlanMarqueeTitle);
