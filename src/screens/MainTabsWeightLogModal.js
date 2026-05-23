import React, { memo } from 'react';
import { Keyboard, Modal, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from '../styles';

function MainTabsWeightLogModal({
  colors,
  isWeightLogModalVisible,
  closeWeightLogModal,
  isEditingWeightLog,
  setIsWeightDatePickerVisible,
  weightLogDraftValue,
  setWeightLogDraftValue,
  weightLogDraftDate,
  getTodayDateInputValue,
  openWeightDatePicker,
  saveWeightLogEntry,
  isWeightDatePickerVisible,
  weightDatePickMonth,
  setWeightDatePickMonth,
  weightDatePickDay,
  setWeightDatePickDay,
  weightDatePickYear,
  setWeightDatePickYear,
  weightDatePickerMonthOptions,
  weightDatePickerDayOptions,
  weightDatePickerYearOptions,
  applyWeightDatePickerSelection,
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={isWeightLogModalVisible}
      onRequestClose={closeWeightLogModal}>
      <View style={styles.workoutHelpModalBackdrop}>
        <TouchableOpacity
          style={styles.muscleModalBackdropTouch}
          onPress={closeWeightLogModal}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.weightLogModalContentWrap}>
            <View style={[styles.workoutHelpModalCard, { borderColor: colors.inputBorder, backgroundColor: colors.cardBg }]}>
              <Text style={[styles.workoutHelpModalTitle, { color: colors.textPrimary }]}>
                {isEditingWeightLog ? 'Edit Weight Log' : 'Add Weight Log'}
              </Text>
              <Text style={[styles.notepadHint, { color: colors.textSecondary }]}>
                {isEditingWeightLog
                  ? 'Update the weight or date, then save. You can only pick today or an earlier date.'
                  : 'Enter your body weight and a date. Date defaults to today.'}
              </Text>
              <TextInput
                value={weightLogDraftValue}
                onChangeText={setWeightLogDraftValue}
                placeholder="Weight (lb)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={[
                  styles.profileInput,
                  { marginBottom: 10, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.textPrimary },
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.weightDatePickerTrigger,
                  { marginBottom: 10, borderColor: colors.inputBorder, backgroundColor: colors.inputBg },
                ]}
                onPress={openWeightDatePicker}
                accessibilityRole="button"
                accessibilityLabel="Change log date">
                <Text style={[styles.weightDatePickerTriggerLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[styles.weightDatePickerTriggerValue, { color: colors.textPrimary }]}>
                  {weightLogDraftDate || getTodayDateInputValue()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuPrimaryButton, styles.workoutHelpModalClose, { justifyContent: 'center', marginBottom: 8 }]}
                onPress={saveWeightLogEntry}>
                <Text style={styles.menuPrimaryButtonText}>
                  {isEditingWeightLog ? 'Save changes' : 'Save weight'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuSecondaryButton, styles.workoutHelpModalClose, { justifyContent: 'center', marginBottom: 0 }]}
                onPress={closeWeightLogModal}>
                <Text style={styles.menuSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {isWeightDatePickerVisible ? (
              <View style={styles.weightDateInlineOverlay}>
                <TouchableOpacity
                  style={styles.weightDateBottomSheetBackdropTouch}
                  onPress={() => setIsWeightDatePickerVisible(false)}
                />
                <View style={[styles.weightDateBottomSheetCard, { borderColor: colors.inputBorder, backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.weightDateBottomSheetTitle, { color: colors.textPrimary }]}>Pick Date</Text>
                  <View style={styles.weightDatePickersRow}>
                    <View style={styles.weightDatePickerColumn}>
                      <Text style={[styles.weightDatePickerColumnLabel, { color: colors.textSecondary }]}>Month</Text>
                      <Picker
                        selectedValue={weightDatePickMonth}
                        onValueChange={(value) => {
                          const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
                          if (!Number.isNaN(parsed)) setWeightDatePickMonth(parsed);
                        }}
                        style={[styles.weightDatePickerWheel, { color: colors.textPrimary }]}
                        itemStyle={[styles.weightDatePickerItem, { color: colors.textPrimary }]}>
                        {weightDatePickerMonthOptions.map((monthNumber) => (
                          <Picker.Item key={`weight-month-${monthNumber}`} label={`${monthNumber}`} value={monthNumber} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.weightDatePickerColumn}>
                      <Text style={[styles.weightDatePickerColumnLabel, { color: colors.textSecondary }]}>Day</Text>
                      <Picker
                        selectedValue={weightDatePickDay}
                        onValueChange={(value) => {
                          const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
                          if (!Number.isNaN(parsed)) setWeightDatePickDay(parsed);
                        }}
                        style={[styles.weightDatePickerWheel, { color: colors.textPrimary }]}
                        itemStyle={[styles.weightDatePickerItem, { color: colors.textPrimary }]}>
                        {weightDatePickerDayOptions.map((dayNumber) => (
                          <Picker.Item key={`weight-day-${dayNumber}`} label={`${dayNumber}`} value={dayNumber} />
                        ))}
                      </Picker>
                    </View>
                    <View style={[styles.weightDatePickerColumn, styles.weightDatePickerYearColumn]}>
                      <Text style={[styles.weightDatePickerColumnLabel, { color: colors.textSecondary }]}>Year</Text>
                      <Picker
                        selectedValue={weightDatePickYear}
                        onValueChange={(value) => {
                          const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
                          if (!Number.isNaN(parsed)) setWeightDatePickYear(parsed);
                        }}
                        style={[styles.weightDatePickerWheel, { color: colors.textPrimary }]}
                        itemStyle={[styles.weightDatePickerItem, { color: colors.textPrimary }]}>
                        {weightDatePickerYearOptions.map((yearNumber) => (
                          <Picker.Item key={`weight-year-${yearNumber}`} label={`${yearNumber}`} value={yearNumber} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.menuPrimaryButton, styles.workoutHelpModalClose, { justifyContent: 'center', marginBottom: 8 }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      applyWeightDatePickerSelection();
                    }}>
                    <Text style={styles.menuPrimaryButtonText}>Use this date</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuSecondaryButton, styles.workoutHelpModalClose, { justifyContent: 'center', marginBottom: 0 }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setIsWeightDatePickerVisible(false);
                    }}>
                    <Text style={styles.menuSecondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

export default memo(MainTabsWeightLogModal);
