import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

/**
 * Painel deslizante lateral (Drawer) posicionado à direita da tela.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open - Controla a abertura do painel
 * @param {() => void} props.onClose - Função chamada ao solicitar o fechamento
 * @param {React.ReactNode} [props.title] - Título superior do painel
 * @param {React.ReactNode} [props.subtitle] - Subtítulo ou descrição contextual
 * @param {React.ReactNode} props.children - Conteúdo interno do painel
 * @param {React.ReactNode} [props.footer] - Rodapé de ações fixo
 * @param {string} [props.width='max-w-lg'] - Largura máxima do painel (ex: 'max-w-md', 'max-w-lg', 'max-w-xl')
 * @param {string} [props.className] - Classes customizadas
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg',
  className,
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    drawerRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] overflow-hidden"
        >
          {/* Overlay escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Painel lateral direito */}
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={cn(
              'fixed inset-y-0 right-0 z-[110] w-full bg-surface border-l border-border shadow-float flex flex-col focus:outline-none',
              width,
              className
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border/70">
                <div className="space-y-1 min-w-0 pr-6">
                  {title && (
                    <h2 className="text-title font-semibold text-text-primary tracking-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-body-sm text-text-muted leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>

                {onClose && (
                  <IconButton
                    aria-label="Fechar painel lateral"
                    onClick={onClose}
                    size="sm"
                    className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </IconButton>
                )}
              </div>
            )}

            <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
              {children}
            </div>

            {footer && (
              <div className="p-4 sm:p-5 bg-surface-soft border-t border-border/70 flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
