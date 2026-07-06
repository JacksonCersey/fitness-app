import React, { memo, useCallback, useMemo, useState } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  TargetsPplHorizontalProgressBar,
  TargetsSplitWeekStrip,
  TargetsWeeklyPplRingsRow,
} from '../components/targetsProgressShared';
import { WEEKLY_SUBCATEGORY_GROUPS } from '../data/weeklyTargetSubcategories';
import { ESTIMATED_WEEKLY_SUBTARGETS, WEEKLY_SET_TARGETS } from '../utils/weeklyPplSetTotals';

function formatWeekRangeLabel(weekStartMonday) {
  const end = new Date(weekStartMonday);
  end.setDate(end.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${weekStartMonday.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function TargetsCategoryCard({
  categoryKey,
  weeklyPplCounts,
  subcategorySetCounts,
  submenuOpen,
  onToggleSubmenu,
}) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const goal = WEEKLY_SET_TARGETS[categoryKey];
  const done = weeklyPplCounts[categoryKey] ?? 0;
  const pct = goal > 0 ? Math.min(1, done / goal) : 0;
  const open = submenuOpen[categoryKey];
  const subs = WEEKLY_SUBCATEGORY_GROUPS[categoryKey];
  const subCounts = subcategorySetCounts[categoryKey] ?? {};
  const subTargets = ESTIMATED_WEEKLY_SUBTARGETS[categoryKey] ?? {};

  return (
    <View
      style={[styles.targetsDayCard, { backgroundColor: wt.cardBg, borderColor: wt.cardBorder }]}
      accessibilityRole="summary"
      accessibilityLabel={`${CATEGORY_LABELS[categoryKey]}, ${done} of ${goal} sets this week`}>
      <View style={styles.targetsCategoryMainRow}>
        <View style={styles.targetsCategoryTextBlock}>
          <Text style={[styles.targetsDayName, { color: wt.textPrimary }]}>{CATEGORY_LABELS[categoryKey]}</Text>
          <Text style={[styles.targetsDaySessionLabel, { color: wt.textSecondary }]}>
            {done} / {goal} sets
          </Text>
        </View>
        <View style={styles.targetsCategoryBarWrap}>
          <TargetsPplHorizontalProgressBar
            categoryKey={categoryKey}
            pct={pct}
            goal={goal}
            borderColor={wt.inputBorder}
            trackBg={wt.splitModalInnerBg}
          />
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
                accessibilityLabel={`${subItem.label}, ${n} of ${target} sets this week`}>
                <Text style={[styles.targetsSubcategoryName, { color: wt.textSecondary }]}>{subItem.label}</Text>
                <View
                  style={[
                    styles.targetsSubcategoryPill,
                    { backgroundColor: wt.splitModalInnerBg, borderColor: wt.inputBorder },
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

function MuscleMapTabScreen({
  mainTabBottomReserve,
  weeklyPplCounts,
  weeklySubcategorySetCounts,
  lastWorkoutPplBreakdown,
  weekStartMonday,
  weeklySplitPlan,
}) {
  const styles = useStyles();
  const wt = useWorkoutTheme();

  const weekLabel = useMemo(() => formatWeekRangeLabel(weekStartMonday), [weekStartMonday]);

  const [submenuOpen, setSubmenuOpen] = useState(() => ({
    push: false,
    pull: false,
    legs: false,
  }));

  const onToggleSubmenu = useCallback((categoryKey) => {
    setSubmenuOpen((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }, []);

  const lastSets = lastWorkoutPplBreakdown?.sets;
  const lastMovements = lastWorkoutPplBreakdown?.movements;
  const hasLastWorkoutBreakdown =
    lastSets &&
    (lastSets.push > 0 || lastSets.pull > 0 || lastSets.legs > 0) &&
    lastMovements;

  return (
    <View style={[styles.workoutScreenWrapper, { backgroundColor: wt.screenBg }]}>
      <ScrollView
        style={[styles.mainTabsFullBleedScroll, { backgroundColor: wt.screenBg }]}
        contentContainerStyle={[styles.container, { paddingBottom: 32 + mainTabBottomReserve }]}>
        <Text style={[styles.summaryTitle, { color: wt.textPrimary }]}>Targets</Text>
        <TargetsSplitWeekStrip weeklySplitPlan={weeklySplitPlan} />
        <TargetsWeeklyPplRingsRow weeklyPplCounts={weeklyPplCounts} />
        <Text style={[styles.profileHint, { color: wt.textMuted, marginBottom: 16 }]}>
          Goals: {WEEKLY_SET_TARGETS.push} push · {WEEKLY_SET_TARGETS.pull} pull · {WEEKLY_SET_TARGETS.legs} legs · Week{' '}
          {weekLabel}
        </Text>

        <Text style={[styles.menuMoreSectionTitle, { color: wt.textPrimary, marginBottom: 10 }]}>Progress</Text>

        {CATEGORY_ORDER.map((categoryKey) => (
          <TargetsCategoryCard
            key={categoryKey}
            categoryKey={categoryKey}
            weeklyPplCounts={weeklyPplCounts}
            subcategorySetCounts={weeklySubcategorySetCounts}
            submenuOpen={submenuOpen}
            onToggleSubmenu={onToggleSubmenu}
          />
        ))}

        <Text style={[styles.menuMoreSectionTitle, { color: wt.textPrimary, marginTop: 20, marginBottom: 8 }]}>
          Last workout
        </Text>
        {hasLastWorkoutBreakdown ? (
          <View style={[styles.targetsLastWorkoutCard, { backgroundColor: wt.innerCardBg, borderColor: wt.inputBorder }]}>
            <Text style={[styles.setText, { color: wt.textPrimary }]}>
              Push {lastMovements.push} movements ({lastSets.push} sets) · Pull {lastMovements.pull} movements (
              {lastSets.pull} sets) · Legs {lastMovements.legs} movements ({lastSets.legs} sets)
            </Text>
            <Text style={[styles.profileHint, { color: wt.textMuted, marginTop: 6, marginBottom: 0 }]}>
              Counts only include exercises in your database (custom names are skipped).
            </Text>
          </View>
        ) : (
          <Text style={[styles.setText, { color: wt.textMuted }]}>
            Finish a workout with logged sets to see how it split across push, pull, and legs.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

export default memo(MuscleMapTabScreen);
