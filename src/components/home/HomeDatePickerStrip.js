import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { FlatList, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import {
  buildDateRangeAround,
  dateHasLoggedWorkout,
  formatWeekdayShort,
  indexOfSameDay,
  isSameLocalDay,
} from '../../utils/homeDashboard';

const DATE_CELL_WIDTH = 56;
const DAYS_BEFORE = 90;
const DAYS_AFTER = 90;
/** Matches `homeScreenContent` horizontal padding in MenuHomeTabScreen. */
const PARENT_HORIZONTAL_PADDING = 16;
/** `homeDateStripWrap` uses marginHorizontal: -8, so the strip is wider than the padded content. */
const DATE_STRIP_OUTSET = 8;

/**
 * @param {{
 *   selectedDate: Date;
 *   onSelectDate: (date: Date) => void;
 *   workoutHistory: unknown[];
 * }} props
 */
function HomeDatePickerStrip({ selectedDate, onSelectDate, workoutHistory }) {
  const styles = useStyles();
  const theme = useGameTheme();
  const { width: screenWidth } = useWindowDimensions();
  const stripEdgeInset = PARENT_HORIZONTAL_PADDING - DATE_STRIP_OUTSET;
  const listWidth = screenWidth - stripEdgeInset * 2;
  const sideInset = Math.max(0, (listWidth - DATE_CELL_WIDTH) / 2);
  const listRef = useRef(null);
  const isScrollingFromParent = useRef(false);
  const listIsReady = useRef(false);

  const dates = useMemo(() => buildDateRangeAround(new Date(), DAYS_BEFORE, DAYS_AFTER), []);

  const selectedIndex = useMemo(
    () => indexOfSameDay(dates, selectedDate),
    [dates, selectedDate],
  );

  const scrollToSelected = useCallback(
    (animated) => {
      if (selectedIndex < 0 || !listRef.current) return;
      isScrollingFromParent.current = true;
      listRef.current.scrollToIndex({ index: selectedIndex, animated });
      setTimeout(
        () => {
          isScrollingFromParent.current = false;
        },
        animated ? 350 : 50,
      );
    },
    [selectedIndex],
  );

  const handleListLayout = useCallback(() => {
    if (listIsReady.current) return;
    listIsReady.current = true;
    requestAnimationFrame(() => scrollToSelected(false));
  }, [scrollToSelected]);

  useEffect(() => {
    if (!listIsReady.current) return;
    scrollToSelected(true);
  }, [selectedIndex, scrollToSelected]);

  const handleMomentumEnd = useCallback(
    (event) => {
      if (isScrollingFromParent.current) return;
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / DATE_CELL_WIDTH);
      const clamped = Math.max(0, Math.min(dates.length - 1, index));
      const next = dates[clamped];
      if (!isSameLocalDay(next, selectedDate)) {
        onSelectDate(next);
      }
    },
    [dates, onSelectDate, selectedDate],
  );

  const renderItem = useCallback(
    ({ item: date }) => {
      const isSelected = isSameLocalDay(date, selectedDate);
      const hasWorkout = dateHasLoggedWorkout(workoutHistory, date);
      return (
        <TouchableOpacity
          style={styles.homeDateCell}
          activeOpacity={0.85}
          onPress={() => onSelectDate(date)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`${formatWeekdayShort(date)} ${date.getDate()}`}>
          <View style={styles.homeDateCellInner}>
            {isSelected ? (
              <BlurView
                intensity={40}
                tint={theme.isLight ? 'light' : 'dark'}
                style={styles.homeDateCellGlass}
              />
            ) : null}
            <Text style={[styles.homeDateWeekday, isSelected && styles.homeDateWeekdaySelected]}>
              {formatWeekdayShort(date)}
            </Text>
            <Text style={[styles.homeDateNumber, isSelected && styles.homeDateNumberSelected]}>
              {date.getDate()}
            </Text>
            <View style={[styles.homeDateDot, hasWorkout && styles.homeDateDotLogged]} />
          </View>
        </TouchableOpacity>
      );
    },
    [onSelectDate, selectedDate, styles, theme.isLight, workoutHistory],
  );

  return (
    <View style={styles.homeDateStripWrap}>
      <FlatList
        ref={listRef}
        data={dates}
        keyExtractor={(d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: listWidth }}
        contentContainerStyle={{ paddingHorizontal: sideInset }}
        snapToInterval={DATE_CELL_WIDTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: DATE_CELL_WIDTH,
          offset: DATE_CELL_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumEnd}
        onLayout={handleListLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
      />
    </View>
  );
}

export default memo(HomeDatePickerStrip);
