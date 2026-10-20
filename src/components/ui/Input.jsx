import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Campo de texto padrão com suporte a estados de erro e desabilitação.
 *
 * @component
 * @param {object} props
 * @param {boolean} [props.error=false] - Indica estado de erro visual
 * @param {boolean} [props.disabled=false] - Desabilita a entrada
 * @param {string} [props.className] - Classes customizadas
 */
export const Input = forwardRef(function Input(
  { className, type = 'text', error = false, disabled = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'h-9 px-3 rounded-control bg-surface border border-border text-body-sm text-text-primary placeholder:text-text-muted transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none w-full',
        error && 'border-danger-600 focus-visible:ring-danger-600',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

/**
 * Campo de busca com ícone de lupa, botão para limpar e suporte a atalho de teclado '/'.
 *
 * @component
 * @param {object} props
 * @param {string} [props.value] - Valor do input (se controlado)
 * @param {function} [props.onChange] - Callback de alteração
 * @param {function} [props.onClear] - Callback executado ao clicar no botão de limpar
 * @param {boolean} [props.enableShortcut=false] - Habilita focar o campo ao pressionar '/'
 * @param {string} [props.placeholder='Buscar...'] - Placeholder textual
 * @param {string} [props.className] - Classes do container ou input
 * @param {string} [props.containerClassName] - Classes adicionais no container relativo
 */
export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    enableShortcut = false,
    placeholder = 'Buscar...',
    className,
    containerClassName,
    disabled = false,
    ...props
  },
  ref
) {
  const internalRef = useRef(null);

  useImperativeHandle(ref, () => internalRef.current);

  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        const isEditing =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable);

        if (!isEditing) {
          e.preventDefault();
          internalRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut]);

  const hasValue = value !== undefined ? Boolean(value) : Boolean(internalRef.current?.value);

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }

    if (internalRef.current) {
      internalRef.current.value = '';
      internalRef.current.focus();
    }
  };

  return (
    <div className={cn('relative flex items-center w-full', containerClassName)}>
      <Search
        className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none shrink-0"
        aria-hidden="true"
      />

      <input
        ref={internalRef}
        type="search"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'h-9 pl-9 pr-9 rounded-control bg-surface border border-border text-body-sm text-text-primary placeholder:text-text-muted transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none w-full [&::-webkit-search-cancel-button]:hidden',
          className
        )}
        {...props}
      />

      <div className="absolute right-2.5 flex items-center gap-1">
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar busca"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {!hasValue && enableShortcut && !disabled && (
          <kbd
            className="hidden sm:inline-flex text-caption text-text-muted px-1.5 py-0.5 rounded bg-surface-sunken border border-border/80 font-mono select-none pointer-events-none leading-none"
            title="Pressione / para buscar"
          >
            /
          </kbd>
        )}
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

/**
 * Seletor customizado com a mesma identidade visual e seta indicadora.
 *
 * @component
 * @param {object} props
 * @param {string} [props.className] - Classes para o elemento select
 * @param {string} [props.containerClassName] - Classes para o container envolvente
 * @param {boolean} [props.error=false] - Indica estado de erro
 * @param {boolean} [props.disabled=false] - Desabilita a interação
 * @param {React.ReactNode} props.children - Opções <option> ou <optgroup>
 */
export const Select = forwardRef(function Select(
  { className, containerClassName, error = false, disabled = false, children, ...props },
  ref
) {
  return (
    <div className={cn('relative flex items-center w-full', containerClassName)}>
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          'h-9 pl-3 pr-8 rounded-control bg-surface border border-border text-body-sm text-text-primary appearance-none transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none w-full cursor-pointer',
          error && 'border-danger-600 focus-visible:ring-danger-600',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="absolute right-2.5 w-4 h-4 text-text-secondary pointer-events-none shrink-0"
        aria-hidden="true"
      />
    </div>
  );
});

Select.displayName = 'Select';

export default Input;
