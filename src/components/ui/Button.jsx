import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const buttonBaseClass =
  'rounded-control font-medium inline-flex items-center justify-center gap-2 transition-all duration-120 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none';

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs',
  secondary: 'bg-surface hover:bg-surface-soft text-text-primary border border-border shadow-xs',
  ghost: 'bg-transparent hover:bg-surface-soft text-text-secondary hover:text-text-primary',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white shadow-xs',
};

const buttonSizes = {
  sm: 'h-8 px-3 text-caption',
  md: 'h-9 px-4 text-body-sm',
  lg: 'h-11 px-5 text-body',
};

const iconButtonSizes = {
  sm: 'w-8 h-8 text-caption p-0',
  md: 'w-9 h-9 text-body-sm p-0',
  lg: 'w-11 h-11 text-body p-0',
};

function Spinner({ className }) {
  return (
    <svg
      className={cn('animate-spin text-current', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Componente de botão institucional com variantes, tamanhos e suporte a ícones.
 *
 * @component
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant='primary'] - Variante cromática do botão
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Escala e altura do botão
 * @param {React.ReactNode} [props.iconLeft] - Ícone à esquerda do texto
 * @param {React.ReactNode} [props.iconRight] - Ícone à direita do texto
 * @param {boolean} [props.loading=false] - Indica estado de carregamento com spinner
 * @param {boolean} [props.disabled=false] - Desabilita a interação com o botão
 * @param {string} [props.className] - Classes CSS customizadas
 * @param {React.ReactNode} props.children - Conteúdo / rótulo do botão
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    loading = false,
    disabled = false,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonBaseClass,
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || buttonSizes.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : (
        iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
      )}

      {children && <span>{children}</span>}

      {!loading && iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
    </button>
  );
});

Button.displayName = 'Button';

/**
 * Botão compacto quadrado para uso exclusivo com ícones.
 * Exige a propriedade `aria-label` para acessibilidade.
 *
 * @component
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant='ghost'] - Variante visual
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamanho quadrado do botão
 * @param {string} props['aria-label'] - Rótulo acessível obrigatório
 * @param {React.ReactNode} [props.icon] - Ícone alternativo se children não for passado
 * @param {boolean} [props.loading=false] - Exibe spinner no lugar do ícone
 * @param {boolean} [props.disabled=false] - Desativa o botão
 * @param {string} [props.className] - Classes adicionais
 * @param {React.ReactNode} [props.children] - Ícone renderizado no centro
 */
export const IconButton = forwardRef(function IconButton(
  {
    variant = 'ghost',
    size = 'md',
    'aria-label': ariaLabel,
    label,
    icon,
    loading = false,
    disabled = false,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const resolvedAriaLabel = ariaLabel || label;
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      aria-label={resolvedAriaLabel}
      title={props.title || resolvedAriaLabel}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonBaseClass,
        buttonVariants[variant] || buttonVariants.ghost,
        iconButtonSizes[size] || iconButtonSizes.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : (
        children || icon
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default Button;
