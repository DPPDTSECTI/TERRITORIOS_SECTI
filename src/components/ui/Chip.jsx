import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const badgeVariants = {
  neutral:
    'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20 dark:border-zinc-500/20',
  primary:
    'bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-500/20 dark:border-primary-500/30',
  brand:
    'bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-500/20 dark:border-primary-500/30',
  success:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30',
  warning:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30',
  accent:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30',
  danger:
    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30',
};

const badgeDots = {
  neutral: 'bg-zinc-400 dark:bg-zinc-500',
  primary: 'bg-primary-600 dark:bg-primary-400',
  brand: 'bg-primary-600 dark:bg-primary-400',
  success: 'bg-emerald-600 dark:bg-emerald-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
  accent: 'bg-amber-600 dark:bg-amber-400',
  danger: 'bg-rose-600 dark:bg-rose-400',
};

const chipUnselectedVariants = {
  neutral: 'bg-surface border-border text-text-secondary hover:border-border-strong hover:text-text-primary',
  primary: 'bg-surface border-border text-text-secondary hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-400',
  success: 'bg-surface border-border text-text-secondary hover:border-success-500 hover:text-success-700 dark:hover:text-success-400',
  warning: 'bg-surface border-border text-text-secondary hover:border-warning-500 hover:text-warning-700 dark:hover:text-warning-400',
  accent: 'bg-surface border-border text-text-secondary hover:border-accent-500 hover:text-accent-700 dark:hover:text-accent-400',
  danger: 'bg-surface border-border text-text-secondary hover:border-danger-500 hover:text-danger-700 dark:hover:text-danger-400',
};

const chipSelectedVariants = {
  neutral: 'bg-surface-raised border-border-strong text-text-primary font-medium shadow-xs',
  primary:
    'bg-primary-50 text-primary-700 border-primary-500 font-medium dark:bg-primary-950 dark:text-primary-300 dark:border-primary-400 shadow-xs',
  success:
    'bg-success-50 text-success-700 border-success-600 font-medium dark:bg-success-950 dark:text-success-300 dark:border-success-500 shadow-xs',
  warning:
    'bg-warning-50 text-warning-700 border-warning-600 font-medium dark:bg-warning-950 dark:text-warning-300 dark:border-warning-500 shadow-xs',
  accent:
    'bg-accent-50 text-accent-700 border-accent-600 font-medium dark:bg-accent-950 dark:text-accent-300 dark:border-accent-500 shadow-xs',
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
  { variant = 'neutral', icon, dot = false, className, children, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        'text-caption font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 border leading-none shrink-0 select-none tracking-tight',
        badgeVariants[variant] || badgeVariants.neutral,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            badgeDots[variant] || badgeDots.neutral
          )}
          aria-hidden="true"
        />
      )}
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
