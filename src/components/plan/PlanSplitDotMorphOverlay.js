import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { usePlanSplitTransition } from '../../app/context/PlanSplitTransitionContext';

const MORPH_MS = 420;

function MorphDot({ source, target, dayStyle, progress }) {
  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const left = source.x + (target.x - source.x) * p;
    const top = source.y + (target.y - source.y) * p;
    const width = source.width + (target.width - source.width) * p;
    const height = source.height + (target.height - source.height) * p;
    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
      borderRadius: Math.max(width, height) / 2,
      backgroundColor: dayStyle.isRest ? 'transparent' : dayStyle.accent,
      borderWidth: dayStyle.isRest ? 2 : 0,
      borderColor: dayStyle.isRest ? dayStyle.borderColor ?? 'rgba(241,245,249,0.55)' : 'transparent',
    };
  }, [source, target, dayStyle]);

  return <Animated.View style={animatedStyle} />;
}

function PlanSplitDotMorphOverlay() {
  const {
    overlayVisible,
    morphProgress,
    morphToken,
    sourceFrames,
    targetFrames,
    dayStyles,
    onMorphAnimationComplete,
  } = usePlanSplitTransition();

  const progress = useSharedValue(morphProgress);

  // Hold dots at the start pose until both sides have measured and morphToken bumps.
  useEffect(() => {
    if (!overlayVisible || morphToken > 0) return;
    progress.value = morphProgress;
  }, [overlayVisible, morphToken, morphProgress, progress]);

  useEffect(() => {
    if (!overlayVisible || morphToken <= 0) return undefined;
    const target = morphProgress;
    // Seed without completing, then animate to the requested progress.
    progress.value = target === 1 ? 0 : 1;
    progress.value = withTiming(
      target,
      { duration: MORPH_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onMorphAnimationComplete)(target);
        }
      },
    );
    return undefined;
  }, [overlayVisible, morphToken, morphProgress, onMorphAnimationComplete, progress]);

  if (!overlayVisible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {sourceFrames.map((source, index) => (
        <MorphDot
          key={index}
          source={source}
          target={targetFrames[index] ?? source}
          dayStyle={dayStyles[index] ?? { accent: '#64748B', isRest: true }}
          progress={progress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
});

export default memo(PlanSplitDotMorphOverlay);
