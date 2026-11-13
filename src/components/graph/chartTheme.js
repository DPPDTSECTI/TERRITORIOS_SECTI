import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Lê uma variável CSS no formato 'R G B' ou 'rgb(...)' do elemento raiz e converte em string RGB válida para SVG/Canvas.
 *
 * @param {string} varName - Nome da variável CSS (ex: '--color-chart-1')
 * @param {string} [fallback='rgb(47, 117, 181)'] - Cor de fallback caso a variável não esteja disponível
 * @returns {string} String no formato 'rgb(R, G, B)'
 */
export function resolveCssRgb(varName, fallback = 'rgb(47, 117, 181)') {
  if (typeof window === 'undefined' || !document?.documentElement) {
    return fallback;
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;

  // Se já for rgb(...) ou hex, retorna direto
  if (raw.startsWith('#') || raw.startsWith('rgb')) {
    return raw;
  }

  // Se for "var(--outro-token)", resolve recursivamente
  if (raw.startsWith('var(')) {
    const innerVar = raw.replace(/^var\(/, '').replace(/\)$/, '').trim();
    return resolveCssRgb(innerVar, fallback);
  }

  // Se for "R G B" ou "R, G, B"
  const parts = raw.includes(',') ? raw.split(',') : raw.split(/\s+/);
  if (parts.length >= 3) {
    const [r, g, b] = parts.map((p) => p.trim());
    return `rgb(${r}, ${g}, ${b})`;
  }

  return raw || fallback;
}

/**
 * Converte uma variável CSS no formato 'R G B', 'rgb(...)' ou hex em hex '#RRGGBB'.
 * Necessário para pontos que concatenam alpha hex (ex.: `${color}18`) ou esperam hex válido.
 *
 * @param {string} varName - Nome da variável CSS (ex: '--color-primary-600')
 * @param {string} [fallback='#2563EB'] - Cor hex de fallback fora do navegador
 * @returns {string} String no formato '#RRGGBB'
 */
export function resolveCssHex(varName, fallback = '#2563EB') {
  if (typeof window === 'undefined' || !document?.documentElement) {
    return fallback;
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;

  if (raw.startsWith('#')) {
    return raw.length === 4
      ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase()
      : raw.toUpperCase();
  }

  if (raw.startsWith('var(')) {
    const innerVar = raw.replace(/^var\(/, '').replace(/\)$/, '').trim();
    return resolveCssHex(innerVar, fallback);
  }

  const normalized = raw.replace(/^rgba?\(/i, '').replace(/\)$/, '');
  const parts = normalized.includes(',') ? normalized.split(',') : normalized.split(/\s+/);
  if (parts.length >= 3) {
    const toHex = (n) => Math.max(0, Math.min(255, Number(n) || 0)).toString(16).padStart(2, '0');
    return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`.toUpperCase();
  }

  return fallback;
}

/**
 * Retorna os tokens semânticos de interface resolvidos a partir das variáveis CSS do tema.
 *
 * @param {boolean} [isDark=false] - Se o tema escuro está ativo
 * @returns {object} Mapa de cores semânticas em hex (#RRGGBB)
 */
export function getSemanticColors(isDark = false) {
  return {
    brand: resolveCssHex('--color-brand', '#044B8D'),
    primary: resolveCssHex(isDark ? '--color-primary-400' : '--color-primary-600', isDark ? '#60A5FA' : '#2563EB'),
    primaryBase: resolveCssHex('--color-primary-600', '#2563EB'),
    primarySoft: resolveCssHex('--color-primary-500', '#3B82F6'),
    primaryLight: resolveCssHex('--color-primary-400', '#60A5FA'),
    primaryDeep: resolveCssHex('--color-primary-700', '#1D4ED8'),
    primaryNavy: resolveCssHex('--color-primary-900', '#1E3A8A'),
    primarySurface: resolveCssHex('--color-primary-50', '#EFF6FF'),
    primaryTint: resolveCssHex('--color-primary-100', '#DBEAFE'),
    warning: resolveCssHex('--color-warning-500', '#F59E0B'),
    warningDeep: resolveCssHex('--color-warning-600', '#D97706'),
    warningDark: resolveCssHex('--color-warning-700', '#B45309'),
    warningWarm: resolveCssHex('--color-warning-800', '#92400E'),
    warningSurface: resolveCssHex('--color-warning-50', '#FFFBEB'),
    warningTint: resolveCssHex('--color-warning-100', '#FEF3C7'),
    success: resolveCssHex('--color-success-500', '#10B981'),
    successBright: resolveCssHex('--color-success-400', '#34D399'),
    successDeep: resolveCssHex('--color-success-600', '#16A34A'),
    dangerTint: resolveCssHex('--color-danger-100', '#FEE2E2'),
    infoCyan: resolveCssHex('--color-chart-2', '#38BDF8'),
    indigo: resolveCssHex('--color-asset-incubadora', '#6366F1'),
    purple: resolveCssHex('--color-asset-hub', '#8B5CF6'),
    slateBorder: resolveCssHex('--color-border-strong', isDark ? '#334155' : '#CBD5E1'),
    slateMuted: resolveCssHex('--color-neutral-600', '#64748B'),
    slateDeep: resolveCssHex('--color-neutral-700', '#475569'),
    slateSurface: resolveCssHex('--color-surface-soft', isDark ? '#1E293B' : '#F8FAFC'),
    surface: resolveCssHex('--color-surface', isDark ? '#111827' : '#FFFFFF'),
    border: resolveCssHex('--color-border', isDark ? '#1E293B' : '#E2E8F0'),
    textPrimary: resolveCssHex('--color-text-primary', isDark ? '#F8FAFC' : '#090D16'),
    textSecondary: resolveCssHex('--color-text-secondary', isDark ? '#94A3B8' : '#64748B'),
    textMuted: resolveCssHex('--color-text-muted', isDark ? '#64748B' : '#94A3B8'),
    white: resolveCssHex('--color-white', '#FFFFFF'),
  };
}

/**
 * Lê uma lista de cores CSS separada por vírgula (ex: '--chart-cat' ou '--chart-seq').
 */
export function resolveCssPalette(varName, fallback = []) {
  if (typeof window === 'undefined' || !document?.documentElement) {
    return fallback;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  const items = raw.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

export const LIGHT_CHART_PALETTE = [
  '#2A6BB5', // Azul
  '#E8780A', // Laranja
  '#1FA3A6', // Ciano
  '#E0A100', // Amarelo
  '#D3127A', // Magenta
  '#6FA41C', // Verde
];

export const LIGHT_BLUE_PALETTE = [
  '#044B8D', // Azul Bahia (nível máximo)
  '#2F73B8', // Azul Sequencial 4
  '#6FA2D8', // Azul Sequencial 3
  '#A9C8EA', // Azul Sequencial 2
  '#2A6BB5', // Azul Categórico
];

export const DARK_BLUE_PALETTE = [
  '#A9CBF0', // Azul Sequencial Claro (máximo no escuro)
  '#5B97DA', // Azul Sequencial 4
  '#2F6DB5', // Azul Sequencial 3
  '#1F4C80', // Azul Sequencial 2
  '#4A8AD4', // Azul Categórico Dark
];

export const DARK_CHART_PALETTE = [
  '#4A8AD4', // Azul
  '#D46F12', // Laranja
  '#1FA0A3', // Ciano
  '#BE8A00', // Amarelo
  '#E0408E', // Magenta
  '#66991F', // Verde
];

/**
 * Hook que observa o tema atual da aplicação e retorna cores resolvidas e tokens para Recharts.
 *
 * @returns {object} Objeto com paleta categórica/sequencial, cores semânticas, bordas e textos
 */
export function useChartTheme() {
  const { isDark } = useTheme();

  return useMemo(() => {
    const fallbackPalette = isDark ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE;
    const palette = resolveCssPalette('--chart-cat', fallbackPalette);
    const seqPalette = resolveCssPalette(
      '--chart-seq',
      isDark
        ? ['#1A2C45', '#1F4C80', '#2F6DB5', '#5B97DA', '#A9CBF0']
        : ['#DCE9F7', '#A9C8EA', '#6FA2D8', '#2F73B8', '#044B8D']
    );
    const bluePalette = isDark ? DARK_BLUE_PALETTE : LIGHT_BLUE_PALETTE;

    const goldenPalette = isDark
      ? [
          '#FBBF24', // Amber 400
          '#FDE047', // Yellow 300
          '#FCD34D', // Amber 300
          '#FACC15', // Yellow 400
          '#FB923C', // Orange 400
          '#FDE68A', // Amber 200
          '#FEF08A', // Yellow 200
          '#FDBA74', // Orange 300
        ]
      : [
          '#B45309', // Amber 700
          '#D97706', // Amber 600
          '#92400E', // Amber 800
          '#CA8A04', // Yellow 600
          '#C2410C', // Orange 700
          '#EA580C', // Orange 600
          '#A16207', // Yellow 700
          '#9A3412', // Orange 800
        ];

    const semantic = getSemanticColors(isDark);
    const primary = semantic.primary;
    const accent = isDark ? semantic.warning : semantic.warningDeep;
    const success = isDark ? semantic.successBright : semantic.successDeep;
    const warning = isDark ? semantic.warning : semantic.warningDeep;

    const grid = semantic.border;
    const textPrimary = semantic.textPrimary;
    const textSecondary = semantic.textSecondary;
    const textMuted = semantic.textMuted;
    const surface = semantic.surface;

    return {
      isDark,
      palette,
      seqPalette,
      bluePalette,
      goldenPalette,
      semiaridoPalette: goldenPalette,
      primary,
      accent,
      success,
      warning,
      grid,
      textPrimary,
      textSecondary,
      textMuted,
      surface,
    };
  }, [isDark]);
}

/**
 * Tooltip padrão customizado para gráficos Recharts com estilo padronizado de Card do Design System.
 * Implementado via React.createElement para compatibilidade plena em arquivos .js sem transpilador JSX.
 *
 * @component
 */
export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;

  const children = [];

  if (label) {
    children.push(
      React.createElement(
        'div',
        {
          key: 'label',
          className: 'font-semibold text-text-primary text-body-sm pb-1.5 border-b border-border/60',
        },
        label
      )
    );
  }

  const items = payload.map((entry, index) => {
    const color =
      entry.color || entry.fill || entry.payload?.fill || 'rgb(var(--color-primary-600))';
    const name = entry.name || entry.dataKey;
    const value = formatter ? formatter(entry.value, name, entry) : entry.value;

    return React.createElement(
      'div',
      {
        key: `item-${index}`,
        className: 'flex items-center justify-between gap-3',
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-1.5 min-w-0' },
        React.createElement('span', {
          className: 'w-2 h-2 rounded-full shrink-0',
          style: { backgroundColor: color },
        }),
        React.createElement(
          'span',
          { className: 'text-text-secondary truncate text-caption' },
          name
        )
      ),
      React.createElement(
        'span',
        { className: 'tnum font-semibold text-text-primary shrink-0 text-caption' },
        value
      )
    );
  });

  children.push(
    React.createElement('div', { key: 'items', className: 'space-y-1' }, items)
  );

  return React.createElement(
    'div',
    {
      className:
        'bg-surface/95 backdrop-blur-md border border-border/80 rounded-subcard shadow-card px-3.5 py-2.5 text-caption select-none space-y-1.5 z-50',
    },
    children
  );
}

export default useChartTheme;
