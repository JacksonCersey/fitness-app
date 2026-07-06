import React, { memo, useEffect, useRef } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function configureMovementsAccordionAnimation() {
  LayoutAnimation.configureNext({
    duration: 280,
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

/**
 * @param {{
 *   sectionId: string,
 *   label: string,
 *   count: number,
 *   expanded: boolean,
 *   onToggle: (sectionId: string) => void,
 *   nested?: boolean,
 *   children: React.ReactNode,
 * }} props
 */
function MovementsAccordionSection({ sectionId, label, count, expanded, onToggle, nested = false, children }) {
  const styles = useStyles();
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [expanded, chevronAnim]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={[styles.movementsAccordionSection, nested && styles.movementsAccordionSectionNested]}>
      <TouchableOpacity
        style={[
          styles.movementsAccordionHeader,
          nested && styles.movementsAccordionHeaderNested,
          expanded && styles.movementsAccordionHeaderExpanded,
        ]}
        onPress={() => onToggle(sectionId)}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${label}, ${count} movement${count === 1 ? '' : 's'}`}>
        <Animated.Text
          style={[styles.movementsAccordionChevron, nested && styles.movementsAccordionChevronNested, { transform: [{ rotate: chevronRotate }] }]}>
          ›
        </Animated.Text>
        <Text style={[styles.movementsAccordionLabel, nested && styles.movementsAccordionLabelNested]}>{label}</Text>
        <Text style={styles.movementsAccordionCount}>{count}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={[styles.movementsAccordionBody, nested && styles.movementsAccordionBodyNested]}>{children}</View>
      ) : null}
    </View>
  );
}

export default memo(MovementsAccordionSection);
