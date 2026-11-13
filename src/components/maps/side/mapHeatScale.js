import { getMapPalette, resolveCssRgb } from '../mapTheme';

/**
 * Retorna os níveis de calor dinâmicos adaptados ao tema claro/escuro e semiárido,
 * consumindo a escala sequencial unificada de mapTheme (--color-map-1..5 / --chart-seq).
 */
export function getDynamicHeatLevels(isSemiarido = false, isDark = false) {
  const palette = getMapPalette(isDark, isSemiarido);
  const white = resolveCssRgb('--color-white', 'rgb(255, 255, 255)');
  const darkInk = resolveCssRgb('--color-neutral-950', 'rgb(9, 13, 22)');
  const textMuted = palette.textMuted || resolveCssRgb('--color-text-muted', isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)');
  const textPrimary = palette.textPrimary || resolveCssRgb('--color-text-primary', isDark ? 'rgb(248, 250, 252)' : 'rgb(9, 13, 22)');

  return [
    { min: 0, max: 0, label: '0 cursos', color: palette.choropleth.zero, text: textMuted },
    { min: 1, max: 5, label: '1 a 5', color: palette.choropleth.level5, text: isDark ? white : textPrimary },
    { min: 6, max: 15, label: '6 a 15', color: palette.choropleth.level4, text: isDark ? white : textPrimary },
    { min: 16, max: 35, label: '16 a 35', color: palette.choropleth.level3, text: white },
    { min: 36, max: 70, label: '36 a 70', color: palette.choropleth.level2, text: white },
    { min: 71, max: Infinity, label: '70+ cursos', color: palette.choropleth.level1, text: isDark ? darkInk : white },
  ];
}

export const HEAT_LEVELS = getDynamicHeatLevels(false, false);
export const SEMIARIDO_HEAT_LEVELS = getDynamicHeatLevels(true, false);

export const getHeatColor = (count, isSemiarido = false, isDark = false) => {
  const palette = getMapPalette(isDark, isSemiarido);
  const { zero, level5, level4, level3, level2, level1 } = palette.choropleth;

  if (count === 0) return zero;
  if (count <= 5) return level5;
  if (count <= 15) return level4;
  if (count <= 35) return level3;
  if (count <= 70) return level2;
  return level1;
};

// Escala Logarítmica para mitigar o impacto de grandes outliers e destacar valores intermediários
export const getRelativeHeatColor = (count, maxCount, isSemiarido = false, isDark = false) => {
  const palette = getMapPalette(isDark, isSemiarido);
  const { zero, level5, level4, level3, level2, level1 } = palette.choropleth;

  if (!count || count === 0) return zero;
  if (maxCount <= 0) return zero;

  const logVal = Math.log(count + 1);
  const logMax = Math.log(maxCount + 1);
  const ratio = logMax > 0 ? logVal / logMax : 0;

  if (ratio <= 0.15) return level5;
  if (ratio <= 0.35) return level4;
  if (ratio <= 0.60) return level3;
  if (ratio <= 0.85) return level2;
  return level1;
};
