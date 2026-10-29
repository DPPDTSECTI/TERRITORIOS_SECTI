import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Menu dropdown suspenso com navegação por teclado e suporte a divisores e ações destrutivas.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.trigger - Elemento que dispara a abertura do menu
 * @param {Array<{ label?: React.ReactNode, icon?: React.ElementType|React.ReactNode, onClick?: () => void, disabled?: boolean, danger?: boolean, divider?: boolean }>} props.items - Itens do menu
 * @param {'right'|'left'} [props.align='right'] - Alinhamento horizontal do menu
 * @param {string} [props.className] - Classes customizadas para o menu
 */
export function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // Filtrar itens selecionáveis
  const selectableIndices = items
    .map((item, idx) => (!item.divider && !item.disabled ? idx : null))
    .filter((idx) => idx !== null);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    setFocusedIndex(-1);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeMenu();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const currentPos = selectableIndices.indexOf(prev);
          const nextPos = (currentPos + 1) % selectableIndices.length;
          return selectableIndices[nextPos];
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const currentPos = selectableIndices.indexOf(prev);
          const nextPos = (currentPos - 1 + selectableIndices.length) % selectableIndices.length;
          return selectableIndices[nextPos];
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectableIndices]);

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const renderIcon = (icon) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4 shrink-0 text-current opacity-80" />;
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <div onClick={toggleOpen} className="inline-flex cursor-pointer select-none">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'absolute top-full mt-1.5 min-w-[240px] w-max max-w-[320px] rounded-2xl bg-surface border border-border shadow-float p-1.5 z-[120] focus:outline-none',
              align === 'left' ? 'left-0' : 'right-0',
              className
            )}
          >
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`div-${index}`} className="my-1 border-t border-border/70" />;
              }

              const isDanger = item.danger;
              const isDisabled = item.disabled;

              return (
                <button
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  role="menuitem"
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    item.onClick?.();
                    closeMenu();
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-body-sm flex items-center gap-2.5 transition-colors duration-120 select-none cursor-pointer focus:outline-none focus:bg-surface-soft',
                    isDanger
                      ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 focus:bg-danger-50 dark:focus:bg-danger-950/40'
                      : 'text-text-primary hover:bg-surface-soft',
                    isDisabled && 'opacity-40 pointer-events-none'
                  )}
                >
                  {renderIcon(item.icon)}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dropdown;
