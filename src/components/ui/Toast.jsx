import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

const ToastContext = createContext({
  toast: () => {},
  dismiss: () => {},
});

const variantStyles = {
  default: {
    icon: Info,
    iconClass: 'text-primary-600 dark:text-primary-400',
    borderClass: 'border-border',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success-600 dark:text-success-400',
    borderClass: 'border-success-500/50',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning-600 dark:text-warning-400',
    borderClass: 'border-warning-500/50',
  },
  danger: {
    icon: AlertCircle,
    iconClass: 'text-danger-600 dark:text-danger-400',
    borderClass: 'border-danger-500/50',
  },
};

/**
 * Provedor de notificações Toast com animações suaves e pilha no canto inferior direito.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[130] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const config = variantStyles[t.variant] || variantStyles.default;
            const Icon = config.icon;

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'pointer-events-auto p-4 bg-surface border rounded-card shadow-float flex items-start gap-3 w-full',
                  config.borderClass
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClass)} />

                <div className="flex-1 min-w-0 space-y-0.5">
                  {t.title && (
                    <h4 className="text-body-sm font-semibold text-text-primary leading-tight">
                      {t.title}
                    </h4>
                  )}
                  {t.description && (
                    <p className="text-caption text-text-muted leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Fechar notificação"
                  className="p-1 -mr-1 text-text-muted hover:text-text-primary rounded-control transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook para disparar notificações Toast.
 *
 * @returns {{ toast: (options: { title: string, description?: string, variant?: 'default'|'success'|'warning'|'danger', duration?: number }) => string, dismiss: (id: string) => void }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
}

export default ToastProvider;
