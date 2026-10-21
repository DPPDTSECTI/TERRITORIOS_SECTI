import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const cardVariants = {
  default: 'bg-surface border border-border/60 rounded-card shadow-card',
  interactive:
    'bg-surface border border-border/60 rounded-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-border cursor-pointer',
  sunken: 'bg-surface-sunken border border-border/50 rounded-subcard',
  subcard: 'bg-surface-soft border border-neutral-200/70 dark:border-neutral-700/60 rounded-subcard p-4',
  brand: 'bg-gradient-brand text-white border border-primary-500/40 rounded-card shadow-kpi-blue',
};

/**
 * Componente de container Card para agrupamento visual e estrutural.
 *
 * @component
 * @param {object} props
 * @param {'default'|'interactive'|'sunken'|'brand'} [props.variant='default'] - Variante visual do card
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {React.ReactNode} props.children - Conteúdo interno
 * @param {React.ElementType} [props.as='div'] - Tag HTML a ser renderizada
 */
export const Card = forwardRef(function Card(
  { variant = 'default', className, as: Component = 'div', children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn(cardVariants[variant] || cardVariants.default, className)}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

/**
 * Cabeçalho do Card com borda inferior sutil e espaçamento padrão.
 *
 * @component
 * @param {object} props
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {React.ReactNode} props.children - Conteúdo do cabeçalho
 */
Card.Header = forwardRef(function CardHeader({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.Header.displayName = 'Card.Header';

/**
 * Corpo de conteúdo do Card com preenchimento interno padronizado.
 *
 * @component
 * @param {object} props
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {React.ReactNode} props.children - Conteúdo do corpo
 */
Card.Body = forwardRef(function CardBody({ className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cn('p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  );
});

Card.Body.displayName = 'Card.Body';

export default Card;
