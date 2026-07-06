import React, { memo } from 'react';
import { useStyles } from '../app/context/ThemeStylesContext';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const MORE_LINK_ICONS = {
  profile: require('../../assets/images/more/profileicon.png'),
  goals: require('../../assets/images/more/goalsicon.png'),
  database: require('../../assets/images/more/databaseicon.png'),
  targets: require('../../assets/images/more/targetsicon.png'),
  streak: require('../../assets/images/more/streakmoreicon.png'),
  history: require('../../assets/images/more/historyicon.png'),
};

/** @typedef {'only' | 'first' | 'middle' | 'last'} MoreRowPosition */

function MoreLinkRow({ icon, title, subtitle, onPress, muted, accessibilityLabel, position = 'only' }) {
  const styles = useStyles();
  const rowStyle = [
    styles.menuMoreLinkRow,
    (position === 'middle' || position === 'last') && styles.menuMoreLinkRowSeparator,
    muted && styles.menuMoreLinkRowMuted,
  ];

  return (
    <TouchableOpacity
      style={rowStyle}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      {icon ? (
        <View style={styles.menuMoreLinkIconWell}>
          <Image source={icon} style={styles.menuMoreLinkIcon} resizeMode="contain" />
        </View>
      ) : null}
      <View style={styles.menuMoreLinkTextBlock}>
        <Text style={styles.menuMoreLinkTitle}>{title}</Text>
        <Text style={styles.menuMoreLinkSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuMoreLinkChevron}>›</Text>
    </TouchableOpacity>
  );
}

function MoreLinkGroup({ children }) {
  const styles = useStyles();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.menuMoreLinkGroup}>
      {items.map((child, index) => {
        const position =
          items.length === 1 ? 'only' : index === 0 ? 'first' : index === items.length - 1 ? 'last' : 'middle';
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { key: child.key ?? `more-row-${index}`, position });
        }
        return child;
      })}
    </View>
  );
}

function MoreHubTabScreen({
  moreHubScrollViewRef,
  mainTabBottomReserve,
  handleMoreHubScroll,
  restoreMoreHubScrollPosition,
  handleOpenProfileFromMore,
  handleOpenMoreGoals,
  handleOpenMovementsFromMore,
  handleOpenSplitPlannerFromMore,
  handleOpenStreakSubscreen,
  handleOpenHistoryFromMore,
  handleOpenAppearance,
}) {
  const styles = useStyles();
  return (
    <View style={styles.menuMoreScreen}>
      <View style={styles.menuMoreHeader}>
        <Text style={styles.menuMoreHeaderTitle}>More</Text>
      </View>

      <ScrollView
        ref={moreHubScrollViewRef}
        style={styles.menuMoreScroll}
        contentContainerStyle={[
          styles.menuMoreScrollContent,
          { paddingBottom: 24 + mainTabBottomReserve },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleMoreHubScroll}
        scrollEventThrottle={32}
        onContentSizeChange={restoreMoreHubScrollPosition}>
        <Text style={[styles.menuMoreSectionHeading, styles.menuMoreSectionHeadingFirst]}>Your account</Text>
        <MoreLinkGroup>
          <MoreLinkRow
            icon={MORE_LINK_ICONS.profile}
            title="Profile"
            subtitle="Name, height, and basics"
            onPress={handleOpenProfileFromMore}
            accessibilityLabel="Profile"
          />
          <MoreLinkRow
            icon={MORE_LINK_ICONS.goals}
            title="Goals"
            subtitle="Target weight and what shows on Progress"
            onPress={handleOpenMoreGoals}
            accessibilityLabel="Goals and target weight"
          />
        </MoreLinkGroup>

        <Text style={styles.menuMoreSectionHeading}>Training</Text>
        <MoreLinkGroup>
          <MoreLinkRow
            icon={MORE_LINK_ICONS.database}
            title="Movements"
            subtitle="Browse exercises, favorites, and your logged sets"
            onPress={handleOpenMovementsFromMore}
            accessibilityLabel="Movements"
          />
          <MoreLinkRow
            icon={MORE_LINK_ICONS.targets}
            title="Plan"
            subtitle="Set your weekly training days"
            onPress={handleOpenSplitPlannerFromMore}
            accessibilityLabel="Weekly training plan"
          />
        </MoreLinkGroup>

        <Text style={styles.menuMoreSectionHeading}>Progress</Text>
        <MoreLinkGroup>
          <MoreLinkRow
            icon={MORE_LINK_ICONS.streak}
            title="Streak & this week"
            subtitle="Week strip, streak ranks, and badges"
            onPress={handleOpenStreakSubscreen}
            accessibilityLabel="Streak and this week"
          />
          <MoreLinkRow
            icon={MORE_LINK_ICONS.history}
            title="Workout history"
            subtitle="Charts, weight log, and past sessions"
            onPress={handleOpenHistoryFromMore}
            accessibilityLabel="Workout history"
          />
        </MoreLinkGroup>

        <Text style={styles.menuMoreSectionHeading}>Preferences</Text>
        <MoreLinkGroup>
          <MoreLinkRow
            title="Appearance & app"
            subtitle="Theme and display options"
            onPress={handleOpenAppearance}
            accessibilityLabel="Appearance and app settings"
          />
          <MoreLinkRow
            muted
            title="Notifications"
            subtitle="Reminders — planned for a future update"
            onPress={() =>
              Alert.alert('Coming soon', 'Workout reminders and other notifications are not set up yet.')
            }
            accessibilityLabel="Notifications, coming soon"
          />
        </MoreLinkGroup>

        <Text style={styles.menuMoreSectionHeading}>Support</Text>
        <MoreLinkGroup>
          <MoreLinkRow
            muted
            title="Help & feedback"
            subtitle="FAQs and how to reach us"
            onPress={() => Alert.alert('Coming soon', 'Help topics and contact options will live here.')}
            accessibilityLabel="Help and feedback, coming soon"
          />
        </MoreLinkGroup>
      </ScrollView>
    </View>
  );
}

export default memo(MoreHubTabScreen);
