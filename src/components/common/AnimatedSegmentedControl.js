import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { useGameTheme } from '../../app/context/ThemeStylesContext';

const PILL_ANIM_MS = 220;

/**
 * Shared segmented control with a sliding active pill.
 * @param {{
 *   options: Array<{ id: string; label: string }>;
 *   value: string;
 *   onChange: (next: string) => void;
 *   accessibilityRole?: 'tablist' | 'radiogroup';
 *   optionAccessibilityRole?: 'tab' | 'button' | 'radio';
 *   style?: object;
 *   trackStyle?: object;
 *   optionStyle?: object;
 *   textStyle?: object;
 *   activeTextStyle?: object;
 *   inactiveTextColor?: string;
 *   activeTextColor?: string;
 *   pillColor?: string;
 * }} props
 */
function AnimatedSegmentedControl({
  options,
  value,
  onChange,
  accessibilityRole = 'tablist',
  optionAccessibilityRole = 'tab',
  style,
  trackStyle,
  optionStyle,
  textStyle,
  activeTextStyle,
  inactiveTextColor,
  activeTextColor = '#FFFFFF',
  pillColor,
}) {
  const theme = useGameTheme();
  const count = options.length;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const pillX = useRef(new Animated.Value(selectedIndex)).current;
  const hasMeasured = trackWidth > 0 && count > 0;
  const segmentWidth = hasMeasured ? trackWidth / count : 0;

  useEffect(() => {
    if (!hasMeasured) {
      pillX.setValue(selectedIndex);
      return;
    }
    Animated.timing(pillX, {
      toValue: selectedIndex,
      duration: PILL_ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, hasMeasured, pillX]);

  const pillTranslateX = useMemo(
    () =>
      pillX.interpolate({
        inputRange: [0, Math.max(1, count - 1)],
        outputRange: [0, Math.max(0, segmentWidth * Math.max(0, count - 1))],
      }),
    [pillX, count, segmentWidth],
  );

  const resolvedInactiveText = inactiveTextColor ?? theme.textMuted;
  const resolvedPillColor = pillColor ?? theme.navAccent;

  return (
    <View
      // Parent styles may include flexDirection:'row' (legacy track styles). Force column so
      // the options row can stretch to full track width under the absolute pill.
      style={[{ overflow: 'hidden' }, style, trackStyle, { flexDirection: 'column' }]}
      accessibilityRole={accessibilityRole}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs(nextWidth - trackWidth) > 0.5) {
          setTrackWidth(nextWidth);
        }
      }}>
      {hasMeasured ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: segmentWidth,
            backgroundColor: resolvedPillColor,
            borderRadius: 0,
            transform: [{ translateX: pillTranslateX }],
          }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', width: '100%', alignSelf: 'stretch' }}>
        {options.map((option) => {
          const active = value === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, optionStyle]}
              onPress={() => {
                if (option.id !== value) onChange(option.id);
              }}
              accessibilityRole={optionAccessibilityRole}
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
              activeOpacity={0.85}>
              <Text
                style={[
                  textStyle,
                  { color: active ? activeTextColor : resolvedInactiveText },
                  active ? activeTextStyle : null,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default memo(AnimatedSegmentedControl);
