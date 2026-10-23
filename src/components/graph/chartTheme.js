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

export const LIGHT_CHART_PALETTE = [
  '#2563EB', // Royal Blue 600
  '#0284C7', // Cerulean Blue 600
  '#0D9488', // Teal 600
  '#4338CA', // Indigo 700
  '#D97706', // Amber 600
  '#059669', // Emerald 600
  '#7C3AED', // Violet 600
  '#DC2626', // Red 600
];

export const DARK_CHART_PALETTE = [
  '#38BDF8', // Sky Blue 400
  '#60A5FA', // Royal Light 400
  '#34D399', // Emerald 400
  '#818CF8', // Indigo 400
  '#F472B6', // Pink 400
  '#2DD4BF', // Aqua 400
  '#FBBF24', // Amber 400
  '#A78BFA', // Purple 400
];

/**
 * Hook que observa o tema atual da aplicação e retorna cores resolvidas e tokens para Recharts.
 *
 * @returns {object} Objeto com paleta de 8 cores, cores semânticas, bordas e textos
 */
export function useChartTheme() {
  const { isDark } = useTheme();

  return useMemo(() => {
    const palette = isDark ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE;

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

    const primary = isDark ? '#60A5FA' : '#2563EB';
    const accent = isDark ? '#FBBF24' : '#D97706';
    const success = isDark ? '#34D399' : '#16A34A';
    const warning = isDark ? '#FBBF24' : '#D97706';

    const grid = isDark ? '#1E293B' : '#E2E8F0';
    const textPrimary = isDark ? '#F8FAFC' : '#090D16';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';
    const textMuted = isDark ? '#64748B' : '#94A3B8';
    const surface = isDark ? '#111827' : '#FFFFFF';

    return {
      isDark,
      palette,
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
