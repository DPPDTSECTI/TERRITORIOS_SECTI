import React, { useState } from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Menu dropdown suspenso acessível (Radix DropdownMenu) com navegação por teclado e suporte a divisores e ações destrutivas.
 *
 * @component
 * @param {object} props
 * @param {React.ReactNode} props.trigger - Elemento que dispara a abertura do menu
 * @param {Array<{ label?: React.ReactNode, icon?: React.ElementType|React.ReactNode, onClick?: () => void, disabled?: boolean, danger?: boolean, divider?: boolean }>} props.items - Itens do menu
 * @param {'right'|'left'} [props.align='right'] - Alinhamento horizontal do menu
 * @param {string} [props.className] - Classes customizadas para o menu
 */
export function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className,
}) {
  const [open, setOpen] = useState(false);

  const renderIcon = (icon) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4 shrink-0 text-current opacity-80" />;
  };

  return (
    <RadixDropdown.Root open={open} onOpenChange={setOpen} modal={false}>
      {React.isValidElement(trigger) ? (
        <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      ) : (
        <RadixDropdown.Trigger asChild>
          <button type="button" className="inline-flex cursor-pointer select-none">
            {trigger}
          </button>
        </RadixDropdown.Trigger>
      )}

      <AnimatePresence>
        {open && (
          <RadixDropdown.Portal forceMount>
            <RadixDropdown.Content
              asChild
              forceMount
              align={align === 'left' ? 'start' : 'end'}
              sideOffset={6}
              collisionPadding={12}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0, transitionEnd: { transform: 'none' } }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className={cn(
                  'min-w-[240px] w-max max-w-[320px] rounded-2xl bg-surface border border-border shadow-float p-1.5 z-[120] focus:outline-none',
                  className
                )}
              >
                {items.map((item, index) => {
                  if (item.divider) {
                    return <RadixDropdown.Separator key={`div-${index}`} className="my-1 border-t border-border/70" />;
                  }

                  const isDanger = item.danger;
                  const isDisabled = item.disabled;

                  return (
                    <RadixDropdown.Item
                      key={index}
                      disabled={isDisabled}
                      onSelect={() => {
                        if (isDisabled) return;
                        item.onClick?.();
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-xl text-body-sm flex items-center gap-2.5 transition-colors duration-120 select-none cursor-pointer focus:outline-none',
                        isDanger
                          ? 'text-danger-600 data-[highlighted]:bg-danger-50 dark:data-[highlighted]:bg-danger-950/40 hover:bg-danger-50 dark:hover:bg-danger-950/40'
                          : 'text-text-primary data-[highlighted]:bg-surface-soft hover:bg-surface-soft',
                        isDisabled && 'opacity-40 pointer-events-none'
                      )}
                    >
                      {renderIcon(item.icon)}
                      <span className="truncate">{item.label}</span>
                    </RadixDropdown.Item>
                  );
                })}
              </motion.div>
            </RadixDropdown.Content>
          </RadixDropdown.Portal>
        )}
      </AnimatePresence>
    </RadixDropdown.Root>
  );
}

export default Dropdown;
