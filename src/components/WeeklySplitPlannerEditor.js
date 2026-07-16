import React, { memo, useCallback, useMemo, useState } from 'react';
import { useStyles, useWorkoutTheme } from '../app/context/ThemeStylesContext';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BackMuscleDiagramSvg from '../../components/BackMuscleDiagramSvg';
import FrontMuscleDiagramSvg from '../../components/FrontMuscleDiagramSvg';
import {
  MIXED_DAY_MUSCLE_OPTIONS,
  SPLIT_DAY_TYPES,
  SPLIT_DAY_TYPE_LABELS,
  SPLIT_TYPE_PREVIEW_MUSCLES,
} from '../data/weeklySplitPlanner';
import { muscleActivationFromDisplayLabels } from '../utils/muscleActivationFromLabels';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MINI_H = 44;

function SplitDayDiagram({ dayEntry }) {
  const styles = useStyles();
  const muscles = useMemo(() => {
    if (dayEntry.type === 'mixed') {
      return dayEntry.mixedMuscles ?? [];
    }
    return SPLIT_TYPE_PREVIEW_MUSCLES[dayEntry.type] ?? [];
  }, [dayEntry.type, dayEntry.mixedMuscles]);

  const activation = useMemo(() => muscleActivationFromDisplayLabels(muscles), [muscles]);

  if (dayEntry.type === 'rest' || (dayEntry.type === 'mixed' && muscles.length === 0)) {
    return (
      <View style={styles.splitPlannerMiniRest}>
        <Text style={styles.splitPlannerMiniRestText}>—</Text>
      </View>
    );
  }

  return (
    <View style={styles.splitPlannerMiniRow}>
      <View style={styles.splitPlannerMiniHalf}>
        <FrontMuscleDiagramSvg activationBySlug={activation} height={MINI_H} />
      </View>
      <View style={styles.splitPlannerMiniHalf}>
        <BackMuscleDiagramSvg activationBySlug={activation} height={MINI_H} />
      </View>
    </View>
  );
}

function WeeklySplitPlannerEditor({ weeklySplitPlan, onChangeWeeklySplitPlan, theme, hint, showHint = true }) {
  const styles = useStyles();
  const defaultTheme = useWorkoutTheme();
  const wt = theme ?? defaultTheme;
  const [modalDayIndex, setModalDayIndex] = useState(null);
  const [modalDraft, setModalDraft] = useState({ type: 'rest', mixedMuscles: [] });

  const openDayModal = useCallback(
    (dayIndex) => {
      const d = weeklySplitPlan.days[dayIndex];
      setModalDraft({
        type: d.type,
        mixedMuscles: d.type === 'mixed' ? [...(d.mixedMuscles ?? [])] : [],
      });
      setModalDayIndex(dayIndex);
    },
    [weeklySplitPlan.days],
  );

  const closeModal = useCallback(() => setModalDayIndex(null), []);

  const applyModal = useCallback(() => {
    if (modalDayIndex === null) return;
    const nextDays = weeklySplitPlan.days.map((d, i) => {
      if (i !== modalDayIndex) return d;
      if (modalDraft.type === 'mixed') {
        return { type: 'mixed', mixedMuscles: [...modalDraft.mixedMuscles] };
      }
      return { type: modalDraft.type, mixedMuscles: [] };
    });
    onChangeWeeklySplitPlan({ days: nextDays });
    closeModal();
  }, [modalDayIndex, modalDraft, weeklySplitPlan.days, onChangeWeeklySplitPlan, closeModal]);

  const selectType = useCallback((t) => {
    setModalDraft((prev) => ({
      type: t,
      mixedMuscles: t === 'mixed' ? prev.mixedMuscles : [],
    }));
  }, []);

  const toggleMuscle = useCallback((muscleName) => {
    setModalDraft((prev) => {
      if (prev.type !== 'mixed') return prev;
      const set = new Set(prev.mixedMuscles);
      if (set.has(muscleName)) set.delete(muscleName);
      else set.add(muscleName);
      return { ...prev, mixedMuscles: [...set] };
    });
  }, []);

  return (
    <>
      {showHint && hint ? (
        <Text style={[styles.setText, { color: wt.textSecondary, marginBottom: 16 }]}>{hint}</Text>
      ) : null}

      {WEEKDAY_LABELS.map((label, dayIndex) => {
        const dayEntry = weeklySplitPlan.days[dayIndex];
        const typeLabel = SPLIT_DAY_TYPE_LABELS[dayEntry.type] ?? dayEntry.type;
        const mixedHint =
          dayEntry.type === 'mixed' && dayEntry.mixedMuscles?.length
            ? `${dayEntry.mixedMuscles.length} muscles`
            : null;
        return (
          <TouchableOpacity
            key={label}
            style={[styles.splitPlannerDayCard, { backgroundColor: wt.cardBg, borderColor: wt.cardBorder }]}
            onPress={() => openDayModal(dayIndex)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${typeLabel}`}>
            <View style={styles.splitPlannerDayLeft}>
              <Text style={[styles.splitPlannerDayName, { color: wt.textPrimary }]}>{label}</Text>
              <Text style={[styles.splitPlannerDayType, { color: wt.textSecondary }]}>
                {typeLabel}
                {mixedHint ? ` · ${mixedHint}` : ''}
              </Text>
            </View>
            <View style={styles.splitPlannerDayRight}>
              <SplitDayDiagram dayEntry={dayEntry} />
            </View>
          </TouchableOpacity>
        );
      })}

      <Modal transparent animationType="fade" visible={modalDayIndex !== null} onRequestClose={closeModal}>
        <View style={styles.muscleModalBackdrop}>
          <TouchableOpacity style={styles.muscleModalBackdropTouch} onPress={closeModal} accessibilityLabel="Dismiss" />
          <View
            style={[
              styles.splitPlannerModalCard,
              { backgroundColor: wt.splitModalCardBg, borderColor: wt.inputBorder },
            ]}>
            <Text style={[styles.movementTitle, { color: wt.textPrimary }]}>
              {modalDayIndex !== null ? `${WEEKDAY_LABELS[modalDayIndex]}` : 'Day'}
            </Text>
            <Text style={[styles.profileHint, { color: wt.textMuted, marginBottom: 10 }]}>Day type</Text>
            <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
              {SPLIT_DAY_TYPES.map((t) => {
                const selected = modalDraft.type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.splitPlannerTypeRow,
                      {
                        backgroundColor: selected ? wt.selectedExerciseBg : wt.splitModalInnerBg,
                        borderColor: selected ? wt.selectedExerciseBorder : wt.inputBorder,
                      },
                    ]}
                    onPress={() => selectType(t)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}>
                    <Text
                      style={[
                        styles.splitPlannerTypeRowLabel,
                        { color: wt.textPrimary },
                      ]}>
                      {SPLIT_DAY_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {modalDraft.type === 'mixed' ? (
              <>
                <Text style={[styles.menuMoreSectionTitle, { color: wt.textPrimary, marginTop: 14, marginBottom: 8 }]}>
                  Target muscles
                </Text>
                <Text style={[styles.profileHint, { color: wt.textMuted, marginBottom: 8 }]}>
                  Tap to select or clear. Apply saves this day.
                </Text>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  <View style={styles.splitPlannerMuscleWrap}>
                    {MIXED_DAY_MUSCLE_OPTIONS.map((muscleName) => {
                      const on = modalDraft.mixedMuscles.includes(muscleName);
                      return (
                        <TouchableOpacity
                          key={muscleName}
                          style={[
                            styles.splitPlannerMuscleChip,
                            {
                              backgroundColor: on ? wt.navAccent : wt.splitModalInnerBg,
                              borderColor: on ? wt.navAccent : wt.inputBorder,
                            },
                          ]}
                          onPress={() => toggleMuscle(muscleName)}>
                          <Text
                            style={[
                              styles.splitPlannerMuscleChipText,
                              { color: on ? '#FFFFFF' : wt.textSecondary },
                            ]}>
                            {muscleName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            ) : null}

            <View style={styles.splitPlannerModalActions}>
              <TouchableOpacity
                style={[styles.splitPlannerModalButton, { backgroundColor: wt.splitModalInnerBg, borderColor: wt.inputBorder }]}
                onPress={closeModal}>
                <Text style={[styles.splitPlannerModalButtonText, { color: wt.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.splitPlannerModalButton, { backgroundColor: wt.navAccent, borderColor: wt.navAccent }]}
                onPress={applyModal}>
                <Text style={[styles.splitPlannerModalButtonText, { color: '#FFFFFF' }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default memo(WeeklySplitPlannerEditor);
