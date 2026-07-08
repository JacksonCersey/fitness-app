import React, { memo } from 'react';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { CHART_TIME_RANGE_OPTIONS } from '../../utils/chartTimeRange';
import AnimatedSegmentedControl from '../common/AnimatedSegmentedControl';

/**
 * Segmented time-range control for progress graphs.
 * @param {{
 *   value: import('../../utils/chartTimeRange').ChartTimeRange;
 *   onChange: (next: import('../../utils/chartTimeRange').ChartTimeRange) => void;
 *   options?: Array<{ id: import('../../utils/chartTimeRange').ChartTimeRange; label: string }>;
 * }} props
 */
function ProgressChartRangeFilter({ value, onChange, options = CHART_TIME_RANGE_OPTIONS }) {
  const styles = useStyles();
  const theme = useGameTheme();

  return (
    <AnimatedSegmentedControl
      options={options}
      value={value}
      onChange={onChange}
      accessibilityRole="radiogroup"
      optionAccessibilityRole="button"
      style={styles.progressChartRangeFilter}
      optionStyle={styles.progressChartRangeFilterOption}
      textStyle={styles.progressChartRangeFilterText}
      inactiveTextColor={theme.textMuted}
      activeTextColor="#FFFFFF"
      pillColor={theme.navAccent}
    />
  );
}

export default memo(ProgressChartRangeFilter);
