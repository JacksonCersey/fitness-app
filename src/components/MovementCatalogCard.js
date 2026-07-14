import React, { memo, useMemo } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { isFavoriteMovement } from '../utils/movementFavorites';
import { formatRecentSetLine, getMovementMaxDisplay } from '../utils/movementSetHistory';
import { getHighlightChipForMovement } from '../utils/splitDayHighlightIcons';

/**
 * @param {{
 *   row: import('../utils/movementCatalog').MovementCatalogRow,
 *   exerciseLookup: Record<string, { bodyweightOnly?: boolean; primaryMuscles?: string[] }>,
 *   favoriteMovements: Set<string>,
 *   onToggleFavorite: (name: string) => void,
 *   onSelectMovement?: ((name: string) => void) | null,
 * }} props
 */
function MovementCatalogCard({ row, exerciseLookup, favoriteMovements, onToggleFavorite, onSelectMovement = null }) {
  const styles = useStyles();
  const favorited = isFavoriteMovement(favoriteMovements, row.movement);
  const maxDisplay = row.summary ? getMovementMaxDisplay(row.summary, exerciseLookup) : null;
  const muscleChip = useMemo(
    () => getHighlightChipForMovement(row.movement, exerciseLookup, row.primaryMuscle),
    [row.movement, row.primaryMuscle, exerciseLookup],
  );
  const canSelect = typeof onSelectMovement === 'function';

  return (
    <TouchableOpacity
      style={[
        styles.profileCard,
        styles.strengthMovementCard,
        !row.isLogged && styles.strengthMovementCardUnlogged,
      ]}
      activeOpacity={canSelect ? 0.88 : 1}
      disabled={!canSelect}
      onPress={canSelect ? () => onSelectMovement(row.movement) : undefined}
      accessibilityRole={canSelect ? 'button' : undefined}
      accessibilityLabel={canSelect ? `Choose ${row.movement}` : undefined}>
      <View style={styles.strengthMovementCardTopRow}>
        {muscleChip ? (
          <View style={styles.strengthMovementMuscleChipRow}>
            <View style={styles.strengthMovementMuscleIconWell}>
              <Image source={muscleChip.source} style={styles.strengthMovementMuscleIcon} resizeMode="contain" />
            </View>
            <View style={styles.strengthMovementMuscleTextCol}>
              <Text
                style={[
                  styles.strengthMovementMuscleChipLabel,
                  !row.isLogged && styles.strengthMovementTextUnlogged,
                ]}>
                {muscleChip.groupLabel}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.strengthMovementMuscleChipRow, styles.strengthMovementMuscleChipPlaceholder]}>
            <Text style={[styles.strengthMovementMuscleChipLabel, styles.strengthMovementTextUnlogged]}>
              {row.primaryMuscle}
            </Text>
          </View>
        )}

        <View style={styles.strengthMovementTitleCol}>
          <Text
            style={[styles.strengthMovementCardTitle, !row.isLogged && styles.strengthMovementTextUnlogged]}
            numberOfLines={2}>
            {row.movement}
          </Text>
          {canSelect ? (
            <View style={styles.strengthMovementSelectPill}>
              <Text style={styles.strengthMovementSelectPillText}>Add</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.strengthMovementFavoriteButton}
              onPress={() => onToggleFavorite(row.movement)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={favorited ? `Remove ${row.movement} from favorites` : `Favorite ${row.movement}`}>
              <Text style={[styles.strengthMovementFavoriteIcon, favorited && styles.strengthMovementFavoriteIconOn]}>
                {favorited ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {row.isLogged && row.summary && maxDisplay ? (
        <>
          <View style={styles.strengthMovementMaxBox}>
            <Text style={styles.strengthMovementMaxCaption}>{maxDisplay.label}</Text>
            <View style={styles.strengthMovementMaxValueRow}>
              <Text style={styles.strengthMovementMaxValue}>{maxDisplay.primary}</Text>
              <Text style={styles.strengthMovementMaxUnit}>{maxDisplay.suffix}</Text>
            </View>
          </View>

          <Text style={[styles.menuMoreSectionHeading, styles.strengthMovementRecentHeading]}>Recent sets</Text>
          {row.summary.recentSets.length === 0 ? (
            <Text style={styles.menuMoreLinkSubtitle}>No sets recorded.</Text>
          ) : (
            row.summary.recentSets.map((setRecord, idx) => (
              <Text key={`${row.movement}-${setRecord.sortKey}-${idx}`} style={styles.strengthMovementSetLine}>
                {formatRecentSetLine(setRecord, row.movement, exerciseLookup)}
              </Text>
            ))
          )}
        </>
      ) : (
        <Text style={[styles.menuMoreLinkSubtitle, styles.strengthMovementNotLoggedHint, styles.strengthMovementTextUnlogged]}>
          Finish a workout with this movement to see your max and recent sets here.
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default memo(MovementCatalogCard);
