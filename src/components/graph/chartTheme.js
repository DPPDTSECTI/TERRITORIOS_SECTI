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
 * Hook que observa o tema atual da aplicação e retorna cores resolvidas e tokens para Recharts.
 *
 * @returns {object} Objeto com paleta de 8 cores, cores semânticas, bordas e textos
 */
export function useChartTheme() {
  const { isDark } = useTheme();

  return useMemo(() => {
    const palette = [
      resolveCssRgb('--color-chart-1', isDark ? 'rgb(56, 189, 248)' : 'rgb(37, 99, 235)'),
      resolveCssRgb('--color-chart-2', isDark ? 'rgb(96, 165, 250)' : 'rgb(15, 23, 42)'),
      resolveCssRgb('--color-chart-3', isDark ? 'rgb(241, 245, 249)' : 'rgb(2, 132, 199)'),
      resolveCssRgb('--color-chart-4', isDark ? 'rgb(45, 212, 191)' : 'rgb(71, 85, 105)'),
      resolveCssRgb('--color-chart-5', isDark ? 'rgb(129, 140, 248)' : 'rgb(67, 56, 202)'),
      resolveCssRgb('--color-chart-6', isDark ? 'rgb(59, 130, 246)' : 'rgb(13, 148, 136)'),
      resolveCssRgb('--color-chart-7', isDark ? 'rgb(148, 163, 184)' : 'rgb(29, 78, 216)'),
      resolveCssRgb('--color-chart-8', isDark ? 'rgb(186, 230, 253)' : 'rgb(100, 116, 139)'),
    ];

    const goldenPalette = [
      resolveCssRgb('--color-accent-600', isDark ? 'rgb(251, 191, 36)' : 'rgb(180, 83, 9)'),
      resolveCssRgb('--color-accent-500', isDark ? 'rgb(253, 224, 71)' : 'rgb(217, 119, 6)'),
      resolveCssRgb('--color-accent-400', isDark ? 'rgb(252, 211, 77)' : 'rgb(146, 64, 14)'),
      resolveCssRgb('--color-accent-700', isDark ? 'rgb(250, 204, 21)' : 'rgb(202, 138, 4)'),
      resolveCssRgb('--color-accent-300', isDark ? 'rgb(251, 146, 60)' : 'rgb(120, 53, 15)'),
      resolveCssRgb('--color-accent-800', isDark ? 'rgb(253, 230, 138)' : 'rgb(245, 158, 11)'),
      resolveCssRgb('--color-accent-200', isDark ? 'rgb(254, 240, 138)' : 'rgb(161, 98, 7)'),
      resolveCssRgb('--color-accent-900', isDark ? 'rgb(253, 186, 116)' : 'rgb(154, 52, 18)'),
    ];

    const primary = resolveCssRgb('--color-primary-600', isDark ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)');
    const accent = resolveCssRgb('--color-accent-500', isDark ? 'rgb(228, 150, 24)' : 'rgb(214, 162, 48)');
    const success = resolveCssRgb('--color-success-700', isDark ? 'rgb(74, 222, 128)' : 'rgb(21, 128, 61)');
    const warning = resolveCssRgb('--color-warning-700', isDark ? 'rgb(251, 191, 36)' : 'rgb(180, 83, 9)');

    const grid = resolveCssRgb('--color-border', isDark ? 'rgb(30, 41, 59)' : 'rgb(226, 232, 240)');
    const textPrimary = resolveCssRgb('--color-text-primary', isDark ? 'rgb(248, 250, 252)' : 'rgb(9, 13, 22)');
    const textSecondary = resolveCssRgb('--color-text-secondary', isDark ? 'rgb(148, 163, 184)' : 'rgb(100, 116, 139)');
    const textMuted = resolveCssRgb('--color-text-muted', isDark ? 'rgb(100, 116, 139)' : 'rgb(148, 163, 184)');
    const surface = resolveCssRgb('--color-surface', isDark ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)');

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
