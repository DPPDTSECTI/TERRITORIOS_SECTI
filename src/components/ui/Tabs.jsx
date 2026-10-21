import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Componente acessível de abas com indicador ativo animado via framer-motion.
 *
 * @component
 * @param {object} props
 * @param {Array<{ id: string, label: React.ReactNode, icon?: React.ReactNode, count?: number|string }>} props.items - Itens das abas
 * @param {string} props.value - ID da aba ativa
 * @param {(id: string) => void} props.onChange - Callback acionado ao alternar de aba
 * @param {'pill'|'underline'} [props.variant='pill'] - Estilo visual das abas
 * @param {string} [props.layoutId] - ID do framer-motion layoutId
 * @param {string} [props.className] - Classes CSS adicionais para o container
 */
export function Tabs({
  items = [],
  value,
  onChange,
  variant = 'pill',
  layoutId,
  className,
}) {
  const generatedId = useId();
  const activeLayoutId = layoutId || `tabs-indicator-${generatedId}`;

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      onChange?.(items[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      onChange?.(items[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange?.(items[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange?.(items[items.length - 1].id);
    }
  };

  const isUnderline = variant === 'underline';

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        isUnderline
          ? 'flex items-center gap-2 border-b border-border w-full overflow-x-auto scrollbar-none'
          : 'inline-flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 rounded-full border border-border/80 overflow-x-auto max-w-full shadow-xs',
        className
      )}
    >
      {items.map((item, index) => {
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange?.(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative inline-flex items-center gap-2 font-medium transition-colors duration-120 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              isUnderline
                ? 'px-3.5 py-2.5 text-caption -mb-px'
                : 'px-3.5 py-1.5 rounded-full text-caption',
              isActive
                ? isUnderline
                  ? 'text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-white dark:text-neutral-950 font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                className={cn(
                  'pointer-events-none',
                  isUnderline
                    ? 'absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full'
                    : 'absolute inset-0 bg-carbon dark:bg-white rounded-full shadow-xs'
                )}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-1">
              {item.icon && <span className="inline-flex shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
