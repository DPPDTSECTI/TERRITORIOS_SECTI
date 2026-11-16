import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useId
} from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { normalize } from '../../utils/normalization';

const IGNORED_SEARCH_VALUES = new Set(['', '-', 'nao informado', 'nao identificado', 'outros', 'geral']);

function getNormalizedCharMap(text) {
  const cleanChars = [];
  const origIndices = [];
  let prevWasSpace = true;

  for (let i = 0; i < text.length; i += 1) {
    const decomposed = text[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    for (let j = 0; j < decomposed.length; j += 1) {
      const ch = decomposed[j];
      const isAlnum = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
      if (isAlnum) {
        cleanChars.push(ch);
        origIndices.push(i);
        prevWasSpace = false;
      } else if (!prevWasSpace) {
        cleanChars.push(' ');
        origIndices.push(i);
        prevWasSpace = true;
      }
    }
  }

  return {
    cleanStr: cleanChars.join('').trimEnd(),
    origIndices
  };
}

function splitHighlightMatch(text, query) {
  const safeText = String(text || '');
  const normQuery = normalize(query);
  if (!safeText || !normQuery) return [{ text: safeText, match: false }];

  const { cleanStr, origIndices } = getNormalizedCharMap(safeText);
  const matchIdx = cleanStr.indexOf(normQuery);
  if (matchIdx === -1) return [{ text: safeText, match: false }];

  const startOrig = origIndices[matchIdx];
  const lastNormIdx = matchIdx + normQuery.length - 1;
  let endOrig = origIndices[lastNormIdx] + 1;
  // Inclui eventuais marcas combinantes logo após o último caractere base
  while (
    endOrig < safeText.length &&
    /[\u0300-\u036f]/.test(safeText[endOrig].normalize('NFD'))
  ) {
    endOrig += 1;
  }

  const segments = [];
  if (startOrig > 0) segments.push({ text: safeText.slice(0, startOrig), match: false });
  segments.push({ text: safeText.slice(startOrig, endOrig), match: true });
  if (endOrig < safeText.length) segments.push({ text: safeText.slice(endOrig), match: false });
  return segments;
}

function normalizeSuggestionItem(raw) {
  if (typeof raw === 'string') {
    const clean = raw.trim();
    return clean
      ? { label: clean, value: clean, category: null, subtitle: null, count: null, priority: 0 }
      : null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const label = String(raw.label ?? raw.value ?? '').trim();
  const value = String(raw.value ?? raw.label ?? '').trim();
  if (!label || !value) return null;
  return {
    label,
    value,
    category: raw.category || null,
    subtitle: raw.subtitle || null,
    count: raw.count ?? null,
    priority: raw.priority ?? 0
  };
}

function deduplicateSuggestions(items) {
  const seen = new Set();
  const result = [];
  items.forEach((raw) => {
    const item = normalizeSuggestionItem(raw);
    if (!item) return;
    const key = `${normalize(item.value)}::${normalize(item.label)}::${normalize(item.category || '')}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });
  return result;
}

function rankSearchSuggestions(items, rawQuery, maxSuggestions = 8) {
  const normQuery = normalize(rawQuery);
  if (!normQuery) return [];
  const tokens = normQuery.split(' ').filter(Boolean);

  const scored = [];
  items.forEach((item) => {
    const normLabel = normalize(item.label);
    const normValue = normalize(item.value);
    const normSub = normalize(item.subtitle || '');
    const normCat = normalize(item.category || '');
    const words = `${normLabel} ${normValue}`.split(' ').filter(Boolean);

    let score = 0;
    if (normLabel === normQuery || normValue === normQuery) {
      score = 120;
    } else if (normLabel.startsWith(normQuery) || normValue.startsWith(normQuery)) {
      score = 100;
    } else if (words.some((w) => w.startsWith(normQuery))) {
      score = 80;
    } else if (normLabel.includes(normQuery) || normValue.includes(normQuery)) {
      score = 60;
    } else if (
      tokens.length > 1 &&
      tokens.every((t) => `${normLabel} ${normValue} ${normSub} ${normCat}`.includes(t))
    ) {
      score = 50;
    } else if (normSub.includes(normQuery) || normCat.includes(normQuery)) {
      score = 35;
    }

    if (score > 0) {
      scored.push({ ...item, score });
    }
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
    if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
    return a.label.length - b.label.length;
  });

  return scored.slice(0, maxSuggestions);
}

function resolveRecommendations(rawRecommendations, uniqueSuggestions, limit = 6) {
  if (rawRecommendations && rawRecommendations.length > 0) {
    return deduplicateSuggestions(rawRecommendations).slice(0, limit);
  }
  if (!uniqueSuggestions || uniqueSuggestions.length === 0) return [];

  // Distribui recomendações entre diferentes categorias para variedade
  const buckets = new Map();
  uniqueSuggestions.forEach((item) => {
    const cat = item.category || 'Geral';
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat).push(item);
  });

  const picked = [];
  const usedValues = new Set();
  let round = 0;
  while (picked.length < limit && round < 5) {
    let addedInRound = false;
    for (const list of buckets.values()) {
      if (round < list.length && picked.length < limit) {
        const candidate = list[round];
        const key = normalize(candidate.value);
        if (!usedValues.has(key)) {
          usedValues.add(key);
          picked.push(candidate);
          addedInRound = true;
        }
      }
    }
    if (!addedInRound) break;
    round += 1;
  }
  return picked;
}

function addCountedEntry(map, rawLabel, meta) {
  const label = String(rawLabel ?? '').trim();
  const key = normalize(label);
  if (!label || IGNORED_SEARCH_VALUES.has(key)) return;

  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
    return;
  }
  map.set(key, {
    label,
    value: label,
    category: meta.category || null,
    subtitle: meta.subtitle || null,
    count: 1,
    priority: meta.priority ?? 0
  });
}

/**
 * Constrói listas deduplicadas de sugestões e recomendações a partir de registros do domínio.
 *
 * @param {Array} rows - Coleção base de registros
 * @param {object} [config]
 * @param {Array} [config.facets] - Facetas agrupadas ({ category, getValue, getValues, priority, recommendationLimit })
 * @param {object} [config.itemExtractor] - Extrator opcional de registros individuais ({ category, getLabel, getValue, getSubtitle, aggregate, priority, maxItems })
 * @param {number} [config.maxRecommendations=6] - Limite máximo de recomendações rápidas
 * @returns {{ suggestions: Array, recommendations: Array }}
 */
export function buildEntitySearchData(rows = [], { facets = [], itemExtractor = null, maxRecommendations = 6 } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { suggestions: [], recommendations: [] };
  }

  const facetMaps = facets.map(() => new Map());
  const itemMap = new Map();
  const itemList = [];
  const itemSeen = new Set();
  const maxItems = itemExtractor?.maxItems ?? 600;

  rows.forEach((row) => {
    facets.forEach((facet, idx) => {
      const vals = facet.getValues ? facet.getValues(row) : [facet.getValue?.(row)];
      (vals || []).forEach((v) => {
        addCountedEntry(facetMaps[idx], v, {
          category: facet.category,
          priority: facet.priority ?? 10
        });
      });
    });

    if (itemExtractor) {
      const label = String(itemExtractor.getLabel?.(row) ?? '').trim();
      const value = String((itemExtractor.getValue ? itemExtractor.getValue(row) : label) ?? '').trim();
      const key = normalize(value || label);
      if (!label || IGNORED_SEARCH_VALUES.has(key)) return;

      if (itemExtractor.aggregate) {
        addCountedEntry(itemMap, label, {
          category: itemExtractor.category,
          subtitle: itemExtractor.getSubtitle?.(row) || null,
          priority: itemExtractor.priority ?? 2
        });
      } else if (!itemSeen.has(key) && itemList.length < maxItems) {
        itemSeen.add(key);
        itemList.push({
          label,
          value,
          category: itemExtractor.category || null,
          subtitle: itemExtractor.getSubtitle?.(row) || null,
          count: null,
          priority: itemExtractor.priority ?? 1
        });
      }
    }
  });

  const sortedFacets = facetMaps.map((m) =>
    Array.from(m.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
  );

  const aggregatedItems = itemExtractor?.aggregate
    ? Array.from(itemMap.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
        .slice(0, maxItems)
    : itemList;

  const suggestions = [...sortedFacets.flat(), ...aggregatedItems];

  const recommendations = [];
  const recUsed = new Set();
  sortedFacets.forEach((list, idx) => {
    const limit = facets[idx]?.recommendationLimit ?? 2;
    for (let i = 0; i < list.length && i < limit && recommendations.length < maxRecommendations; i += 1) {
      const k = normalize(list[i].value);
      if (!recUsed.has(k)) {
        recUsed.add(k);
        recommendations.push(list[i]);
      }
    }
  });

  if (recommendations.length < maxRecommendations) {
    for (let i = 0; i < aggregatedItems.length && recommendations.length < maxRecommendations; i += 1) {
      const k = normalize(aggregatedItems[i].value);
      if (!recUsed.has(k)) {
        recUsed.add(k);
        recommendations.push(aggregatedItems[i]);
      }
    }
  }

  return { suggestions, recommendations };
}

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
 * Campo de busca com autocompletar, recomendações contextuais, botão para limpar e atalho '/'.
 *
 * @component
 * @param {object} props
 * @param {string} [props.value] - Valor do input (se controlado)
 * @param {function} [props.onChange] - Callback de alteração
 * @param {function} [props.onClear] - Callback executado ao clicar no botão de limpar
 * @param {Array} [props.suggestions] - Sugestões para autocompletar e busca preditiva
 * @param {Array} [props.recommendations] - Recomendações exibidas quando o campo está focado e vazio
 * @param {function} [props.onSelectSuggestion] - Callback executado ao escolher sugestão/recomendação
 * @param {number} [props.maxSuggestions=5] - Limite máximo de sugestões exibidas
 * @param {boolean} [props.enableShortcut=false] - Habilita focar o campo ao pressionar '/'
 * @param {string} [props.placeholder='Buscar...'] - Placeholder textual
 * @param {string} [props.className] - Classes do input
 * @param {string} [props.containerClassName] - Classes adicionais no container relativo
 */
export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    suggestions = [],
    recommendations = [],
    onSelectSuggestion,
    maxSuggestions = 5,
    enableShortcut = false,
    placeholder = 'Buscar...',
    className,
    containerClassName,
    disabled = false,
    size: _size,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  },
  ref
) {
  const internalRef = useRef(null);
  const containerRef = useRef(null);
  const listboxId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useImperativeHandle(ref, () => internalRef.current);

  const currentValue = value !== undefined ? String(value ?? '') : String(internalRef.current?.value ?? '');
  const trimmedQuery = currentValue.trim();
  const hasValue = Boolean(currentValue);

  const uniqueSuggestions = useMemo(() => deduplicateSuggestions(suggestions), [suggestions]);
  const resolvedRecommendations = useMemo(
    () => resolveRecommendations(recommendations, uniqueSuggestions, 6),
    [recommendations, uniqueSuggestions]
  );

  const rankedSuggestions = useMemo(
    () => rankSearchSuggestions(uniqueSuggestions, trimmedQuery, maxSuggestions),
    [uniqueSuggestions, trimmedQuery, maxSuggestions]
  );

  // Candidato de autocompletar inline quando há prefixo correspondente
  const inlineCompletion = useMemo(() => {
    if (trimmedQuery.length < 2 || rankedSuggestions.length === 0) return null;
    const normQuery = normalize(trimmedQuery);
    const match = rankedSuggestions.find((item) => {
      const nv = normalize(item.value);
      const nl = normalize(item.label);
      return (nv.startsWith(normQuery) && nv.length > normQuery.length) ||
        (nl.startsWith(normQuery) && nl.length > normQuery.length);
    });
    if (!match) return null;
    const targetValue = match.value || match.label;
    if (normalize(targetValue) === normQuery) return null;
    return { item: match, targetValue };
  }, [trimmedQuery, rankedSuggestions]);

  const hasDropdownContent = trimmedQuery.length > 0 && rankedSuggestions.length > 0;

  useEffect(() => {
    if (!enableShortcut) return;

    const handleGlobalKeyDown = (e) => {
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

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableShortcut]);

  // Fecha o popover ao clicar ou tocar fora (compatível com touch em telão)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isOpen]);

  const handleSelectItem = useCallback((item, { closeMenu = true, keepFocus = false } = {}) => {
    if (!item) return;
    const nextValue = item.value || item.label;

    if (internalRef.current && value === undefined) {
      internalRef.current.value = nextValue;
    }

    if (onChange) {
      onChange({ target: { value: nextValue } });
    }
    if (onSelectSuggestion) {
      onSelectSuggestion(nextValue, item);
    }

    setHighlightedIndex(-1);
    if (closeMenu) {
      setIsOpen(false);
    }
    if (keepFocus) {
      internalRef.current?.focus();
    }
  }, [onChange, onSelectSuggestion, value]);

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
    setHighlightedIndex(-1);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setHighlightedIndex(-1);
    if (uniqueSuggestions.length > 0) {
      setIsOpen(Boolean(e.target.value.trim()));
    }
    if (onChange) onChange(e);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Tab' && inlineCompletion && isOpen) {
      e.preventDefault();
      handleSelectItem(inlineCompletion.item, { closeMenu: false, keepFocus: true });
    } else if (e.key === 'ArrowDown' && rankedSuggestions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev + 1) % rankedSuggestions.length);
    } else if (e.key === 'ArrowUp' && rankedSuggestions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev <= 0 ? rankedSuggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && isOpen && highlightedIndex >= 0 && rankedSuggestions[highlightedIndex]) {
      e.preventDefault();
      handleSelectItem(rankedSuggestions[highlightedIndex], { closeMenu: true });
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }

    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div ref={containerRef} className={cn('relative flex items-center w-full', containerClassName)}>
      <Search
        className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none shrink-0 z-10"
        aria-hidden="true"
      />

      <input
        ref={internalRef}
        type="search"
        value={value}
        onChange={handleInputChange}
        onFocus={(e) => {
          if (!disabled && trimmedQuery.length > 0 && uniqueSuggestions.length > 0) {
            setIsOpen(true);
          }
          if (onFocus) onFocus(e);
        }}
        onClick={() => {
          if (!disabled && trimmedQuery.length > 0 && uniqueSuggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onBlur={(e) => {
          // Fecha apenas quando o foco sai de dentro do container
          const related = e.relatedTarget;
          if (!related || !containerRef.current?.contains(related)) {
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          if (onBlur) onBlur(e);
        }}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={Boolean(isOpen && hasDropdownContent)}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={cn(
          'h-9 pl-9 pr-9 rounded-control bg-surface border border-border text-body-sm text-text-primary placeholder:text-text-muted transition-colors duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none w-full [&::-webkit-search-cancel-button]:hidden',
          className
        )}
        {...props}
      />

      <div className="absolute right-2.5 flex items-center gap-1 z-10">
        {hasValue && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            aria-label="Limpar busca"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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

      {/* POPOVER MINIMALISTA DE SUGESTÕES */}
      {isOpen && !disabled && hasDropdownContent && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-[120] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-1.5"
        >
          <div className="max-h-[240px] overflow-y-auto flex flex-col gap-0.5">
            {rankedSuggestions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const segments = splitHighlightMatch(item.label, trimmedQuery);

              return (
                <button
                  key={`${item.value}-${item.category || 'item'}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectItem(item, { closeMenu: true });
                  }}
                  className={cn(
                    'w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between gap-2 transition-colors duration-120 cursor-pointer',
                    isHighlighted
                      ? 'bg-zinc-100/80 dark:bg-zinc-800/80'
                      : 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                    {segments.map((seg, segIdx) =>
                      seg.match ? (
                        <span
                          key={segIdx}
                          className="font-semibold text-zinc-950 dark:text-zinc-50"
                        >
                          {seg.text}
                        </span>
                      ) : (
                        <span key={segIdx}>{seg.text}</span>
                      )
                    )}
                  </span>

                  {item.category && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                      {item.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
