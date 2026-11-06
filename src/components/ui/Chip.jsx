import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const badgeVariants = {
  neutral:
    'bg-surface-soft text-text-secondary border border-border dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700/60',
  primary:
    'bg-[#DBEAFE] text-[#1D4ED8] dark:bg-primary-500/15 dark:text-primary-300 border border-[#BFDBFE] dark:border-primary-500/30',
  success:
    'bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-300 border border-[#BBF7D0] dark:border-emerald-500/30',
  warning:
    'bg-[#FEF3C7] text-[#B45309] dark:bg-amber-500/15 dark:text-amber-300 border border-[#FDE68A] dark:border-amber-500/30',
  accent:
    'bg-[#FEF3C7] text-[#B45309] dark:bg-amber-500/15 dark:text-amber-300 border border-[#FDE68A] dark:border-amber-500/30',
  danger:
    'bg-[#FEE2E2] text-[#B91C1C] dark:bg-rose-500/15 dark:text-rose-300 border border-[#FECACA] dark:border-rose-500/30',
};

const chipUnselectedVariants = {
  neutral: 'bg-surface border-border text-text-secondary hover:border-border-strong hover:text-text-primary',
  primary: 'bg-surface border-border text-text-secondary hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-400',
  success: 'bg-surface border-border text-text-secondary hover:border-success-500 hover:text-success-700 dark:hover:text-success-400',
  warning: 'border-amber-300/70 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 shadow-xs',
  accent: 'border-amber-300/70 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 shadow-xs',
  danger: 'bg-surface border-border text-text-secondary hover:border-danger-500 hover:text-danger-700 dark:hover:text-danger-400',
};

const chipSelectedVariants = {
  neutral: 'bg-surface-raised border-border-strong text-text-primary font-medium shadow-xs',
  primary:
    'bg-primary-50 text-primary-700 border-primary-500 font-medium dark:bg-primary-950 dark:text-primary-300 dark:border-primary-400 shadow-xs',
  success:
    'bg-success-50 text-success-700 border-success-600 font-medium dark:bg-success-950 dark:text-success-300 dark:border-success-500 shadow-xs',
  warning:
    'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold border-amber-500 dark:border-amber-600 shadow-xs',
  accent:
    'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold border-amber-500 dark:border-amber-600 shadow-xs',
  danger:
    'bg-danger-50 text-danger-700 border-danger-600 font-medium dark:bg-danger-950 dark:text-danger-300 dark:border-danger-500 shadow-xs',
};

/**
 * Indicador visual compacto para status, categorias ou tags informativas.
 *
 * @component
 * @param {object} props
 * @param {'neutral'|'primary'|'success'|'warning'|'accent'|'danger'} [props.variant='neutral'] - Variante cromática
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {React.ReactNode} [props.icon] - Ícone à esquerda
 * @param {React.ReactNode} props.children - Conteúdo do badge
 */
export const Badge = forwardRef(function Badge(
  { variant = 'neutral', icon, className, children, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        'text-caption font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 border leading-none shrink-0 select-none',
        badgeVariants[variant] || badgeVariants.neutral,
        className
      )}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
});

Badge.displayName = 'Badge';

/**
 * Chip de seleção ou filtro interativo com suporte a contador tabular e ícone.
 *
 * @component
 * @param {object} props
 * @param {'neutral'|'primary'|'success'|'warning'|'accent'|'danger'} [props.variant='primary'] - Variante cromática
 * @param {boolean} [props.selected=false] - Se o chip está ativo/selecionado
 * @param {number|string} [props.count] - Contador numérico tabular (renderizado em pill)
 * @param {React.ReactNode} [props.icon] - Ícone no início do chip
 * @param {function} [props.onClick] - Função de clique
 * @param {boolean} [props.disabled=false] - Desativa o chip
 * @param {string} [props.className] - Classes customizadas
 * @param {React.ReactNode} props.children - Texto do chip
 */
export const Chip = forwardRef(function Chip(
  {
    variant = 'primary',
    selected = false,
    size = 'md',
    count,
    icon,
    onClick,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const isInteractive = Boolean(onClick);
  const Component = isInteractive ? 'button' : 'span';

  const sizeClass = size === 'sm' ? 'h-7 px-2.5 text-caption' : 'h-9 px-3 text-caption';

  const variantClass = selected
    ? chipSelectedVariants[variant] || chipSelectedVariants.primary
    : chipUnselectedVariants[variant] || chipUnselectedVariants.primary;

  return (
    <Component
      ref={ref}
      type={isInteractive ? 'button' : undefined}
      disabled={isInteractive ? disabled : undefined}
      onClick={disabled ? undefined : onClick}
      aria-pressed={isInteractive ? selected : undefined}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-control border select-none transition-all duration-120 shrink-0 leading-none',
        sizeClass,
        variantClass,
        isInteractive &&
        'cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </Component>
  );
});

Chip.displayName = 'Chip';

export default Chip;
