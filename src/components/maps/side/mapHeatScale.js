import { getMapPalette } from '../mapTheme';

export const HEAT_LEVELS = [
  { min: 0, max: 0, label: '0 cursos', color: '#F1F5F9', text: '#64748B' },
  { min: 1, max: 5, label: '1 a 5', color: '#BAE6FD', text: '#0369A1' },
  { min: 6, max: 15, label: '6 a 15', color: '#38BDF8', text: '#0284C7' },
  { min: 16, max: 35, label: '16 a 35', color: '#2563EB', text: '#FFFFFF' },
  { min: 36, max: 70, label: '36 a 70', color: '#1D4ED8', text: '#FFFFFF' },
  { min: 71, max: Infinity, label: '70+ cursos', color: '#0F1D30', text: '#38BDF8' },
];

export const SEMIARIDO_HEAT_LEVELS = [
  { min: 0, max: 0, label: '0 cursos', color: '#FEF9C3', text: '#854D0E' },
  { min: 1, max: 5, label: '1 a 5', color: '#FDE68A', text: '#92400E' },
  { min: 6, max: 15, label: '6 a 15', color: '#FBBF24', text: '#78350F' },
  { min: 16, max: 35, label: '16 a 35', color: '#F59E0B', text: '#FFFFFF' },
  { min: 36, max: 70, label: '36 a 70', color: '#D97706', text: '#FFFFFF' },
  { min: 71, max: Infinity, label: '70+ cursos', color: '#78350F', text: '#FEF3C7' },
];

/**
 * Retorna os níveis de calor dinâmicos adaptados ao tema claro/escuro e semiárido.
 */
export function getDynamicHeatLevels(isSemiarido = false, isDark = false) {
  const palette = getMapPalette(isDark, isSemiarido);
  const textMuted = palette.textMuted || (isDark ? '#94A3B8' : '#64748B');
  const textPrimary = palette.textPrimary || (isDark ? '#F8FAFC' : '#0F172A');

  return [
    { min: 0, max: 0, label: '0 cursos', color: palette.choropleth.zero, text: textMuted },
    { min: 1, max: 5, label: '1 a 5', color: palette.choropleth.level5, text: textMuted },
    { min: 6, max: 15, label: '6 a 15', color: palette.choropleth.level4, text: isDark ? '#FFFFFF' : textPrimary },
    { min: 16, max: 35, label: '16 a 35', color: palette.choropleth.level3, text: '#FFFFFF' },
    { min: 36, max: 70, label: '36 a 70', color: palette.choropleth.level2, text: '#FFFFFF' },
    { min: 71, max: Infinity, label: '70+ cursos', color: palette.choropleth.level1, text: isDark ? '#0F172A' : '#FFFFFF' },
  ];
}

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
