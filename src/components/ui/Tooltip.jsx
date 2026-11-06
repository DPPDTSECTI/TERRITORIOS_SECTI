import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const positionClasses = {
  top: 'bottom-full inset-x-0 flex justify-center mb-2',
  bottom: 'top-full inset-x-0 flex justify-center mt-2',
  right: 'left-full inset-y-0 flex items-center ml-2',
  left: 'right-full inset-y-0 flex items-center mr-2',
};

const animationVariants = {
  top: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0, transitionEnd: { transform: 'none' } }, exit: { opacity: 0, y: 4 } },
  bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0, transitionEnd: { transform: 'none' } }, exit: { opacity: 0, y: -4 } },
  right: { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0, transitionEnd: { transform: 'none' } }, exit: { opacity: 0, x: -4 } },
  left: { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0, transitionEnd: { transform: 'none' } }, exit: { opacity: 0, x: 4 } },
};

/**
 * Componente de dica flutuante contextual (Tooltip) com delay customizável.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.content - Conteúdo textual ou elemento da dica
 * @param {'top'|'bottom'|'right'|'left'} [props.side='top'] - Direção de posicionamento
 * @param {number} [props.delay=300] - Tempo de espera em ms antes de exibir
 * @param {string} [props.className] - Classes customizadas para o balão
 * @param {React.ReactNode} props.children - Elemento gatilho
 */
export function Tooltip({
  content,
  side = 'top',
  delay = 300,
  className,
  children,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content) return children;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <div
            className={cn(
              'absolute z-[120] pointer-events-none select-none',
              positionClasses[side] || positionClasses.top
            )}
          >
            <motion.div
              role="tooltip"
              initial={animationVariants[side]?.initial || animationVariants.top.initial}
              animate={animationVariants[side]?.animate || animationVariants.top.animate}
              exit={animationVariants[side]?.exit || animationVariants.top.exit}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'bg-neutral-900 text-white dark:bg-surface-raised dark:text-text-primary text-caption px-2.5 py-1.5 rounded-control shadow-float border border-border whitespace-nowrap font-medium',
                className
              )}
            >
              {content}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Tooltip;
