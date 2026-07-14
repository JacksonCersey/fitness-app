import React, { memo, useCallback, useRef } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import { Animated, Image, PanResponder, Text, TouchableOpacity, View } from 'react-native';

const DELETE_REVEAL_WIDTH = 80;

function ActiveWorkoutExerciseSwipeRow({
  workoutSlotId,
  movementLabel,
  setCount,
  subtitle = null,
  iconSource,
  onOpen,
  onRequestDelete,
}) {
  const styles = useStyles();
  const translateX = useRef(new Animated.Value(0)).current;
  const dragStartX = useRef(0);
  const isOpenRef = useRef(false);

  const snapTo = useCallback(
    (open) => {
      isOpenRef.current = open;
      Animated.spring(translateX, {
        toValue: open ? -DELETE_REVEAL_WIDTH : 0,
        useNativeDriver: true,
        friction: 9,
        tension: 80,
      }).start();
    },
    [translateX],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onPanResponderGrant: () => {
        dragStartX.current = isOpenRef.current ? -DELETE_REVEAL_WIDTH : 0;
        translateX.stopAnimation((value) => {
          dragStartX.current = value;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-DELETE_REVEAL_WIDTH, dragStartX.current + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const projected = dragStartX.current + g.dx;
        const shouldOpen = projected < -DELETE_REVEAL_WIDTH * 0.42 || g.vx < -0.35;
        snapTo(shouldOpen);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const handleRowPress = useCallback(() => {
    if (isOpenRef.current) {
      snapTo(false);
      return;
    }
    onOpen(workoutSlotId);
  }, [workoutSlotId, onOpen, snapTo]);

  const handleDeletePress = useCallback(() => {
    snapTo(false);
    onRequestDelete(workoutSlotId);
  }, [workoutSlotId, onRequestDelete, snapTo]);

  return (
    <View style={styles.activeWorkoutSwipeRowOuter}>
      <View style={styles.activeWorkoutSwipeDeleteWell}>
        <TouchableOpacity
          style={styles.activeWorkoutSwipeDeleteButton}
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${movementLabel}`}>
          <Text style={styles.activeWorkoutSwipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[styles.activeWorkoutSwipeRowFront, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.activeWorkoutExerciseRow}
          onPress={handleRowPress}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`Open ${movementLabel}`}>
          <View style={styles.activeWorkoutExerciseIconWell}>
            {iconSource ? (
              <Image source={iconSource} style={styles.activeWorkoutExerciseIcon} resizeMode="contain" />
            ) : null}
          </View>
          <View style={styles.activeWorkoutExerciseTextCol}>
            <Text style={styles.activeWorkoutExerciseTitle} numberOfLines={2}>
              {movementLabel}
            </Text>
            <Text style={styles.activeWorkoutExerciseSub}>
              {subtitle != null
                ? subtitle
                : setCount === 0
                  ? 'No sets yet'
                  : `${setCount} set${setCount === 1 ? '' : 's'}`}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default memo(ActiveWorkoutExerciseSwipeRow);
