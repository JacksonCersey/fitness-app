import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Keyboard } from 'react-native';
import {
  buildMonthlyDailyVolume,
  buildYearlyMonthlyVolume,
  getDaysInMonth,
} from '../../../utils/workoutStats';
import { getWorkoutsForCalendarDay } from '../../utils/historicalWorkoutSummary';
import { useAppStorage } from './AppStorageContext';
import { useAppNavigation } from './AppNavigationContext';
import { shouldUseMoreHubSlideTransition } from '../../constants/layout';

const HistoryProgressContext = createContext(null);

export function useHistoryProgress() {
  const ctx = useContext(HistoryProgressContext);
  if (!ctx) {
    throw new Error('useHistoryProgress must be used within HistoryProgressProvider');
  }
  return ctx;
}

export function HistoryProgressProvider({ children, onReturnFromSubscreenRef }) {
  const nowForDefaults = new Date();
  const { workoutHistory, weightLogs, setWeightLogs, strengthScoreSummary, colors } = useAppStorage();
  const { setCurrentScreen, handleOpenStrengthMovements, subNavigatorReturnRef, currentScreen, runMoreSubscreenPop } =
    useAppNavigation();

  const [historySelectedMonth, setHistorySelectedMonth] = useState(nowForDefaults.getMonth());
  const [historySelectedYear, setHistorySelectedYear] = useState(nowForDefaults.getFullYear());
  const [historyCalendarMonth, setHistoryCalendarMonth] = useState(nowForDefaults.getMonth());
  const [historyCalendarYear, setHistoryCalendarYear] = useState(nowForDefaults.getFullYear());
  const [historyChartMode, setHistoryChartMode] = useState('month');
  const [historyProgressSection, setHistoryProgressSection] = useState('overview');
  const [historyDayPick, setHistoryDayPick] = useState(null);
  const [viewingHistoricalWorkoutId, setViewingHistoricalWorkoutId] = useState(null);
  const historicalSummaryReturnRef = useRef('history');
  const [isWeightLogModalVisible, setIsWeightLogModalVisible] = useState(false);
  const [weightLogDraftValue, setWeightLogDraftValue] = useState('');
  const [weightLogDraftDate, setWeightLogDraftDate] = useState('');
  const [editingWeightLogId, setEditingWeightLogId] = useState(null);
  const [isWeightDatePickerVisible, setIsWeightDatePickerVisible] = useState(false);
  const [weightDatePickYear, setWeightDatePickYear] = useState(nowForDefaults.getFullYear());
  const [weightDatePickMonth, setWeightDatePickMonth] = useState(nowForDefaults.getMonth() + 1);
  const [weightDatePickDay, setWeightDatePickDay] = useState(nowForDefaults.getDate());

  const historySelectedDate = useMemo(
    () => new Date(historySelectedYear, historySelectedMonth, 1),
    [historySelectedYear, historySelectedMonth],
  );

  const shiftHistoryMonth = useCallback(
    (delta) => {
      const nextDate = new Date(historySelectedYear, historySelectedMonth + delta, 1);
      setHistorySelectedMonth(nextDate.getMonth());
      setHistorySelectedYear(nextDate.getFullYear());
    },
    [historySelectedMonth, historySelectedYear],
  );

  const shiftHistoryYear = useCallback((delta) => {
    setHistorySelectedYear((previousYear) => previousYear + delta);
  }, []);

  const shiftHistoryCalendarMonth = useCallback(
    (delta) => {
      const nextDate = new Date(historyCalendarYear, historyCalendarMonth + delta, 1);
      setHistoryCalendarMonth(nextDate.getMonth());
      setHistoryCalendarYear(nextDate.getFullYear());
    },
    [historyCalendarMonth, historyCalendarYear],
  );

  const historyAllWeightLogsSorted = useMemo(() => {
    return [...weightLogs]
      .filter((logItem) => logItem && logItem.dateISO)
      .filter((logItem) => !Number.isNaN(new Date(logItem.dateISO).getTime()))
      .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [weightLogs]);

  const monthlyVolumeStats = useMemo(
    () => buildMonthlyDailyVolume(workoutHistory, historySelectedDate),
    [workoutHistory, historySelectedDate],
  );
  const yearlyVolumeStats = useMemo(
    () => buildYearlyMonthlyVolume(workoutHistory, historySelectedYear),
    [workoutHistory, historySelectedYear],
  );

  const historyMonthLabel = useMemo(() => {
    return historySelectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [historySelectedDate]);
  const historyYearLabel = useMemo(() => `${historySelectedYear}`, [historySelectedYear]);
  const historyMonthXAxisLabels = useMemo(
    () => monthlyVolumeStats.byDay.map((_, index) => `${index + 1}`),
    [monthlyVolumeStats.byDay],
  );
  const weightDatePickerYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, index) => currentYear - 10 + index);
  }, []);
  const weightDatePickerMonthOptions = useMemo(() => {
    const today = new Date();
    const maxMonth = weightDatePickYear === today.getFullYear() ? today.getMonth() + 1 : 12;
    return Array.from({ length: maxMonth }, (_, index) => index + 1);
  }, [weightDatePickYear]);
  const weightDatePickerDayOptions = useMemo(() => {
    const today = new Date();
    let dayCount = getDaysInMonth(weightDatePickYear, weightDatePickMonth - 1);
    if (
      weightDatePickYear === today.getFullYear() &&
      weightDatePickMonth === today.getMonth() + 1
    ) {
      dayCount = Math.min(dayCount, today.getDate());
    }
    return Array.from({ length: dayCount }, (_, index) => index + 1);
  }, [weightDatePickMonth, weightDatePickYear]);

  useEffect(() => {
    const today = new Date();
    if (
      weightDatePickYear === today.getFullYear() &&
      weightDatePickMonth > today.getMonth() + 1
    ) {
      setWeightDatePickMonth(today.getMonth() + 1);
      return;
    }
    const maxDay = getDaysInMonth(weightDatePickYear, weightDatePickMonth - 1);
    const todayMaxDay =
      weightDatePickYear === today.getFullYear() &&
      weightDatePickMonth === today.getMonth() + 1
        ? today.getDate()
        : maxDay;
    if (weightDatePickDay > todayMaxDay) setWeightDatePickDay(todayMaxDay);
  }, [weightDatePickYear, weightDatePickMonth, weightDatePickDay]);

  const historyYearXAxisLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIdx) =>
        new Date(2026, monthIdx, 1).toLocaleDateString(undefined, { month: 'short' }),
      ),
    [],
  );
  const historyChartValues =
    historyChartMode === 'year' ? yearlyVolumeStats.byMonth : monthlyVolumeStats.byDay;
  const historyChartMax =
    historyChartMode === 'year' ? yearlyVolumeStats.maxVolume : monthlyVolumeStats.maxVolume;

  const workoutsForHistoryDay = useMemo(
    () => getWorkoutsForCalendarDay(workoutHistory, historyDayPick),
    [workoutHistory, historyDayPick],
  );

  const historyDayScreenTitle = useMemo(() => {
    if (!historyDayPick) return '';
    return new Date(historyDayPick.y, historyDayPick.m, historyDayPick.d).toLocaleDateString(
      undefined,
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    );
  }, [historyDayPick]);

  const historyWeightChartPoints = useMemo(() => {
    const valid = [...weightLogs].filter((logItem) => {
      if (!logItem?.dateISO) return false;
      const d = new Date(logItem.dateISO);
      return !Number.isNaN(d.getTime());
    });
    valid.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
    const years = new Set(valid.map((l) => new Date(l.dateISO).getFullYear()));
    const multiYear = years.size > 1;
    return valid.map((logItem) => {
      const d = new Date(logItem.dateISO);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const label = multiYear ? `${m}/${day}/${String(d.getFullYear()).slice(-2)}` : `${m}/${day}`;
      return {
        label,
        value: Number(logItem.weightLb),
        timestamp: d.getTime(),
      };
    });
  }, [weightLogs]);

  const getTodayDateInputValue = useCallback(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const formatWeightLogDateForInput = useCallback(
    (dateISO) => {
      const d = new Date(dateISO || '');
      if (Number.isNaN(d.getTime())) return getTodayDateInputValue();
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    },
    [getTodayDateInputValue],
  );

  const closeWeightLogModal = useCallback(() => {
    setIsWeightDatePickerVisible(false);
    setIsWeightLogModalVisible(false);
    setEditingWeightLogId(null);
  }, []);

  const openWeightLogModal = useCallback(() => {
    const now = new Date();
    setEditingWeightLogId(null);
    setWeightLogDraftValue('');
    setWeightLogDraftDate(getTodayDateInputValue());
    setWeightDatePickYear(now.getFullYear());
    setWeightDatePickMonth(now.getMonth() + 1);
    setWeightDatePickDay(now.getDate());
    setIsWeightLogModalVisible(true);
  }, [getTodayDateInputValue]);

  const openWeightLogModalForEdit = useCallback(
    (entry) => {
      if (!entry?.id) return;
      const parsed = new Date(entry.dateISO || '');
      const dateForPickers = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
      setEditingWeightLogId(entry.id);
      setWeightLogDraftValue(String(entry.weightLb ?? ''));
      setWeightLogDraftDate(formatWeightLogDateForInput(entry.dateISO));
      setWeightDatePickYear(dateForPickers.getFullYear());
      setWeightDatePickMonth(dateForPickers.getMonth() + 1);
      setWeightDatePickDay(dateForPickers.getDate());
      setIsWeightLogModalVisible(true);
    },
    [formatWeightLogDateForInput],
  );

  const parseDateInputOrToday = useCallback((text) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(text || '')) {
      const parsed = new Date(`${text}T12:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, []);

  const openWeightDatePicker = useCallback(() => {
    Keyboard.dismiss();
    const parsed = parseDateInputOrToday(weightLogDraftDate);
    setWeightDatePickYear(parsed.getFullYear());
    setWeightDatePickMonth(parsed.getMonth() + 1);
    setWeightDatePickDay(parsed.getDate());
    setIsWeightDatePickerVisible(true);
  }, [parseDateInputOrToday, weightLogDraftDate]);

  const applyWeightDatePickerSelection = useCallback(() => {
    const maxDay = getDaysInMonth(weightDatePickYear, weightDatePickMonth - 1);
    const clampedDay = Math.max(1, Math.min(maxDay, weightDatePickDay));
    const yyyy = String(weightDatePickYear);
    const mm = String(weightDatePickMonth).padStart(2, '0');
    const dd = String(clampedDay).padStart(2, '0');
    setWeightLogDraftDate(`${yyyy}-${mm}-${dd}`);
    setWeightDatePickDay(clampedDay);
    setIsWeightDatePickerVisible(false);
  }, [weightDatePickYear, weightDatePickMonth, weightDatePickDay]);

  const saveWeightLogEntry = useCallback(() => {
    const valueText = weightLogDraftValue.trim();
    if (!valueText) {
      Alert.alert('Missing weight', 'Enter your body weight before saving.');
      return;
    }
    const parsedWeight = Number.parseFloat(valueText);
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Invalid weight', 'Weight must be a positive number.');
      return;
    }

    const dateText = weightLogDraftDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      Alert.alert('Invalid date', 'Use date format YYYY-MM-DD.');
      return;
    }
    const parsedDate = new Date(`${dateText}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Please enter a real calendar date.');
      return;
    }
    const today = new Date();
    const todayKeyDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const pickedKeyDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    if (pickedKeyDate.getTime() > todayKeyDate.getTime()) {
      Alert.alert('Future date not allowed', 'Please choose today or an earlier date.');
      return;
    }

    if (editingWeightLogId) {
      setWeightLogs((previousLogs) =>
        previousLogs.map((entry) =>
          entry.id === editingWeightLogId
            ? { ...entry, dateISO: parsedDate.toISOString(), weightLb: parsedWeight }
            : entry,
        ),
      );
    } else {
      setWeightLogs((previousLogs) => [
        ...previousLogs,
        {
          id: `${Date.now()}`,
          dateISO: parsedDate.toISOString(),
          weightLb: parsedWeight,
        },
      ]);
    }
    closeWeightLogModal();
  }, [
    weightLogDraftValue,
    weightLogDraftDate,
    editingWeightLogId,
    setWeightLogs,
    closeWeightLogModal,
  ]);

  const handleDeleteWeightLogEntry = useCallback(
    (weightLogId) => {
      Alert.alert('Delete entry?', 'Remove this weight entry?', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setWeightLogs((previousLogs) => previousLogs.filter((entry) => entry.id !== weightLogId));
          },
        },
      ]);
    },
    [setWeightLogs],
  );

  const handleOpenHistoryFromMore = useCallback(() => {
    subNavigatorReturnRef.current = 'settings';
    const now = new Date();
    setHistorySelectedMonth(now.getMonth());
    setHistorySelectedYear(now.getFullYear());
    setHistoryCalendarMonth(now.getMonth());
    setHistoryCalendarYear(now.getFullYear());
    setHistoryChartMode('month');
    setHistoryProgressSection('overview');
    startTransition(() => setCurrentScreen('history'));
  }, [setCurrentScreen, subNavigatorReturnRef]);

  const handleOpenHistoricalWorkoutSummary = useCallback(
    (workoutId, returnTo = 'history') => {
      historicalSummaryReturnRef.current = returnTo;
      setViewingHistoricalWorkoutId(workoutId);
      setCurrentScreen('historicalWorkoutSummary');
    },
    [setCurrentScreen],
  );

  const handleCloseHistoricalWorkoutSummary = useCallback(() => {
    const returnTo = historicalSummaryReturnRef.current;
    setViewingHistoricalWorkoutId(null);
    if (returnTo === 'historyDay') {
      setCurrentScreen('historyDay');
      return;
    }
    setHistoryDayPick(null);
    setCurrentScreen('history');
  }, [setCurrentScreen]);

  const handleOpenHistoryDayDetail = useCallback(
    (pick) => {
      const dayPick = { y: pick.y, m: pick.m, d: pick.d };
      const dayWorkouts = getWorkoutsForCalendarDay(workoutHistory, dayPick);
      setHistoryDayPick(dayPick);
      if (dayWorkouts.length === 1) {
        handleOpenHistoricalWorkoutSummary(dayWorkouts[0].id, 'history');
        return;
      }
      setCurrentScreen('historyDay');
    },
    [workoutHistory, setCurrentScreen, handleOpenHistoricalWorkoutSummary],
  );

  const handleCloseHistoryDayDetail = useCallback(() => {
    setHistoryDayPick(null);
    setCurrentScreen('history');
  }, [setCurrentScreen]);

  const handleReturnFromSubscreen = useCallback(() => {
    setHistoryDayPick(null);
    const returnTo = subNavigatorReturnRef.current === 'settings' ? 'settings' : 'menu';
    if (returnTo === 'settings' && shouldUseMoreHubSlideTransition(currentScreen, 'settings')) {
      runMoreSubscreenPop(() => setCurrentScreen('settings'));
      return;
    }
    startTransition(() => setCurrentScreen(returnTo));
  }, [setCurrentScreen, subNavigatorReturnRef, currentScreen, runMoreSubscreenPop]);

  useEffect(() => {
    if (!onReturnFromSubscreenRef) return undefined;
    onReturnFromSubscreenRef.current = handleReturnFromSubscreen;
    return () => {
      if (onReturnFromSubscreenRef.current === handleReturnFromSubscreen) {
        onReturnFromSubscreenRef.current = () => {};
      }
    };
  }, [onReturnFromSubscreenRef, handleReturnFromSubscreen]);

  const value = useMemo(
    () => ({
      historySelectedMonth,
      historySelectedYear,
      historyCalendarMonth,
      historyCalendarYear,
      historyChartMode,
      setHistoryChartMode,
      historyProgressSection,
      setHistoryProgressSection,
      historyDayPick,
      setHistoryDayPick,
      viewingHistoricalWorkoutId,
      isWeightLogModalVisible,
      weightLogDraftValue,
      setWeightLogDraftValue,
      weightLogDraftDate,
      editingWeightLogId,
      isWeightDatePickerVisible,
      setIsWeightDatePickerVisible,
      weightDatePickYear,
      setWeightDatePickYear,
      weightDatePickMonth,
      setWeightDatePickMonth,
      weightDatePickDay,
      setWeightDatePickDay,
      shiftHistoryMonth,
      shiftHistoryYear,
      shiftHistoryCalendarMonth,
      historyAllWeightLogsSorted,
      historyMonthLabel,
      historyYearLabel,
      historyMonthXAxisLabels,
      historyYearXAxisLabels,
      historyChartValues,
      historyChartMax,
      workoutsForHistoryDay,
      historyDayScreenTitle,
      historyWeightChartPoints,
      weightDatePickerYearOptions,
      weightDatePickerMonthOptions,
      weightDatePickerDayOptions,
      colors,
      strengthScoreSummary,
      openWeightLogModal,
      openWeightLogModalForEdit,
      closeWeightLogModal,
      getTodayDateInputValue,
      openWeightDatePicker,
      saveWeightLogEntry,
      applyWeightDatePickerSelection,
      handleDeleteWeightLogEntry,
      handleOpenHistoryFromMore,
      handleOpenHistoryDayDetail,
      handleCloseHistoryDayDetail,
      handleOpenHistoricalWorkoutSummary,
      handleCloseHistoricalWorkoutSummary,
      handleReturnFromSubscreen,
      handleOpenStrengthMovements,
    }),
    [
      historySelectedMonth,
      historySelectedYear,
      historyCalendarMonth,
      historyCalendarYear,
      historyChartMode,
      historyProgressSection,
      historyDayPick,
      viewingHistoricalWorkoutId,
      isWeightLogModalVisible,
      weightLogDraftValue,
      weightLogDraftDate,
      editingWeightLogId,
      isWeightDatePickerVisible,
      weightDatePickYear,
      weightDatePickMonth,
      weightDatePickDay,
      shiftHistoryMonth,
      shiftHistoryYear,
      shiftHistoryCalendarMonth,
      historyAllWeightLogsSorted,
      historyMonthLabel,
      historyYearLabel,
      historyMonthXAxisLabels,
      historyYearXAxisLabels,
      historyChartValues,
      historyChartMax,
      workoutsForHistoryDay,
      historyDayScreenTitle,
      historyWeightChartPoints,
      weightDatePickerYearOptions,
      weightDatePickerMonthOptions,
      weightDatePickerDayOptions,
      colors,
      strengthScoreSummary,
      openWeightLogModal,
      openWeightLogModalForEdit,
      closeWeightLogModal,
      getTodayDateInputValue,
      openWeightDatePicker,
      saveWeightLogEntry,
      applyWeightDatePickerSelection,
      handleDeleteWeightLogEntry,
      handleOpenHistoryFromMore,
      handleOpenHistoryDayDetail,
      handleCloseHistoryDayDetail,
      handleOpenHistoricalWorkoutSummary,
      handleCloseHistoricalWorkoutSummary,
      handleReturnFromSubscreen,
      handleOpenStrengthMovements,
    ],
  );

  return <HistoryProgressContext.Provider value={value}>{children}</HistoryProgressContext.Provider>;
}
