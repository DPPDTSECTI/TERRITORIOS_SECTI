import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Cabeçalho de seção para cartões, tabelas e módulos internos.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.title - Título da seção
 * @param {React.ReactNode} [props.subtitle] - Descrição ou subtítulo complementar
 * @param {React.ElementType|React.ReactNode} [props.icon] - Ícone temático da seção
 * @param {React.ReactNode} [props.actions] - Ações, botões ou controles à direita
 * @param {string} [props.className] - Classes customizadas
 */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    return <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {Icon && <div className="mt-0.5 shrink-0">{renderIcon()}</div>}
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-subtitle font-semibold text-text-primary tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-caption text-text-muted leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
