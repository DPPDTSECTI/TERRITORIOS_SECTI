import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Estado vazio para listas sem dados, filtros sem resultados ou ausência de registros.
 *
 * @component
 * @param {object} props
 * @param {React.ElementType|React.ReactNode} [props.icon] - Ícone central
 * @param {React.ReactNode} props.title - Título do estado
 * @param {React.ReactNode} [props.description] - Mensagem explicativa ou instrução
 * @param {React.ReactNode} [props.action] - Botão ou ação de recuperação (ex: limpar filtros)
 * @param {string} [props.className] - Classes CSS customizadas
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nenhum resultado encontrado',
  description,
  action,
  className,
}) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    return <Icon className="w-6 h-6 text-text-muted" aria-hidden="true" />;
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-card bg-surface border border-dashed border-border',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-surface-sunken flex items-center justify-center mb-3.5 border border-border/60">
        {renderIcon()}
      </div>

      <h3 className="text-subtitle font-semibold text-text-primary mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-body-sm text-text-muted max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default EmptyState;
