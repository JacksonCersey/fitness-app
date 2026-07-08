import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { CHART_TIME_RANGE_OPTIONS } from '../../utils/chartTimeRange';

/**
 * Segmented Week / Month / Year / All control for progress graphs.
 * @param {{
 *   value: import('../../utils/chartTimeRange').ChartTimeRange;
 *   onChange: (next: import('../../utils/chartTimeRange').ChartTimeRange) => void;
 * }} props
 */
function ProgressChartRangeFilter({ value, onChange }) {
  const styles = useStyles();
  const theme = useGameTheme();

  return (
    <View style={styles.progressChartRangeFilter}>
      {CHART_TIME_RANGE_OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.progressChartRangeFilterOption,
              active && { backgroundColor: theme.navAccent },
            ]}
            onPress={() => onChange(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Show ${option.label.toLowerCase()} range`}>
            <Text
              style={[
                styles.progressChartRangeFilterText,
                { color: active ? '#FFFFFF' : theme.textMuted },
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default memo(ProgressChartRangeFilter);
