import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Lê uma variável CSS no formato 'R G B' ou 'rgb(...)' do elemento raiz e converte em string RGB válida para SVG/Canvas.
 *
 * @param {string} varName - Nome da variável CSS (ex: '--color-map-1')
 * @param {string} [fallback='rgb(33, 95, 148)'] - Cor de fallback caso a variável não esteja disponível
 * @returns {string} String no formato 'rgb(R, G, B)'
 */
export function resolveCssRgb(varName, fallback = 'rgb(33, 95, 148)') {
  if (typeof window === 'undefined' || !document?.documentElement) {
    return fallback;
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;

  if (raw.startsWith('#') || raw.startsWith('rgb')) {
    return raw;
  }

  if (raw.startsWith('var(')) {
    const innerVar = raw.replace(/^var\(/, '').replace(/\)$/, '').trim();
    return resolveCssRgb(innerVar, fallback);
  }

  const parts = raw.includes(',') ? raw.split(',') : raw.split(/\s+/);
  if (parts.length >= 3) {
    const [r, g, b] = parts.map((p) => p.trim());
    return `rgb(${r}, ${g}, ${b})`;
  }

  return raw || fallback;
}

/**
 * Retorna as cores do mapa no formato rgb(R, G, B) estritamente compatível com Leaflet e html2canvas.
 *
 * @param {boolean} [isDark=false] - Modo escuro ativo
 * @param {boolean} [isSemiarido=false] - Filtro de Semiárido ativo
 * @returns {object} Objeto com paleta choropleth, strokes, surface, border e tipografia
 */
export function getMapPalette(isDark = false, isSemiarido = false) {
  const surface = resolveCssRgb('--color-surface', isDark ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)');
  const surfaceSunken = resolveCssRgb('--color-surface-soft', isDark ? 'rgb(9, 13, 22)' : 'rgb(248, 250, 252)');
  const textPrimary = resolveCssRgb('--color-text-primary', isDark ? 'rgb(248, 250, 252)' : 'rgb(9, 13, 22)');
  const textSecondary = resolveCssRgb('--color-text-secondary', isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)');
  const textMuted = resolveCssRgb('--color-text-muted', isDark ? 'rgb(100, 116, 139)' : 'rgb(148, 163, 184)');
  const border = resolveCssRgb('--color-border', isDark ? 'rgb(30, 41, 59)' : 'rgb(226, 232, 240)');

  if (isSemiarido) {
    const zero = isDark ? 'rgb(40, 28, 18)' : 'rgb(254, 249, 195)';
    const level1 = isDark ? 'rgb(251, 191, 36)' : 'rgb(120, 53, 15)';
    const level2 = isDark ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)';
    const level3 = isDark ? 'rgb(217, 119, 6)' : 'rgb(245, 158, 11)';
    const level4 = isDark ? 'rgb(180, 83, 9)' : 'rgb(251, 191, 36)';
    const level5 = isDark ? 'rgb(120, 53, 15)' : 'rgb(253, 230, 138)';

    return {
      isDark,
      isSemiarido,
      choropleth: {
        zero,
        level1,
        level2,
        level3,
        level4,
        level5,
        levels: [level5, level4, level3, level2, level1]
      },
      stroke: {
        default: isDark ? 'rgb(146, 64, 14)' : 'rgb(217, 119, 6)',
        hover: isDark ? 'rgb(245, 158, 11)' : 'rgb(180, 83, 9)',
        selected: isDark ? 'rgb(251, 191, 36)' : 'rgb(180, 83, 9)',
      },
      surface,
      surfaceSunken,
      textPrimary,
      textSecondary,
      textMuted,
      border
    };
  }

  const zero = resolveCssRgb('--color-map-neutral', isDark ? 'rgb(30, 41, 59)' : 'rgb(241, 245, 249)');
  const level1 = resolveCssRgb('--color-map-1', isDark ? 'rgb(96, 165, 250)' : 'rgb(30, 58, 138)');
  const level2 = resolveCssRgb('--color-map-2', isDark ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)');
  const level3 = resolveCssRgb('--color-map-3', isDark ? 'rgb(37, 99, 235)' : 'rgb(96, 165, 250)');
  const level4 = resolveCssRgb('--color-map-4', isDark ? 'rgb(30, 58, 138)' : 'rgb(147, 197, 253)');
  const level5 = resolveCssRgb('--color-map-5', isDark ? 'rgb(23, 37, 84)' : 'rgb(219, 234, 254)');

  return {
    isDark,
    isSemiarido,
    choropleth: {
      zero,
      level1,
      level2,
      level3,
      level4,
      level5,
      levels: [level1, level2, level3, level4, level5]
    },
    stroke: {
      default: isDark ? 'rgb(51, 65, 85)' : 'rgb(226, 232, 240)',
      hover: isDark ? 'rgb(148, 163, 184)' : 'rgb(30, 41, 59)',
      selected: isDark ? 'rgb(96, 165, 250)' : 'rgb(17, 24, 39)',
    },
    surface,
    surfaceSunken,
    textPrimary,
    textSecondary,
    textMuted,
    border
  };
}

/**
 * Hook que resolve a paleta cromática do mapa de acordo com o tema atual (dark/light) e filtro semiárido.
 *
 * @param {boolean} [isSemiarido=false] - Indica se o mapa está sob o filtro do Semiárido
 * @returns {object} Paleta com cores choropleth, stroke, surface, text e border
 */
export function useMapTheme(isSemiarido = false) {
  const { isDark } = useTheme();
  return useMemo(() => getMapPalette(isDark, isSemiarido), [isDark, isSemiarido]);
}
