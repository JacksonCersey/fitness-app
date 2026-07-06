/**
 * Migrates style consumers to useStyles() / useWorkoutTheme() / useGameTheme().
 * Run: node scripts/migrate-style-consumers.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

const FILES = [
  'screens/onboarding/OnboardingFlow.js',
  'screens/ProfileScreen.js',
  'screens/onboarding/OnboardingStepShell.js',
  'screens/WeeklySplitPlannerScreen.js',
  'components/WeeklySplitPlannerEditor.js',
  'components/profile/ProfileCurrentWeightInput.js',
  'components/profile/ProfileGoalWeightInput.js',
  'components/profile/ProfileHeightPickers.js',
  'components/profile/ProfileNameInput.js',
  'screens/WorkoutScreen.js',
  'app/navigation/MainTabsNavigator.js',
  'app/navigation/AppNavigator.js',
  'components/MenuRankTopBar.js',
  'components/HomeMuscleStatusCard.js',
  'screens/SummaryScreen.js',
  'components/LogSheetMovementHistorySheet.js',
  'screens/HistoryTabScreen.js',
  'app/context/ActiveWorkoutContext.js',
  'components/LogSheetRestTimer.js',
  'navigation/MainTabsLayout.js',
  'navigation/bottomTabBar/MainBottomTabBar.js',
  'screens/MenuHomeTabScreen.js',
  'components/WorkoutCelebrationBanner.js',
  'components/targetsProgressShared.js',
  'screens/StrengthMovementsScreen.js',
  'components/MovementRecentScrollCard.js',
  'components/MovementsAccordionSection.js',
  'components/MovementCatalogCard.js',
  'screens/MoreHubTabScreen.js',
  'screens/StreakScreen.js',
  'screens/MoreGoalsScreen.js',
  'components/StrengthScoreCard.js',
  'components/StreakRankPanel.js',
  'components/WorkoutSessionTargetsSheetContent.js',
  'screens/MuscleMapTabScreen.js',
  'screens/HistoryDayWorkoutsScreen.js',
  'screens/MainTabsWeightLogModal.js',
  'screens/AppearanceScreen.js',
  'components/ActiveWorkoutExerciseSwipeRow.js',
];

function themeContextImport(filePath) {
  const dir = path.dirname(filePath);
  const rel = path.relative(dir, path.join(ROOT, 'app/context/ThemeStylesContext')).replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function migrateFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  let content = fs.readFileSync(filePath, 'utf8');
  const ctxImport = themeContextImport(filePath);

  const hadStyles = /import \{ styles \} from/.test(content);
  const hadWorkoutTheme = /WORKOUT_THEME/.test(content);
  const hadGameTheme = /getGameTheme|useGameTheme/.test(content);

  if (!hadStyles && !hadWorkoutTheme) return;

  const hooksNeeded = new Set();
  if (hadStyles) hooksNeeded.add('useStyles');
  if (hadWorkoutTheme) hooksNeeded.add('useWorkoutTheme');
  if (content.includes('useGameTheme') || content.includes('getGameTheme')) hooksNeeded.add('useGameTheme');

  content = content.replace(/import \{ styles \} from ['"][^'"]+['"];\n?/g, '');
  content = content.replace(
    /import \{ WORKOUT_THEME \} from ['"][^'"]+['"];\n?/g,
    '',
  );
  content = content.replace(
    /import \{ WORKOUT_THEME, [^}]+\} from ['"][^'"]+['"];\n?/g,
    '',
  );

  const hookImport = `import { ${[...hooksNeeded].sort().join(', ')} } from '${ctxImport}';\n`;
  if (!content.includes("from '" + ctxImport + "'") && !content.includes('from "' + ctxImport + '"')) {
    const importInsert = content.match(/^import .+;\n/m);
    if (importInsert) {
      const idx = content.indexOf(importInsert[0]) + importInsert[0].length;
      content = content.slice(0, idx) + hookImport + content.slice(idx);
    } else {
      content = hookImport + content;
    }
  }

  if (hadWorkoutTheme) {
    content = content.replace(/const wt = WORKOUT_THEME;/g, 'const wt = useWorkoutTheme();');
    content = content.replace(/WORKOUT_THEME\./g, 'useWorkoutTheme().');
    // fix double hook calls - replace useWorkoutTheme().x repeated - do simpler: keep wt variable pattern
  }

  if (hadStyles) {
    // Insert const styles = useStyles(); after first function component opening brace
    if (!content.includes('const styles = useStyles()')) {
      content = content.replace(
        /(function [A-Za-z0-9_]+\([^)]*\) \{)\n/,
        '$1\n  const styles = useStyles();\n',
      );
      content = content.replace(
        /(function [A-Za-z0-9_]+\(\{[^}]*\}\) \{)\n/,
        '$1\n  const styles = useStyles();\n',
      );
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('migrated', relPath);
}

for (const f of FILES) migrateFile(f);
