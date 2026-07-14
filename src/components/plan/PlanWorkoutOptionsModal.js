import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import { SPLIT_DAY_TYPES, SPLIT_DAY_TYPE_LABELS } from '../../data/weeklySplitPlanner';
import { getSplitDayAccentColor } from '../../utils/splitDayColors';

const TYPE_OPTIONS = SPLIT_DAY_TYPES;

/**
 * Plan workout "..." menu: rename and/or change the day's workout type (level icon color).
 */
function PlanWorkoutOptionsModal({
  visible,
  onClose,
  workoutName,
  canRename,
  dayType,
  onRename,
  onChangeType,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const [panel, setPanel] = useState('menu'); // menu | rename | type
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (!visible) {
      setPanel('menu');
      setNameDraft('');
      return;
    }
    setPanel('menu');
    setNameDraft(String(workoutName || '').trim());
  }, [visible, workoutName]);

  const typeOptions = useMemo(() => TYPE_OPTIONS, []);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleApplyRename = useCallback(() => {
    const trimmed = String(nameDraft || '').trim();
    if (!trimmed) return;
    onRename?.(trimmed);
    handleClose();
  }, [handleClose, nameDraft, onRename]);

  const handlePickType = useCallback(
    (type) => {
      onChangeType?.(type);
      handleClose();
    },
    [handleClose, onChangeType],
  );

  const secondaryButtonStyle = [
    styles.planOptionsSecondaryButton,
    {
      backgroundColor: theme.surfaceRaised,
      borderColor: theme.borderSubtle,
    },
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <View style={styles.muscleModalBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.planOptionsModalCard,
            { backgroundColor: theme.cardBg, borderColor: theme.borderSubtle },
          ]}>
          {panel === 'menu' ? (
            <>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>
                Workout options
              </Text>
              {canRename ? (
                <TouchableOpacity
                  style={styles.planPickerOption}
                  onPress={() => setPanel('rename')}
                  accessibilityRole="button"
                  accessibilityLabel="Rename workout">
                  <Text style={styles.planPickerOptionTitle}>Rename workout</Text>
                  <Text style={styles.planPickerOptionMeta}>
                    {workoutName ? `Currently "${workoutName}"` : 'Choose a custom name'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.planPickerOption}
                onPress={() => setPanel('type')}
                accessibilityRole="button"
                accessibilityLabel="Change workout type">
                <Text style={styles.planPickerOptionTitle}>Change workout type</Text>
                <Text style={styles.planPickerOptionMeta}>
                  Sets the day color / level icon
                  {dayType ? ` · ${SPLIT_DAY_TYPE_LABELS[dayType] ?? dayType}` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={secondaryButtonStyle}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <Text style={styles.planOptionsSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {panel === 'rename' ? (
            <>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
                Rename workout
              </Text>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Workout name"
                placeholderTextColor={theme.textMuted}
                style={styles.planBuilderNameInput}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleApplyRename}
                accessibilityLabel="Workout name"
              />
              <View style={styles.planOptionsRowActions}>
                <TouchableOpacity
                  style={[secondaryButtonStyle, { flex: 1, marginTop: 0 }]}
                  onPress={() => setPanel('menu')}
                  accessibilityRole="button"
                  accessibilityLabel="Back">
                  <Text style={styles.planOptionsSecondaryButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.planOptionsPrimaryButton,
                    { backgroundColor: theme.navAccent },
                    !String(nameDraft || '').trim() && styles.planBuilderSaveButtonDisabled,
                  ]}
                  onPress={handleApplyRename}
                  disabled={!String(nameDraft || '').trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Save name">
                  <Text style={styles.planOptionsPrimaryButtonText}>Save name</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {panel === 'type' ? (
            <>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
                Workout type
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10 }}>
                This sets the colored day icon on Home and Plan.
              </Text>
              <ScrollView style={styles.planPickerScroll} keyboardShouldPersistTaps="handled">
                {typeOptions.map((type) => {
                  const selected = dayType === type;
                  const accent = getSplitDayAccentColor(type, theme);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.planPickerOption,
                        selected && styles.planPickerOptionSelected,
                        { flexDirection: 'row', alignItems: 'center', gap: 12 },
                      ]}
                      onPress={() => handlePickType(type)}
                      accessibilityRole="button"
                      accessibilityLabel={SPLIT_DAY_TYPE_LABELS[type] ?? type}
                      accessibilityState={{ selected }}>
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: accent,
                        }}
                      />
                      <Text
                        style={[
                          styles.planPickerOptionTitle,
                          { marginBottom: 0, flex: 1 },
                          selected && styles.planPickerOptionTitleSelected,
                        ]}>
                        {SPLIT_DAY_TYPE_LABELS[type] ?? type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={secondaryButtonStyle}
                onPress={() => setPanel('menu')}
                accessibilityRole="button"
                accessibilityLabel="Back">
                <Text style={styles.planOptionsSecondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export default memo(PlanWorkoutOptionsModal);
