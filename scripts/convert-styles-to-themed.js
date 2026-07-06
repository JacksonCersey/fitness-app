/**
 * One-time helper: converts static style modules to theme factories.
 * Run: node scripts/convert-styles-to-themed.js
 */
const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  ["'rgba(93, 85, 216, 0.6)'", 't.topBarTranslucent'],
  ["'rgba(93, 85, 216, 0.85)'", 't.selectedExerciseBorder'],
  ["'rgba(93, 85, 216, 0.72)'", 't.secondaryButtonBg'],
  ["'rgba(93, 85, 216, 0.45)'", 't.cardBgTranslucent'],
  ["'rgba(93, 85, 216, 0.35)'", 't.cardBgTranslucent'],
  ["'rgba(93, 85, 216, 0.55)'", 't.innerCardBg'],
  ["'#423D8D'", 't.topBarStatusMatch'],
  ["'#1A1A1C'", 't.screenBg'],
  ["'#111214'", 't.screenBgAlt'],
  ["'#EDEDED'", 't.screenBg'],
  ["'#EEF1FF'", 't.textPrimary'],
  ["'rgba(238, 241, 255, 0.88)'", 't.textSecondary'],
  ["'rgba(238, 241, 255, 0.82)'", 't.setLineMuted'],
  ["'rgba(238, 241, 255, 0.78)'", 't.textMuted'],
  ["'rgba(238, 241, 255, 0.75)'", 't.textSecondary'],
  ["'rgba(238, 241, 255, 0.74)'", 't.textSecondary'],
  ["'rgba(238, 241, 255, 0.72)'", 't.textSecondary'],
  ["'rgba(238, 241, 255, 0.65)'", 't.textMuted'],
  ["'rgba(238, 241, 255, 0.55)'", 't.textMuted'],
  ["'rgba(238, 241, 255, 0.5)'", 't.textSubtle'],
  ["'rgba(238, 241, 255, 0.45)'", 't.textSubtle'],
  ["'rgba(238, 241, 255, 0.42)'", 't.placeholderText'],
  ["'rgba(238, 241, 255, 0.9)'", 't.textPrimary'],
  ["'#4B3CC1'", 't.navBack'],
  ["'#5D55D8'", 't.primaryButtonBg'],
  ["'#5950D0'", 't.secondaryButtonBg'],
  ["'rgba(75, 60, 193, 0.35)'", 't.helpButtonBorder'],
  ["'rgba(44, 36, 138, 0.75)'", 't.inputBg'],
  ["'rgba(44, 36, 138, 0.45)'", 't.selectedExerciseBg'],
  ["'rgba(75, 60, 193, 0.9)'", 't.exerciseCardTop'],
  ["'rgba(130, 118, 255, 0.38)'", 't.glowTop'],
  ["'rgba(42, 32, 145, 0.56)'", 't.glowBottom'],
  ["'#4ADE80'", 't.successBright'],
  ["'#F59E0B'", 't.streakGold'],
  ["'#F87171'", 't.destructiveSoft'],
  ["'#FFB4B4'", 't.destructiveText'],
  ["'#FFFFFF'", 't.cardBg'],
  ["'#E8ECFF'", 't.secondaryButtonText'],
  ["'rgba(255, 255, 255, 0.92)'", 't.navInactive'],
  ["'rgba(255, 255, 255, 0.46)'", 't.navIndicatorBg'],
  ["'rgba(255, 255, 255, 0.42)'", 't.navTrackBorder'],
  ["'rgba(255, 255, 255, 0.35)'", 't.cardBorder'],
  ["'rgba(255,255,255,0.35)'", 't.cardBorder'],
  ["'rgba(255, 255, 255, 0.28)'", 't.navTrackBorder'],
  ["'rgba(255,255,255,0.28)'", 't.navTrackBorder'],
  ["'rgba(255, 255, 255, 0.25)'", 't.cardBorderSubtle'],
  ["'rgba(255, 255, 255, 0.24)'", 't.cardBorder'],
  ["'rgba(255, 255, 255, 0.2)'", 't.cardBorderSubtle'],
  ["'rgba(255, 255, 255, 0.18)'", 't.navTrackBg'],
  ["'rgba(255, 255, 255, 0.16)'", 't.borderSubtle'],
  ["'rgba(255, 255, 255, 0.15)'", 't.borderSubtle'],
  ["'rgba(255, 255, 255, 0.14)'", 't.borderFaint'],
  ["'rgba(255, 255, 255, 0.12)'", 't.borderFaint'],
  ["'rgba(255, 255, 255, 0.1)'", 't.borderSubtle'],
  ["'rgba(255, 255, 255, 0.08)'", 't.borderFaint'],
  ["'rgba(255,255,255,0.9)'", 't.helpButtonBg'],
  ["'rgba(255,255,255,0.8)'", 't.pillBg'],
  ["'rgba(255,255,255,0.5)'", 't.chipWellBorder'],
  ["'rgba(248, 248, 255, 0.94)'", 't.chipWellBg'],
  ["'rgba(0,0,0,0.5)'", 't.overlayBg'],
  ["'rgba(0, 0, 0, 0.5)'", 't.overlayBg'],
  ["'rgba(0,0,0,0.45)'", 't.overlayBgHeavy'],
  ["'rgba(0, 0, 0, 0.45)'", 't.overlayBgHeavy'],
  ["'rgba(0, 0, 0, 0.4)'", 't.overlayBg'],
  ["'rgba(0, 0, 0, 0.28)'", 't.surfaceMuted'],
  ["'rgba(0, 0, 0, 0.22)'", 't.surfaceMuted'],
  ["'rgba(0, 0, 0, 0.18)'", 't.surfaceMuted'],
  ["'rgba(28, 30, 36, 0.55)'", 't.surfaceMuted'],
  ["'rgba(28, 30, 36, 0.92)'", 't.moreRowBg'],
  ["'#26292F'", 't.surfaceRaised'],
  ["'#353840'", 't.surfaceSunken'],
  ["'#383267'", 't.splitModalCardBg'],
  ["'#2d2858'", 't.splitModalInnerBg'],
  ["'rgba(62, 65, 76, 0.98)'", 't.surfaceRaised'],
  ["'rgba(124, 116, 232, 0.98)'", 't.secondaryButtonBg'],
  ["'#1B1E23'", 't.inputBg'],
  ["'#2F343C'", 't.inputBorder'],
  ["'#E6E8EC'", 't.textSecondary'],
  ["'#9AA1AC'", 't.textMuted'],
  ["'#3B82F6'", 't.pplLegs'],
  ["'#252A32'", 't.surfaceSunken'],
  ["'#2A2F38'", 't.surfaceRaised'],
  ["'#171A1F'", 't.screenBgAlt'],
  ["'#1E232B'", 't.cardBg'],
  ["'boxShadow: \\'0px 6px 20px rgba(0, 0, 0, 0.25)\\''", "boxShadow: `0px 6px 20px ${t.shadowTint}`"],
  ["'boxShadow: \\'0px 2px 12px rgba(0, 0, 0, 0.14)\\''", "boxShadow: `0px 2px 12px ${t.shadowTint}`"],
];

function convertFile(relPath, exportName, factoryName) {
  const filePath = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove old top constants and WORKOUT_THEME import if present
  content = content.replace(/\/\*\* Home \/ More header bar[\s\S]*?const MENU_TOP_BAR_STATUS_MATCH = '[^']+';\n\n/, '');
  content = content.replace(/import \{ WORKOUT_THEME \} from '\.\.\/theme\/workoutTheme';\n\n/, '');

  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }

  content = content.replace(
    new RegExp(`const ${exportName} = \\{`),
    `export function ${factoryName}(theme) {\n  const t = theme;\n  return {`,
  );

  content = content.replace(
    new RegExp(`\\};\nexport default ${exportName};`),
    `  };\n}\n\n/** Static fallback for unmigrated imports — light candy theme. */\nimport { GAME_THEME_LIGHT } from '../theme/gameTheme';\nexport default ${factoryName}(GAME_THEME_LIGHT);`,
  );

  // Bump border radius 14 -> 18 for buttons/cards where specified in plan
  content = content.replace(/borderRadius: 14,/g, 'borderRadius: 18,');
  content = content.replace(/borderRadius: 16,/g, 'borderRadius: 18,');

  fs.writeFileSync(filePath, content);
  console.log('Converted', relPath);
}

convertFile('src/styles/menuLayoutProfileStyles.js', 'menuLayoutProfileStyles', 'createMenuLayoutProfileStyles');
convertFile('src/styles/formsHistoryMuscleStyles.js', 'formsHistoryMuscleStyles', 'createFormsHistoryMuscleStyles');
