import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const sizes = {
  sm: 'h-8 text-caption px-2.5',
  md: 'h-9 text-body-sm px-3.5',
};

/**
 * Controle segmentado para seleção exclusiva entre 2 ou mais opções.
 *
 * @component
 * @param {object} props
 * @param {Array<{ value: string|number, label: React.ReactNode, icon?: React.ReactNode }>} props.options - Lista de opções
 * @param {string|number} props.value - Valor selecionado atual
 * @param {(val: string|number) => void} props.onChange - Callback de alteração
 * @param {'sm'|'md'} [props.size='md'] - Tamanho do controle
 * @param {string} [props.layoutId] - Identificador de animação no framer-motion
 * @param {string} [props.className] - Classes CSS customizadas
 */
export function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  layoutId,
  className,
}) {
  const generatedId = useId();
  const activeLayoutId = layoutId || `segmented-indicator-${generatedId}`;

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      onChange?.(options[nextIndex].value);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.length) % options.length;
      onChange?.(options[prevIndex].value);
    }
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 rounded-full border border-border/80 select-none overflow-x-auto max-w-full shadow-xs',
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            role="radio"
            type="button"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange?.(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative inline-flex items-center justify-center gap-2 font-medium transition-colors duration-120 whitespace-nowrap rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              sizes[size] || sizes.md,
              isSelected
                ? 'text-white dark:text-neutral-950 font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 bg-carbon dark:bg-white shadow-xs rounded-full pointer-events-none"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-1.5">
              {option.icon && <span className="inline-flex shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
