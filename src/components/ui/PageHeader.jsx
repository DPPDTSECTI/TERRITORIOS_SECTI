import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Cabeçalho principal para páginas e módulos da aplicação.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.title - Título principal da página
 * @param {React.ReactNode} [props.subtitle] - Descrição contextual
 * @param {React.ReactNode} [props.badge] - Badge ou tag de identificação ao lado do título
 * @param {React.ReactNode} [props.actions] - Ações primárias e filtros à direita
 * @param {string} [props.className] - Classes CSS customizadas
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-headline font-bold text-text-primary tracking-tight">
            {title}
          </h1>
          {badge && <div className="inline-flex shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <p className="text-body-sm text-text-secondary max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
