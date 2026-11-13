import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
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
 * Caixa de diálogo modal acessível (Radix Dialog) com foco gerenciado, portal e backdrop animado.
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
  return (
    <RadixDialog.Root
      open={Boolean(open)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.();
      }}
    >
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
              />
            </RadixDialog.Overlay>

            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
              <RadixDialog.Content
                asChild
                forceMount
                aria-describedby={description ? undefined : undefined}
                onEscapeKeyDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transitionEnd: { transform: 'none' } }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'pointer-events-auto relative w-full bg-surface border border-border rounded-panel shadow-float z-10 flex flex-col focus:outline-none overflow-hidden my-auto',
                    dialogSizes[size] || dialogSizes.md,
                    className
                  )}
                >
                  {!title && <RadixDialog.Title className="sr-only">Diálogo</RadixDialog.Title>}
                  {!description && <RadixDialog.Description className="sr-only">Conteúdo da caixa de diálogo</RadixDialog.Description>}

                  {(title || onClose) && (
                    <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border/70">
                      <div className="space-y-1 min-w-0 pr-6">
                        {title && (
                          <RadixDialog.Title className="text-title font-semibold text-text-primary tracking-tight">
                            {title}
                          </RadixDialog.Title>
                        )}
                        {description && (
                          <RadixDialog.Description className="text-body-sm text-text-muted leading-relaxed">
                            {description}
                          </RadixDialog.Description>
                        )}
                      </div>

                      {onClose && (
                        <RadixDialog.Close asChild>
                          <IconButton
                            aria-label="Fechar diálogo"
                            size="sm"
                            className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
                          >
                            <X className="w-4 h-4" />
                          </IconButton>
                        </RadixDialog.Close>
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
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

export default Dialog;
