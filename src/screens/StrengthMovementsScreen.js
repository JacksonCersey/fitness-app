import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useGameTheme, useStyles } from '../app/context/ThemeStylesContext';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MovementRecentScrollCard from '../components/MovementRecentScrollCard';
import MenuStarfieldBackground from '../components/MenuStarfieldBackground';
import MovementCatalogCard from '../components/MovementCatalogCard';
import MovementsAccordionSection, {
  configureMovementsAccordionAnimation,
} from '../components/MovementsAccordionSection';
import {
  buildMovementAccordionSections,
  buildMovementCatalog,
  movementNotLoggedNestedSectionId,
  MOVEMENT_REGION_SECTION_IDS,
} from '../utils/movementCatalog';
import { getMostRecentCompletedMovements } from '../utils/movementSetHistory';

function StrengthMovementsScreen({
  screenTransitionOpacity,
  onBack,
  workoutHistory,
  exerciseLookup,
  favoriteMovements,
  onToggleFavoriteMovement,
  selectionMode = null,
  onSelectMovement = null,
}) {
  const styles = useStyles();
  const theme = useGameTheme();
  const [movementSearchQuery, setMovementSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedNestedSections, setExpandedNestedSections] = useState({});

  const catalogRows = useMemo(() => buildMovementCatalog(workoutHistory), [workoutHistory]);

  const recentCompletedMovements = useMemo(() => {
    const recent = getMostRecentCompletedMovements(workoutHistory, 15);
    const catalogByKey = new Map(
      catalogRows.map((row) => [row.movement.trim().toLowerCase(), row]),
    );
    return recent
      .map((item) => {
        const row = catalogByKey.get(item.movement.trim().toLowerCase());
        if (!row || !row.isLogged) return null;
        return { row, lastCompletedAtISO: item.lastCompletedAtISO };
      })
      .filter(Boolean);
  }, [workoutHistory, catalogRows]);

  const accordionSections = useMemo(
    () => buildMovementAccordionSections(catalogRows, favoriteMovements, movementSearchQuery),
    [catalogRows, favoriteMovements, movementSearchQuery],
  );

  const totalVisible = useMemo(
    () => accordionSections.reduce((sum, section) => sum + section.rows.length, 0),
    [accordionSections],
  );

  useEffect(() => {
    const q = movementSearchQuery.trim();
    if (!q) return;
    setExpandedSections((prev) => {
      const next = { ...prev };
      accordionSections.forEach((section) => {
        if (section.rows.length > 0) next[section.id] = true;
        if (MOVEMENT_REGION_SECTION_IDS.has(section.id)) {
          const hasNotLogged = section.rows.some((row) => !row.isLogged);
          if (hasNotLogged) next[movementNotLoggedNestedSectionId(section.id)] = true;
        }
      });
      return next;
    });
  }, [movementSearchQuery, accordionSections]);

  const handleToggleSection = useCallback((sectionId) => {
    configureMovementsAccordionAnimation();
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleToggleNestedSection = useCallback((sectionId) => {
    configureMovementsAccordionAnimation();
    setExpandedNestedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleToggleFavorite = useCallback(
    (movementName) => {
      onToggleFavoriteMovement(movementName);
    },
    [onToggleFavoriteMovement],
  );

  return (
    <SafeAreaView style={[styles.menuScreen, styles.strengthMovementsScreenShell]}>
      <MenuStarfieldBackground />
      <Animated.View style={[styles.screenFadeContainer, { opacity: screenTransitionOpacity }]}>
        <ScrollView
          style={styles.profileScrollOuter}
          contentContainerStyle={styles.profileScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeaderRow}>
            <TouchableOpacity
              style={styles.profileCloseInlineButton}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text style={[styles.workoutCloseButtonText, { color: theme.navBack }]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.menuSubscreenNavTitle}>Movements</Text>
          </View>

          <Text style={[styles.menuMoreBodyText, { marginBottom: 12 }]}>
            {selectionMode === 'workoutPlan'
              ? 'Tap any movement to add it to the workout you are building.'
              : 'Tap a muscle group to expand it. Logged movements show your max and recent sets; open Not logged yet inside each group for the rest. Star any movement to add it to Favorites.'}
          </Text>

          {selectionMode == null && recentCompletedMovements.length > 0 ? (
            <View style={styles.movementsRecentStripBlock}>
              <Text style={styles.movementsRecentStripHeading}>Recently completed</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.movementsRecentScrollContent}
                keyboardShouldPersistTaps="handled">
                {recentCompletedMovements.map((item) => (
                  <MovementRecentScrollCard
                    key={`recent-${item.row.movement}`}
                    row={item.row}
                    lastCompletedAtISO={item.lastCompletedAtISO}
                    exerciseLookup={exerciseLookup}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.strengthMovementSearchRow}>
            <TextInput
              value={movementSearchQuery}
              onChangeText={setMovementSearchQuery}
              placeholder="Search movements…"
              placeholderTextColor="rgba(238, 241, 255, 0.45)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={styles.strengthMovementSearchField}
              accessibilityLabel="Search movements"
            />
            {movementSearchQuery.length > 0 ? (
              <TouchableOpacity
                style={styles.strengthMovementSearchClear}
                onPress={() => setMovementSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <Text style={styles.strengthMovementSearchClearText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {movementSearchQuery.trim() ? (
            <Text style={styles.movementsResultCount}>
              {totalVisible} match{totalVisible === 1 ? '' : 'es'} — matching sections open automatically
            </Text>
          ) : null}

          <View style={styles.movementsAccordionList}>
            {accordionSections.map((section) => {
              const expanded = Boolean(expandedSections[section.id]);

              return (
                <MovementsAccordionSection
                  key={section.id}
                  sectionId={section.id}
                  label={section.label}
                  count={section.rows.length}
                  expanded={expanded}
                  onToggle={handleToggleSection}>
                  {section.rows.length === 0 ? (
                    <Text style={styles.movementsAccordionEmpty}>
                      {section.id === 'favorites'
                        ? 'Star movements from any section to list them here.'
                        : 'No movements in this group.'}
                    </Text>
                  ) : MOVEMENT_REGION_SECTION_IDS.has(section.id) ? (
                    (() => {
                      const loggedRows = section.rows.filter((row) => row.isLogged);
                      const notLoggedRows = section.rows.filter((row) => !row.isLogged);
                      const nestedId = movementNotLoggedNestedSectionId(section.id);
                      const nestedExpanded = Boolean(expandedNestedSections[nestedId]);

                      return (
                        <>
                          {loggedRows.length === 0 ? (
                            <Text style={styles.movementsAccordionEmpty}>No logged movements in this group yet.</Text>
                          ) : (
                            loggedRows.map((row) => (
                              <MovementCatalogCard
                                key={`${section.id}-logged-${row.movement}`}
                                row={row}
                                exerciseLookup={exerciseLookup}
                                favoriteMovements={favoriteMovements}
                                onToggleFavorite={handleToggleFavorite}
                                onSelectMovement={onSelectMovement}
                              />
                            ))
                          )}
                          {notLoggedRows.length > 0 ? (
                            <MovementsAccordionSection
                              sectionId={nestedId}
                              label="Not logged yet"
                              count={notLoggedRows.length}
                              expanded={nestedExpanded}
                              onToggle={handleToggleNestedSection}
                              nested>
                              {notLoggedRows.map((row) => (
                                <MovementCatalogCard
                                  key={`${section.id}-unlogged-${row.movement}`}
                                  row={row}
                                  exerciseLookup={exerciseLookup}
                                  favoriteMovements={favoriteMovements}
                                  onToggleFavorite={handleToggleFavorite}
                                  onSelectMovement={onSelectMovement}
                                />
                              ))}
                            </MovementsAccordionSection>
                          ) : null}
                        </>
                      );
                    })()
                  ) : (
                    section.rows.map((row) => (
                      <MovementCatalogCard
                        key={`${section.id}-${row.movement}`}
                        row={row}
                        exerciseLookup={exerciseLookup}
                        favoriteMovements={favoriteMovements}
                        onToggleFavorite={handleToggleFavorite}
                        onSelectMovement={onSelectMovement}
                      />
                    ))
                  )}
                </MovementsAccordionSection>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export default memo(StrengthMovementsScreen);
