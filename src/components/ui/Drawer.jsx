import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

/**
 * Painel deslizante lateral (Drawer) acessível (Radix Dialog) posicionado à direita da tela.
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
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content
              asChild
              forceMount
              onEscapeKeyDown={(e) => {
                e.stopPropagation();
              }}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0, transitionEnd: { transform: 'none' } }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className={cn(
                  'fixed inset-y-0 right-0 z-[110] w-full bg-surface border-l border-border shadow-float flex flex-col focus:outline-none',
                  width,
                  className
                )}
              >
                {!title && <RadixDialog.Title className="sr-only">Painel lateral</RadixDialog.Title>}
                {!subtitle && <RadixDialog.Description className="sr-only">Detalhes e ações do painel lateral</RadixDialog.Description>}

                {(title || onClose) && (
                  <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-border/70">
                    <div className="space-y-1 min-w-0 pr-6">
                      {title && (
                        <RadixDialog.Title className="text-title font-semibold text-text-primary tracking-tight">
                          {title}
                        </RadixDialog.Title>
                      )}
                      {subtitle && (
                        <RadixDialog.Description className="text-body-sm text-text-muted leading-relaxed">
                          {subtitle}
                        </RadixDialog.Description>
                      )}
                    </div>

                    {onClose && (
                      <RadixDialog.Close asChild>
                        <IconButton
                          aria-label="Fechar painel lateral"
                          size="sm"
                          className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </RadixDialog.Close>
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
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

export default Drawer;
