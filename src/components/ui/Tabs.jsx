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
          : 'inline-flex items-center gap-1 p-1 bg-surface-sunken rounded-control border border-border/70 overflow-x-auto max-w-full',
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
                : 'px-2.5 py-1.5 rounded-control text-caption',
              isActive
                ? isUnderline
                  ? 'text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-text-primary font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                className={cn(
                  'pointer-events-none',
                  isUnderline
                    ? 'absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full'
                    : 'absolute inset-0 bg-surface rounded-[8px] shadow-xs border border-border/40'
                )}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-1">
              {item.icon && <span className="inline-flex shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {item.count !== undefined && item.count !== null && (
                <span
                  className={cn(
                    'tnum text-caption px-1.5 py-0.5 rounded-full leading-none shrink-0',
                    isActive
                      ? isUnderline
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200'
                        : 'bg-surface-sunken text-text-primary'
                      : 'bg-surface-sunken/80 text-text-muted border border-border/40'
                  )}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
