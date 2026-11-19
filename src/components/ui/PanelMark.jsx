import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Marca oficial do Painel Territorial CT&I usando o ícone original (/img/favicon-96x96.webp).
 */
export function PanelMark({ className, 'aria-hidden': ariaHidden = true, alt = 'Painel Territorial CT&I' }) {
  return (
    <img
      src="/img/favicon-96x96.webp"
      alt={ariaHidden ? '' : alt}
      aria-hidden={ariaHidden}
      className={cn('shrink-0 select-none object-contain', className)}
    />
  );
}

export default PanelMark;

