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
      resolveCssRgb('--color-chart-1', isDark ? 'rgb(96, 160, 216)' : 'rgb(47, 117, 181)'),
      resolveCssRgb('--color-chart-2', isDark ? 'rgb(45, 190, 195)' : 'rgb(20, 150, 160)'),
      resolveCssRgb('--color-chart-3', isDark ? 'rgb(232, 178, 60)' : 'rgb(196, 146, 36)'),
      resolveCssRgb('--color-chart-4', isDark ? 'rgb(160, 145, 225)' : 'rgb(124, 108, 196)'),
      resolveCssRgb('--color-chart-5', isDark ? 'rgb(130, 185, 225)' : 'rgb(92, 155, 200)'),
      resolveCssRgb('--color-chart-6', isDark ? 'rgb(240, 135, 115)' : 'rgb(217, 108, 90)'),
      resolveCssRgb('--color-chart-7', isDark ? 'rgb(100, 190, 150)' : 'rgb(76, 140, 110)'),
      resolveCssRgb('--color-chart-8', isDark ? 'rgb(148, 163, 184)' : 'rgb(123, 138, 153)'),
    ];

    const primary = resolveCssRgb('--color-primary-600', isDark ? 'rgb(54, 126, 196)' : 'rgb(37, 112, 184)');
    const accent = resolveCssRgb('--color-accent-500', isDark ? 'rgb(228, 150, 24)' : 'rgb(214, 162, 48)');
    const success = resolveCssRgb('--color-success-600', isDark ? 'rgb(34, 197, 94)' : 'rgb(38, 138, 98)');
    const warning = resolveCssRgb('--color-warning-600', isDark ? 'rgb(245, 158, 11)' : 'rgb(190, 124, 8)');

    const grid = resolveCssRgb('--color-border', isDark ? 'rgb(33, 45, 66)' : 'rgb(224, 231, 239)');
    const textPrimary = resolveCssRgb('--color-text-primary', isDark ? 'rgb(241, 245, 249)' : 'rgb(24, 34, 50)');
    const textSecondary = resolveCssRgb('--color-text-secondary', isDark ? 'rgb(194, 206, 222)' : 'rgb(67, 81, 104)');
    const textMuted = resolveCssRgb('--color-text-muted', isDark ? 'rgb(150, 166, 188)' : 'rgb(92, 108, 132)');
    const surface = resolveCssRgb('--color-surface-raised', isDark ? 'rgb(24, 34, 54)' : 'rgb(255, 255, 255)');

    return {
      isDark,
      palette,
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
          className: 'font-semibold text-text-primary text-body-sm pb-1 border-b border-border/50',
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
          className: 'w-2.5 h-2.5 rounded-full shrink-0',
          style: { backgroundColor: color },
        }),
        React.createElement(
          'span',
          { className: 'text-text-secondary truncate' },
          name
        )
      ),
      React.createElement(
        'span',
        { className: 'tnum font-semibold text-text-primary shrink-0' },
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
        'bg-surface-raised border border-border rounded-control shadow-float px-3 py-2 text-caption select-none space-y-1.5 z-50',
    },
    children
  );
}

export default useChartTheme;
