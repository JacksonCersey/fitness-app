import React, { memo, useMemo } from 'react';
import { useGameTheme, useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { SHARED_ACCENTS } from '../theme/gameTheme';
import { Image, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import BackMuscleDiagramSvg from '../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../components/FrontMuscleDiagramSvg';
import { isSplitPlanTrainingDay, weeklySplitPlanIsConfigured } from '../data/weeklySplitPlanner';
import { muscleActivationFromDisplayLabels } from '../utils/muscleActivationFromLabels';
import { getSplitDayAccentColor } from '../utils/splitDayColors';
import { WEEKLY_SET_TARGETS } from '../utils/weeklyPplSetTotals';

const MINI_SVG_HEIGHT = 52;

/** Muscles to highlight on the mini diagrams for each weekly group */
export const CATEGORY_MUSCLES = {
  push: ['Chest', 'Upper Chest', 'Front Delts', 'Side Delts', 'Triceps'],
  pull: ['Lats', 'Upper Back', 'Rear Delts', 'Traps', 'Biceps', 'Forearms'],
  legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
};

export const CATEGORY_ORDER = ['push', 'pull', 'legs'];

export const CATEGORY_LABELS = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
};

const PPL_RING_TRACK = 'rgba(255, 255, 255, 0.12)';

/** Solid accent for rings, bars, and labels (push red, pull yellow, legs blue). */
export const PPL_RING_COLORS = {
  push: SHARED_ACCENTS.pplPush,
  pull: SHARED_ACCENTS.pplPull,
  legs: SHARED_ACCENTS.pplLegs,
};

function TargetsPplProgressRing({
  categoryKey,
  done,
  goal,
  size,
  strokeWidth,
  centerPrimaryColor,
  centerMutedColor,
}) {
  const strokeColor = PPL_RING_COLORS[categoryKey] ?? PPL_RING_COLORS.push;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const frac = goal > 0 ? Math.min(1, Math.max(0, done / goal)) : 0;
  const strokeDashoffset = circumference * (1 - frac);
  const mainFont = Math.round(size * 0.19);
  const subFont = Math.round(size * 0.14);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Circle cx={cx} cy={cy} r={r} stroke={PPL_RING_TRACK} strokeWidth={strokeWidth} fill="none" />
        {goal > 0 ? (
          <G transform={`rotate(-90 ${cx} ${cy})`}>
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        ) : null}
      </Svg>
      <Text style={{ fontSize: mainFont, fontWeight: '800', color: centerPrimaryColor }} allowFontScaling>
        {done}
        <Text style={{ fontSize: subFont, fontWeight: '700', color: centerMutedColor }}>{`/${goal}`}</Text>
      </Text>
    </View>
  );
}

/**
 * Summary row under the split strip: three circular set-progress rings for Push / Pull / Legs.
 */
export const TargetsWeeklyPplRingsRow = memo(function TargetsWeeklyPplRingsRow({ weeklyPplCounts }) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const size = 78;
  const stroke = 8;

  return (
    <View style={styles.targetsPplRingsRow} accessibilityRole="summary">
      {CATEGORY_ORDER.map((categoryKey) => {
        const goal = WEEKLY_SET_TARGETS[categoryKey];
        const done = weeklyPplCounts[categoryKey] ?? 0;
        const labelColor = PPL_RING_COLORS[categoryKey];
        const label = CATEGORY_LABELS[categoryKey];
        return (
          <View
            key={categoryKey}
            style={styles.targetsPplRingCell}
            accessibilityLabel={`${label}, ${done} of ${goal} sets this week`}>
            <TargetsPplProgressRing
              categoryKey={categoryKey}
              done={done}
              goal={goal}
              size={size}
              strokeWidth={stroke}
              centerPrimaryColor={wt.textPrimary}
              centerMutedColor={wt.textMuted}
            />
            <Text style={[styles.targetsPplRingLabel, { color: labelColor }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
});

const BAR_PILL_W = 18;
const BAR_PILL_EDGE_INSET = 3;

/**
 * Horizontal progress under Targets rows: solid fill + white pill at current progress tip.
 */
export function TargetsPplHorizontalProgressBar({ categoryKey, pct, goal, borderColor, trackBg }) {
  const styles = useStyles();
  const fillColor = PPL_RING_COLORS[categoryKey] ?? PPL_RING_COLORS.push;
  const wPct = Math.max(0, Math.min(100, Math.round(pct * 100)));
  const showPill = goal > 0;

  const fillRadii =
    wPct >= 99
      ? { borderTopRightRadius: 5, borderBottomRightRadius: 5 }
      : { borderTopRightRadius: 0, borderBottomRightRadius: 0 };

  let pillPositionStyle;
  if (wPct <= 0) {
    pillPositionStyle = { left: BAR_PILL_EDGE_INSET };
  } else if (wPct >= 100) {
    pillPositionStyle = { right: BAR_PILL_EDGE_INSET };
  } else {
    pillPositionStyle = { left: `${wPct}%`, marginLeft: -BAR_PILL_W / 2 };
  }

  return (
    <View style={[styles.targetsCategoryBarTrack, { borderColor, backgroundColor: trackBg }]}>
      {wPct > 0 ? (
        <View
          style={[
            styles.targetsCategoryBarFillSolid,
            { width: `${wPct}%`, backgroundColor: fillColor },
            fillRadii,
          ]}
        />
      ) : null}
      {showPill ? <View style={[styles.targetsCategoryBarPill, pillPositionStyle]} accessibilityElementsHidden /> : null}
    </View>
  );
}

export function CategoryMusclePair({ categoryKey }) {
  const styles = useStyles();
  const activation = useMemo(
    () => muscleActivationFromDisplayLabels(CATEGORY_MUSCLES[categoryKey] ?? []),
    [categoryKey],
  );

  return (
    <View style={styles.targetsMiniDiagramRow}>
      <View style={styles.targetsMiniDiagramHalf}>
        <FrontMuscleDiagramSvg activationBySlug={activation} height={MINI_SVG_HEIGHT} />
      </View>
      <View style={styles.targetsMiniDiagramHalf}>
        <BackMuscleDiagramSvg activationBySlug={activation} height={MINI_SVG_HEIGHT} />
      </View>
    </View>
  );
}

const SUN_FIRST_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const SUN_FIRST_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function planIndexFromSunFirstColumn(colIndex) {
  return (colIndex + 6) % 7;
}

/** @typedef {'rest' | 'weight' | 'dot' | 'streak' | 'perfect'} WeekStripIcon */

function SplitWeekStripCell({ letter, icon, isToday, a11yLabel, dotColor }) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  return (
    <View
      style={[styles.targetsSplitWeekCell, isToday && styles.targetsSplitWeekCellToday]}
      accessibilityLabel={a11yLabel}>
      <Text
        style={[
          styles.targetsSplitWeekLetter,
          { color: isToday ? '#FFFFFF' : wt.textMuted },
          isToday && styles.targetsSplitWeekLetterToday,
        ]}>
        {letter}
      </Text>
      {icon === 'streak' ? (
        <Image
          source={require('../../assets/images/icons/streaklogo.png')}
          style={styles.targetsSplitWeekStreakIcon}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      ) : icon === 'perfect' ? (
        <Image
          source={require('../../assets/images/icons/perfectstreaklogo.png')}
          style={styles.targetsSplitWeekStreakIcon}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      ) : icon === 'weight' ? (
        <Image
          source={require('../../assets/images/icons/weighticon.png')}
          style={styles.targetsSplitWeekWeightIcon}
          resizeMode="contain"
          accessibilityElementsHidden
        />
      ) : icon === 'dot' ? (
        <View
          style={[
            styles.targetsSplitWeekColorDot,
            { backgroundColor: dotColor, borderColor: dotColor },
          ]}
          accessibilityElementsHidden
        />
      ) : (
        <View
          style={[styles.targetsSplitWeekRestCircle, isToday && styles.targetsSplitWeekRestCircleToday]}
          accessibilityElementsHidden
        />
      )}
    </View>
  );
}

export const TargetsSplitWeekStrip = memo(function TargetsSplitWeekStrip({ weeklySplitPlan }) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const gameTheme = useGameTheme();
  const days = weeklySplitPlan?.days;

  return (
    <View
      style={[styles.targetsSplitWeekStrip, { backgroundColor: wt.splitModalInnerBg, borderColor: wt.inputBorder }]}
      accessibilityRole="summary"
      accessibilityLabel="Split week: Sunday through Saturday from your planner">
      {SUN_FIRST_LETTERS.map((letter, colIndex) => {
        const planIdx = planIndexFromSunFirstColumn(colIndex);
        const dayEntry = days?.[planIdx];
        const isTraining = isSplitPlanTrainingDay(dayEntry);
        const dayType = dayEntry?.type ?? 'rest';
        const a11y = `${SUN_FIRST_NAMES[colIndex]}, ${isTraining ? `${dayType} day` : 'rest day'}`;
        return (
          <SplitWeekStripCell
            key={`${letter}-${colIndex}`}
            letter={letter}
            icon={isTraining ? 'dot' : 'rest'}
            dotColor={isTraining ? getSplitDayAccentColor(dayType, gameTheme) : undefined}
            isToday={false}
            a11yLabel={a11y}
          />
        );
      })}
    </View>
  );
});

/**
 * Home menu week strip: same shell as Targets → Split.
 * Weight = planned training day (split); streak = workout logged that day; circle = rest.
 * @param {{ weeklySplitPlan: { days: unknown[] }; weeklyStreakDays: { key: string; label: string; hasWorkout: boolean; isToday: boolean }[]; usePerfectStreakIcons?: boolean }} props
 */
export const MenuHomeWeekStrip = memo(function MenuHomeWeekStrip({
  weeklySplitPlan,
  weeklyStreakDays,
  usePerfectStreakIcons = false,
}) {
  const styles = useStyles();
  const wt = useWorkoutTheme();
  const planDays = weeklySplitPlan?.days;
  const splitConfigured = weeklySplitPlanIsConfigured(weeklySplitPlan);

  return (
    <View
      style={[styles.targetsSplitWeekStrip, { backgroundColor: wt.splitModalInnerBg, borderColor: wt.inputBorder }]}
      accessibilityRole="summary"
      accessibilityLabel="This week from your split: weight for planned training days, flame when logged">
      {SUN_FIRST_LETTERS.map((letter, colIndex) => {
        const planIdx = planIndexFromSunFirstColumn(colIndex);
        const streakDay = weeklyStreakDays?.[colIndex];
        const hasWorkout = streakDay?.hasWorkout ?? false;
        const isToday = streakDay?.isToday ?? false;
        const dayEntry = planDays?.[planIdx];
        const isTraining = splitConfigured && isSplitPlanTrainingDay(dayEntry);

        /** @type {WeekStripIcon} */
        let icon = 'rest';
        if (hasWorkout) icon = usePerfectStreakIcons ? 'perfect' : 'streak';
        else if (isTraining) icon = 'weight';

        let a11y = SUN_FIRST_NAMES[colIndex];
        if (isToday) a11y += ', today';
        if (hasWorkout) a11y += ', workout completed';
        else if (isTraining) a11y += ', planned workout';
        else a11y += ', rest';

        return (
          <SplitWeekStripCell
            key={streakDay?.key ?? `${letter}-${colIndex}`}
            letter={letter}
            icon={icon}
            isToday={isToday}
            a11yLabel={a11y}
          />
        );
      })}
    </View>
  );
});
