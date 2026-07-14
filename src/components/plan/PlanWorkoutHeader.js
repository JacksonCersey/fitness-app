import React, { memo } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useGameTheme, useStyles } from '../../app/context/ThemeStylesContext';
import PlanMarqueeTitle from './PlanMarqueeTitle';

const EDIT_ICON = require('../../../assets/images/icons/editicon.png');
const SAVE_ICON = require('../../../assets/images/icons/saveicon.png');
const LIBRARY_ICON = require('../../../assets/images/icons/library-icon.png');

function MoreDotsIcon({ color }) {
  const styles = useStyles();
  return (
    <View style={styles.planWorkoutMoreDots} accessibilityElementsHidden>
      <View style={[styles.planWorkoutMoreDot, { backgroundColor: color }]} />
      <View style={[styles.planWorkoutMoreDot, { backgroundColor: color }]} />
      <View style={[styles.planWorkoutMoreDot, { backgroundColor: color }]} />
    </View>
  );
}

function PlanWorkoutHeader({
  title,
  statusLabel,
  exerciseLabel,
  onPressMore,
  onPressEdit,
  onPressSaved,
  onPressCreate,
  onPressCancel,
  onPressSave,
  canSave = true,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const isBuilder = Boolean(onPressCancel || onPressSave);
  const showSummaryActions = !isBuilder && Boolean(onPressSaved || onPressCreate || onPressEdit);
  const showBuilderActions = isBuilder;

  return (
    <View style={styles.planWorkoutHeader}>
      <View style={styles.planWorkoutHeaderText}>
        <View style={styles.planWorkoutTitleRow}>
          <PlanMarqueeTitle text={title || 'Workout'} style={styles.planWorkoutTitle} />
          {onPressMore ? (
            <TouchableOpacity
              style={styles.planWorkoutMoreButton}
              onPress={onPressMore}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Workout options">
              <MoreDotsIcon color={theme.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.planWorkoutMoreButtonPlaceholder} />
          )}
        </View>
        {statusLabel ? (
          <Text style={styles.planWorkoutSubtitle} numberOfLines={1}>
            {statusLabel}
          </Text>
        ) : null}
        {exerciseLabel ? (
          <Text style={styles.planWorkoutExerciseCount} numberOfLines={1}>
            {exerciseLabel}
          </Text>
        ) : null}
      </View>

      {showSummaryActions ? (
        <View style={styles.planWorkoutHeaderActions}>
          {onPressSaved ? (
            <TouchableOpacity
              style={styles.planWorkoutPillButton}
              onPress={onPressSaved}
              accessibilityRole="button"
              accessibilityLabel="Workout library">
              <Image
                source={LIBRARY_ICON}
                style={styles.planWorkoutPillIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.planWorkoutPillLabel}>Library</Text>
            </TouchableOpacity>
          ) : null}
          {onPressCreate ? (
            <TouchableOpacity
              style={styles.planWorkoutPillButton}
              onPress={onPressCreate}
              accessibilityRole="button"
              accessibilityLabel="Create new workout">
              <Text style={styles.planWorkoutPillPlus}>+</Text>
              <Text style={styles.planWorkoutPillLabel}>Create</Text>
            </TouchableOpacity>
          ) : null}
          {onPressEdit ? (
            <TouchableOpacity
              style={styles.planWorkoutPillButton}
              onPress={onPressEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit workout">
              <Image
                source={EDIT_ICON}
                style={styles.planWorkoutPillIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {showBuilderActions ? (
        <View style={styles.planWorkoutHeaderActions}>
          {onPressSave ? (
            <TouchableOpacity
              style={[styles.planWorkoutPillButton, !canSave && styles.planBuilderSaveButtonDisabled]}
              onPress={onPressSave}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel="Save workout to this day"
              accessibilityState={{ disabled: !canSave }}>
              <Image
                source={SAVE_ICON}
                style={styles.planWorkoutPillIcon}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Text style={styles.planWorkoutPillLabel}>Save</Text>
            </TouchableOpacity>
          ) : null}
          {onPressCancel ? (
            <TouchableOpacity
              style={styles.planWorkoutPillButton}
              onPress={onPressCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing workout">
              <Text style={styles.planWorkoutPillCancelMark}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default memo(PlanWorkoutHeader);
