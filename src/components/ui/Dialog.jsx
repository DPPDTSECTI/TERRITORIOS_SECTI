import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

const dialogSizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Caixa de diálogo modal com bloqueio de scroll, controle de foco e backdrop animado.
 *
 * @component
 * @param {object} props
 * @param {boolean} props.open - Estado de visibilidade do diálogo
 * @param {() => void} props.onClose - Callback de fechamento
 * @param {React.ReactNode} [props.title] - Título do diálogo
 * @param {React.ReactNode} [props.description] - Descrição acessível ou subtítulo
 * @param {React.ReactNode} props.children - Conteúdo do corpo do diálogo
 * @param {React.ReactNode} [props.footer] - Rodapé de ações (ex: botões Cancelar/Confirmar)
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Largura máxima do modal
 * @param {string} [props.className] - Classes customizadas
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) {
  const dialogRef = useRef(null);

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

    // Foca o diálogo na montagem
    dialogRef.current?.focus();

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
          aria-labelledby={title ? 'dialog-title' : undefined}
          aria-describedby={description ? 'dialog-description' : undefined}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop escuro com blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Painel do modal */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-surface border border-border rounded-panel shadow-float z-10 flex flex-col focus:outline-none overflow-hidden my-auto',
              dialogSizes[size] || dialogSizes.md,
              className
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border/70">
                <div className="space-y-1 min-w-0 pr-6">
                  {title && (
                    <h2 id="dialog-title" className="text-title font-semibold text-text-primary tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="dialog-description" className="text-body-sm text-text-muted leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>

                {onClose && (
                  <IconButton
                    aria-label="Fechar diálogo"
                    onClick={onClose}
                    size="sm"
                    className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </IconButton>
                )}
              </div>
            )}

            <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 bg-surface-soft border-t border-border/70">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Dialog;
