import React, { memo, useMemo } from 'react';
import { Animated, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useStyles } from '../../app/context/ThemeStylesContext';

/**
 * Day circle on the plan-split timeline. Long-press then drag to swap with another day.
 */
function PlanTimelineDayDot({
  planIndex,
  accent,
  isTraining,
  borderColor,
  dayLetter,
  letterOpacity,
  iconsHidden,
  dragEnabled,
  isDragSource,
  isDropTarget,
  circleRef,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}) {
  const styles = useStyles();

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .activateAfterLongPress(420)
      .enabled(dragEnabled)
      .maxPointers(1)
      .onStart((event) => {
        runOnJS(onDragStart)(planIndex, event.absoluteX, event.absoluteY);
      })
      .onUpdate((event) => {
        runOnJS(onDragMove)(event.absoluteX, event.absoluteY);
      })
      .onEnd((event) => {
        runOnJS(onDragEnd)(event.absoluteX, event.absoluteY);
      })
      .onFinalize((_event, success) => {
        if (!success) {
          runOnJS(onDragCancel)();
        }
      });
  }, [dragEnabled, onDragCancel, onDragEnd, onDragMove, onDragStart, planIndex]);

  return (
    <View style={styles.planTimelineIconWrap}>
      <GestureDetector gesture={gesture}>
        <View
          collapsable={false}
          style={[
            isDropTarget ? styles.planTimelineDayDotDropTarget : null,
            isDragSource ? styles.planTimelineDayDotSource : null,
          ]}>
          <View
            ref={circleRef}
            collapsable={false}
            style={[
              styles.planTimelineDayDot,
              isTraining
                ? { backgroundColor: accent, borderColor: accent }
                : { backgroundColor: 'transparent', borderColor },
              iconsHidden || isDragSource ? { opacity: 0 } : null,
            ]}
          />
        </View>
      </GestureDetector>
      <Animated.Text
        style={[styles.planTimelineLetter, { opacity: letterOpacity }]}
        pointerEvents="none">
        {dayLetter}
      </Animated.Text>
    </View>
  );
}

export default memo(PlanTimelineDayDot);
