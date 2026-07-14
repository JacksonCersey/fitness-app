import React, { memo } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { Text, TouchableOpacity, View } from 'react-native';
import BackMuscleDiagramSvg from '../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../components/FrontMuscleDiagramSvg';

const SESSION_DIAGRAM_HEIGHT = 280;

function WorkoutSessionTargetsSheetContent({ sessionActivationBySlug, onClose }) {
  const styles = useStyles();
  const wt = useWorkoutTheme();

  return (
    <View style={[styles.activeWorkoutSheetCard, { flexGrow: 1, paddingBottom: 8 }]}>
      <View style={styles.activeWorkoutLogSheetHeader}>
        <View style={styles.activeWorkoutLogSheetDragPill} />
        <View style={[styles.activeWorkoutLogSheetHeaderTitleRow, { justifyContent: 'flex-end' }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.activeWorkoutLogSheetCloseTouch}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Text style={styles.activeWorkoutLogSheetCloseMark}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.menuMoreSectionTitle, { color: wt.textPrimary, marginHorizontal: 16, marginBottom: 8 }]}>
        This workout — target map
      </Text>
      <View style={{ paddingHorizontal: 12, marginBottom: 16 }}>
        <View style={[styles.targetsMiniDiagramRow, { minHeight: SESSION_DIAGRAM_HEIGHT }]}>
          <View style={styles.targetsMiniDiagramHalf}>
            <FrontMuscleDiagramSvg
              activationBySlug={sessionActivationBySlug ?? {}}
              height={SESSION_DIAGRAM_HEIGHT}
            />
          </View>
          <View style={styles.targetsMiniDiagramHalf}>
            <BackMuscleDiagramSvg
              activationBySlug={sessionActivationBySlug ?? {}}
              height={SESSION_DIAGRAM_HEIGHT}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(WorkoutSessionTargetsSheetContent);
