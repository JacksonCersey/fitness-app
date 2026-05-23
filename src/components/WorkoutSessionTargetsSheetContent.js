import React, { memo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BackMuscleDiagramSvg from '../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../components/FrontMuscleDiagramSvg';
import { WEEKLY_SUBCATEGORY_GROUPS } from '../data/weeklyTargetSubcategories';
import { WORKOUT_THEME } from '../theme/workoutTheme';
import { styles } from '../styles';
import { CATEGORY_LABELS, CATEGORY_ORDER, CategoryMusclePair } from './targetsProgressShared';
import { ESTIMATED_WEEKLY_SUBTARGETS, WEEKLY_SET_TARGETS } from '../utils/weeklyPplSetTotals';

const SESSION_DIAGRAM_HEIGHT = 192;

function WorkoutTargetsCategoryRow({
  categoryKey,
  weeklyPplCounts,
  subcategorySetCounts,
  submenuOpen,
  onToggleSubmenu,
}) {
  const wt = WORKOUT_THEME;
  const goal = WEEKLY_SET_TARGETS[categoryKey];
  const done = weeklyPplCounts[categoryKey] ?? 0;
  const pct = goal > 0 ? Math.min(1, done / goal) : 0;
  const open = submenuOpen[categoryKey];
  const subs = WEEKLY_SUBCATEGORY_GROUPS[categoryKey];
  const subCounts = subcategorySetCounts[categoryKey] ?? {};
  const subTargets = ESTIMATED_WEEKLY_SUBTARGETS[categoryKey] ?? {};

  return (
    <View
      style={[styles.targetsDayCard, { backgroundColor: wt.splitModalInnerBg, borderColor: wt.inputBorder }]}
      accessibilityRole="summary"
      accessibilityLabel={`${CATEGORY_LABELS[categoryKey]}, ${done} of ${goal} sets this week including this workout`}>
      <View style={styles.targetsCategoryMainRow}>
        <View style={styles.targetsDayCardLeft}>
          <Text style={[styles.targetsDayName, { color: wt.textPrimary }]}>{CATEGORY_LABELS[categoryKey]}</Text>
          <Text style={[styles.targetsDaySessionLabel, { color: wt.textSecondary }]}>
            {done} / {goal} sets
          </Text>
          <View style={[styles.targetsGoalBarTrack, { borderColor: wt.inputBorder }]}>
            <View
              style={[
                styles.targetsGoalBarFill,
                { width: `${Math.round(pct * 100)}%`, backgroundColor: wt.primaryButtonBg },
              ]}
            />
          </View>
        </View>
        <View style={styles.targetsDayCardRight}>
          <CategoryMusclePair categoryKey={categoryKey} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.targetsSubcategoryToggle}
        onPress={() => onToggleSubmenu(categoryKey)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? 'Hide' : 'Show'} ${CATEGORY_LABELS[categoryKey]} subcategories`}>
        <Text style={[styles.targetsSubcategoryChevron, { color: wt.textSecondary }]}>{open ? '▼' : '▶'}</Text>
        <Text style={[styles.targetsSubcategoryToggleText, { color: wt.textPrimary }]}>Subcategories</Text>
      </TouchableOpacity>

      {open ? (
        <View style={[styles.targetsSubcategoryList, { borderTopColor: wt.cardBorder }]}>
          {subs.map((subItem) => {
            const n = subCounts[subItem.id] ?? 0;
            const target = subTargets[subItem.id] ?? 0;
            return (
              <View
                key={subItem.id}
                style={styles.targetsSubcategoryRow}
                accessibilityLabel={`${subItem.label}, ${n} of ${target} sets`}>
                <Text style={[styles.targetsSubcategoryName, { color: wt.textSecondary }]}>{subItem.label}</Text>
                <View
                  style={[
                    styles.targetsSubcategoryPill,
                    { backgroundColor: wt.splitModalCardBg, borderColor: wt.inputBorder },
                  ]}>
                  <Text style={[styles.targetsSubcategorySets, { color: wt.textPrimary }]}>{n}</Text>
                  <Text style={[styles.targetsSubcategoryTargetMuted, { color: wt.textMuted }]}> / {target}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function WorkoutSessionTargetsSheetContent({
  weeklyPplCountsWithSession,
  weeklySubcategorySetCountsWithSession,
  sessionActivationBySlug,
  onClose,
}) {
  const wt = WORKOUT_THEME;
  const [submenuOpen, setSubmenuOpen] = useState(() => ({
    push: false,
    pull: false,
    legs: false,
  }));

  const onToggleSubmenu = (categoryKey) => {
    setSubmenuOpen((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

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

      {CATEGORY_ORDER.map((categoryKey) => (
        <View key={categoryKey} style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <WorkoutTargetsCategoryRow
            categoryKey={categoryKey}
            weeklyPplCounts={weeklyPplCountsWithSession}
            subcategorySetCounts={weeklySubcategorySetCountsWithSession}
            submenuOpen={submenuOpen}
            onToggleSubmenu={onToggleSubmenu}
          />
        </View>
      ))}
    </View>
  );
}

export default memo(WorkoutSessionTargetsSheetContent);
