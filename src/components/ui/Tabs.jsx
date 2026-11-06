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
  isSemiarido = false,
  accent,
  trailing,
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
  const isAmber = isSemiarido || accent === 'amber';

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        isUnderline
          ? 'flex items-center gap-2 border-b border-border w-full overflow-x-auto scrollbar-none'
          : 'h-9 inline-flex items-center gap-1 p-1 bg-surface-soft dark:bg-surface-raised rounded-full border border-border max-w-full shadow-xs shrink-0 transition-colors duration-200',
        isAmber && !isUnderline && 'border-amber-300/70 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30',
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
              'relative h-full inline-flex items-center justify-center gap-2 font-medium transition-colors duration-120 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              isUnderline
                ? 'px-3.5 py-2.5 text-caption -mb-px'
                : 'px-3.5 rounded-full text-caption',
              isActive
                ? isUnderline
                  ? (isAmber ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-primary-700 dark:text-primary-300 font-semibold')
                  : 'text-white font-semibold'
                : (isAmber
                    ? 'text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 rounded-full'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft dark:hover:bg-surface-raised/70 rounded-full')
            )}
          >
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                className={cn(
                  'pointer-events-none',
                  isUnderline
                    ? (isAmber ? 'absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full' : 'absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full')
                    : (isAmber
                        ? 'absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-full shadow-xs'
                        : 'absolute inset-0 bg-carbon dark:bg-primary-600 rounded-full shadow-xs')
                )}
                transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.8 }}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-1">
              {item.icon && <span className="inline-flex shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          </button>
        );
      })}

      {trailing && (
        <>
          <div
            aria-hidden="true"
            className={cn(
              'w-[1px] h-4 mx-0.5 shrink-0 select-none pointer-events-none',
              isAmber ? 'bg-amber-300/70 dark:bg-amber-700/60' : 'bg-border dark:bg-zinc-700'
            )}
          />
          {trailing}
        </>
      )}
    </div>
  );
}

export default Tabs;
