import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/cn';

/**
 * Componente de dica flutuante contextual (Radix Tooltip) com portal, colisão e delay customizável.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.content - Conteúdo textual ou elemento da dica
 * @param {'top'|'bottom'|'right'|'left'} [props.side='top'] - Direção de posicionamento
 * @param {number} [props.delay=300] - Tempo de espera em ms antes de exibir
 * @param {string} [props.className] - Classes customizadas para o balão
 * @param {React.ReactNode} props.children - Elemento gatilho
 */
export function Tooltip({
  content,
  side = 'top',
  delay = 300,
  className,
  children,
}) {
  if (!content) return children;

  const triggerNode = React.isValidElement(children) ? (
    <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
  ) : (
    <RadixTooltip.Trigger asChild>
      <span tabIndex={0} className="inline-flex items-center">
        {children}
      </span>
    </RadixTooltip.Trigger>
  );

  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        {triggerNode}
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className={cn(
              'z-[120] select-none bg-neutral-900 text-white dark:bg-surface-raised dark:text-text-primary text-caption px-2.5 py-1.5 rounded-control shadow-float border border-border whitespace-nowrap font-medium',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              className
            )}
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

export default Tooltip;
