import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
};

const animationVariants = {
  top: { initial: { opacity: 0, y: 4, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 4, scale: 0.95 } },
  bottom: { initial: { opacity: 0, y: -4, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -4, scale: 0.95 } },
  right: { initial: { opacity: 0, x: -4, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -4, scale: 0.95 } },
  left: { initial: { opacity: 0, x: 4, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 4, scale: 0.95 } },
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
          <motion.div
            role="tooltip"
            initial={animationVariants[side]?.initial || animationVariants.top.initial}
            animate={animationVariants[side]?.animate || animationVariants.top.animate}
            exit={animationVariants[side]?.exit || animationVariants.top.exit}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute bg-neutral-900 text-white dark:bg-surface-raised dark:text-text-primary text-caption px-2.5 py-1.5 rounded-control shadow-float border border-border z-[120] whitespace-nowrap pointer-events-none select-none font-medium',
              positionClasses[side] || positionClasses.top,
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Tooltip;
