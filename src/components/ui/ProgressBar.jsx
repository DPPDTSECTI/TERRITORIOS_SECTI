import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { formatPercent } from '../../lib/format';

const barSizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4 text-caption',
};

/**
 * Barra de progresso visual acessível com animação via framer-motion.
 *
 * @component
 * @param {object} props
 * @param {number} props.value - Valor numérico atual
 * @param {number} [props.max=100] - Valor máximo de referência
 * @param {string} [props.colorClass='bg-primary-600'] - Cor da barra de preenchimento
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Espessura da barra
 * @param {boolean} [props.showValue=false] - Se exibe percentual à direita ou no topo
 * @param {string} [props.label] - Rótulo acessível opcional
 * @param {string} [props.className] - Classes customizadas
 */
export function ProgressBar({
  value = 0,
  max = 100,
  colorClass = 'bg-primary-600',
  size = 'md',
  showValue = false,
  label,
  className,
}) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = Math.min(Math.max((value / (max || 1)) * 100, 0), 100);

  return (
    <div className={cn('w-full space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-caption text-text-secondary">
          {label && <span className="font-medium">{label}</span>}
          {showValue && (
            <span className="tnum font-semibold text-text-primary ml-auto">
              {formatPercent(percentage, 0)}
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn(
          'w-full bg-surface-sunken border border-border/60 rounded-full overflow-hidden',
          barSizes[size] || barSizes.md
        )}
      >
        <motion.div
          className={cn('h-full rounded-full transition-colors', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 300, damping: 30, duration: 0.6 }
          }
        />
      </div>
    </div>
  );
}

export default ProgressBar;
