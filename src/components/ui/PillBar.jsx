import React from 'react';

/**
 * Componente de barra de progresso em pílulas proporcionais (SECTI Design System).
 * Exibe contagem, trilha restante proporcional e percentual com animação suave de
 * carregamento estilo "filling/charging" com escalonamento (staggered waterfall).
 */
export function PillBar({
  value = 0,
  totalScoped = 1,
  remaining = null,
  percent = 0,
  color,
  negPillStyle = 'bg-surface-soft text-text-secondary border border-border',
  totalPillStyle = 'bg-surface-soft text-text-primary border border-border',
  index = 0,
  valueTitle,
  percentTitle,
  className = '',
}) {
  const numValue = Number(value || 0);
  const numTotal = Number(totalScoped || numValue || 1);
  const rem = remaining !== null ? Math.max(0, Number(remaining)) : Math.max(0, numTotal - numValue);
  const minW = rem > 0 ? '44px' : 'auto';
  const delayMs = `${Math.min(index * 35, 450)}ms`;

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      {/* PÍLULA COLORIDA (VALOR/CONTAGEM) */}
      <div
        className="h-[28px] rounded-full flex items-center justify-center px-2.5 text-white overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap animate-pill-bar transition-[background-color] duration-300"
        style={{
          flexGrow: numValue,
          flexBasis: 0,
          backgroundColor: color,
          minWidth: minW,
          '--bar-grow': numValue,
          '--bar-min-w': rem > 0 ? '44px' : '0px',
          '--bar-delay': delayMs,
        }}
        title={valueTitle}
      >
        <span className="text-caption font-semibold tabular-nums leading-none whitespace-nowrap">
          {numValue}
        </span>
      </div>

      {/* PÍLULA DE ESPAÇO RESTANTE */}
      {rem > 0 && (
        <div
          className={`h-[28px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap animate-pill-track transition-[background-color] duration-300`}
          style={{
            flexGrow: rem,
            flexBasis: 0,
            '--track-grow': rem,
            '--total-scoped': numTotal,
            '--bar-delay': delayMs,
          }}
        />
      )}

      {/* PÍLULA DE PERCENTUAL */}
      <div
        className={`h-[28px] min-w-[54px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs animate-pill-badge`}
        style={{
          '--bar-delay': delayMs,
        }}
        title={percentTitle}
      >
        <span className="text-caption font-semibold tabular-nums leading-none">
          {typeof percent === 'number' ? `${percent}%` : percent}
        </span>
      </div>
    </div>
  );
}

export default PillBar;

