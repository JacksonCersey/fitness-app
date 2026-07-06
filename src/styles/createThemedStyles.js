import { StyleSheet } from 'react-native';
import { createMenuLayoutProfileStyles } from './menuLayoutProfileStyles';
import { createFormsHistoryMuscleStyles } from './formsHistoryMuscleStyles';
import { createHomeDashboardStyles } from './homeDashboardStyles';

export function createThemedStyles(theme) {
  return StyleSheet.create({
    ...createMenuLayoutProfileStyles(theme),
    ...createFormsHistoryMuscleStyles(theme),
    ...createHomeDashboardStyles(theme),
  });
}
