import React, { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const GRID_DAYS = 42;

function dateKey(y, m, d) {
  return `${y}-${m}-${d}`;
}

/** Local calendar dates (y, m, d) that have at least one saved workout. */
function buildWorkoutLocalDateSet(workoutHistory) {
  const set = new Set();
  if (!Array.isArray(workoutHistory)) return set;
  for (let i = 0; i < workoutHistory.length; i += 1) {
    const item = workoutHistory[i];
    if (!item?.completedAt) continue;
    const t = new Date(item.completedAt);
    if (Number.isNaN(t.getTime())) continue;
    set.add(dateKey(t.getFullYear(), t.getMonth(), t.getDate()));
  }
  return set;
}

function PastWorkoutsMonthCalendar({
  year,
  monthIndex,
  workoutHistory,
  onShiftMonth,
  onPressDayWithWorkout,
  styles: s,
  textPrimary,
  textMuted,
  accentSolid,
  today,
}) {
  const workoutLocalDates = useMemo(() => buildWorkoutLocalDateSet(workoutHistory), [workoutHistory]);

  const monthTitle = useMemo(
    () => new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [year, monthIndex],
  );

  const gridCells = useMemo(() => {
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const cells = [];
    for (let i = 0; i < GRID_DAYS; i += 1) {
      const cellDate = new Date(year, monthIndex, 1 - firstWeekday + i);
      const y = cellDate.getFullYear();
      const m = cellDate.getMonth();
      const d = cellDate.getDate();
      const inDisplayMonth = m === monthIndex && y === year;
      const key = `c-${y}-${m}-${d}`;
      const hasWorkout = workoutLocalDates.has(dateKey(y, m, d));
      const isToday =
        today &&
        today.getFullYear() === y &&
        today.getMonth() === m &&
        today.getDate() === d;
      cells.push({
        key,
        y,
        m,
        d,
        inDisplayMonth,
        hasWorkout,
        isToday,
      });
    }
    return cells;
  }, [year, monthIndex, workoutLocalDates, today]);

  return (
    <View style={s.historyCalendarCard}>
      <View style={s.historyCalendarTitleRow}>
        <TouchableOpacity
          style={s.historyCalendarNavBtn}
          onPress={() => onShiftMonth(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous month">
          <Text style={[s.historyCalendarNavBtnText, { color: textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.historyCalendarMonthTitle, { color: textPrimary }]}>{monthTitle}</Text>
        <TouchableOpacity
          style={s.historyCalendarNavBtn}
          onPress={() => onShiftMonth(1)}
          accessibilityRole="button"
          accessibilityLabel="Next month">
          <Text style={[s.historyCalendarNavBtnText, { color: textPrimary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.historyCalendarWeekHeader}>
        {WEEKDAY_LABELS.map((letter, idx) => (
          <Text key={`wd-${idx}`} style={[s.historyCalendarWeekHeaderLetter, { color: textMuted }]}>
            {letter}
          </Text>
        ))}
      </View>

      <View style={s.historyCalendarGrid}>
        {gridCells.map((cell) => {
          const { y, m, d, inDisplayMonth, hasWorkout, isToday } = cell;
          const labelDate = new Date(y, m, d).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          if (hasWorkout) {
            return (
              <TouchableOpacity
                key={cell.key}
                style={s.historyCalendarDaySlot}
                onPress={() => onPressDayWithWorkout({ y, m, d })}
                accessibilityRole="button"
                accessibilityLabel={`Workouts on ${labelDate}`}>
                <View
                  style={[
                    s.historyCalendarDayInner,
                    s.historyCalendarDayHasWorkout,
                    { backgroundColor: accentSolid },
                    !inDisplayMonth ? s.historyCalendarDayAdjacentMonth : null,
                    isToday ? s.historyCalendarDayTodayRing : null,
                  ]}>
                  <Text style={[s.historyCalendarDayNumber, s.historyCalendarDayNumberOnAccent]}>{d}</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <View key={cell.key} style={s.historyCalendarDaySlot}>
              <View
                style={[
                  s.historyCalendarDayInner,
                  s.historyCalendarDayMuted,
                  !inDisplayMonth ? s.historyCalendarDayAdjacentMonth : null,
                  isToday ? s.historyCalendarDayTodayRing : null,
                ]}>
                <Text
                  style={[
                    s.historyCalendarDayNumber,
                    { color: textMuted, opacity: inDisplayMonth ? 1 : 0.5 },
                  ]}>
                  {d}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default memo(PastWorkoutsMonthCalendar);
