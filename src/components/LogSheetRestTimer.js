import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameTheme, useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const REST_MINUTE_OPTIONS = Array.from({ length: 11 }, (_, i) => i);
const REST_SECOND_OPTIONS = [0, 15, 30, 45];
const DEFAULT_REST_SECONDS = 90;

function formatRestClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function restSecondsFromPickers(minutes, seconds) {
  return Math.max(15, minutes * 60 + seconds);
}

function pickersFromRestSeconds(totalSeconds) {
  const safe = Math.max(15, Math.floor(totalSeconds));
  let minutes = Math.min(10, Math.floor(safe / 60));
  let seconds = safe % 60;
  const nearestSec = REST_SECOND_OPTIONS.reduce((best, opt) =>
    Math.abs(opt - seconds) < Math.abs(best - seconds) ? opt : best,
  );
  seconds = nearestSec;
  if (minutes === 0 && seconds === 0) seconds = 15;
  return { minutes, seconds };
}

function LogSheetRestTimer({
  restDurationSec,
  restEndsAtMs,
  onRestDurationChange,
  onRestTimerEnd,
  bottomInset = 0,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const wt = useWorkoutTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickMinutes, setPickMinutes] = useState(1);
  const [pickSeconds, setPickSeconds] = useState(30);
  const [displaySeconds, setDisplaySeconds] = useState(restDurationSec);
  const onRestTimerEndRef = useRef(onRestTimerEnd);

  useEffect(() => {
    onRestTimerEndRef.current = onRestTimerEnd;
  }, [onRestTimerEnd]);

  const isRunning = restEndsAtMs != null && restEndsAtMs > Date.now();

  useEffect(() => {
    if (!isRunning) {
      setDisplaySeconds(restDurationSec);
      return undefined;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((restEndsAtMs - Date.now()) / 1000));
      setDisplaySeconds(remaining);
      if (remaining <= 0) {
        onRestTimerEndRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isRunning, restEndsAtMs, restDurationSec]);

  const openPicker = useCallback(() => {
    const { minutes, seconds } = pickersFromRestSeconds(restDurationSec);
    setPickMinutes(minutes);
    setPickSeconds(seconds);
    setPickerVisible(true);
  }, [restDurationSec]);

  const closePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const applyPicker = useCallback(() => {
    const next = restSecondsFromPickers(pickMinutes, pickSeconds);
    onRestDurationChange(next);
    setPickerVisible(false);
  }, [pickMinutes, pickSeconds, onRestDurationChange]);

  const buttonLabel = useMemo(() => {
    if (isRunning) return formatRestClock(displaySeconds);
    return formatRestClock(restDurationSec);
  }, [displaySeconds, isRunning, restDurationSec]);

  return (
    <>
      <TouchableOpacity
        style={[styles.logSheetToolbarButton, styles.logSheetToolbarButtonRest]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={isRunning ? `Rest timer ${buttonLabel} remaining` : `Rest timer ${buttonLabel}`}>
        <Text style={[styles.logSheetToolbarButtonLabel, { color: wt.textMuted }]}>Rest</Text>
        <Text
          style={[
            styles.logSheetToolbarButtonValue,
            {
              color: wt.textPrimary,
              opacity: isRunning ? 1 : 0.62,
            },
          ]}>
          {buttonLabel}
        </Text>
      </TouchableOpacity>

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={closePicker}>
        <TouchableOpacity
          style={styles.logSheetRestPickerBackdrop}
          activeOpacity={1}
          onPress={closePicker}
        />
        <View
          style={[
            styles.logSheetRestPickerSheet,
            { paddingBottom: bottomInset + 12, backgroundColor: wt.splitModalCardBg },
          ]}>
          <Text style={[styles.logSheetRestPickerTitle, { color: wt.textPrimary }]}>Rest timer</Text>
          <View style={styles.logSheetRestPickerWheels}>
            <View style={styles.logSheetRestPickerColumn}>
              <Text style={[styles.logSheetRestPickerCaption, { color: wt.textMuted }]}>Min</Text>
              <Picker
                selectedValue={pickMinutes}
                onValueChange={(v) => setPickMinutes(Number(v))}
                style={[
                  styles.logSheetRestPickerWheel,
                  Platform.OS === 'ios' ? styles.logSheetRestPickerWheelIOS : null,
                ]}
                itemStyle={styles.logSheetRestPickerItem}>
                {REST_MINUTE_OPTIONS.map((min) => (
                  <Picker.Item key={`min-${min}`} label={`${min}`} value={min} />
                ))}
              </Picker>
            </View>
            <View style={styles.logSheetRestPickerColumn}>
              <Text style={[styles.logSheetRestPickerCaption, { color: wt.textMuted }]}>Sec</Text>
              <Picker
                selectedValue={pickSeconds}
                onValueChange={(v) => setPickSeconds(Number(v))}
                style={[
                  styles.logSheetRestPickerWheel,
                  Platform.OS === 'ios' ? styles.logSheetRestPickerWheelIOS : null,
                ]}
                itemStyle={styles.logSheetRestPickerItem}>
                {REST_SECOND_OPTIONS.map((sec) => (
                  <Picker.Item key={`sec-${sec}`} label={`${sec}`} value={sec} />
                ))}
              </Picker>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.menuPrimaryButton, { backgroundColor: theme.navAccent }]}
            onPress={applyPicker}
            accessibilityRole="button"
            accessibilityLabel="Set rest timer">
            <Text style={[styles.menuPrimaryButtonText, { color: '#FFFFFF' }]}>Set rest</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

export { DEFAULT_REST_SECONDS };
export default memo(LogSheetRestTimer);
