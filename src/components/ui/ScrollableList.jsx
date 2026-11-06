import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Container de lista rolável com botão flutuante no canto superior
 * para voltar suavemente ao início da lista quando o usuário rolar para baixo.
 */
export const ScrollableList = forwardRef(function ScrollableList(
    {
        children,
        className = 'flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2.5 min-h-0 w-full pb-2',
        threshold = 120,
        filtroSemiarido = false,
        resetKey,
        ...rest
    },
    forwardedRef
) {
    const internalRef = useRef(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const setRefs = useCallback(
        (node) => {
            internalRef.current = node;
            if (typeof forwardedRef === 'function') {
                forwardedRef(node);
            } else if (forwardedRef && typeof forwardedRef === 'object') {
                forwardedRef.current = node;
            }
        },
        [forwardedRef]
    );

    const handleScroll = useCallback(
        (e) => {
            const top = e.currentTarget.scrollTop;
            const shouldShow = top > threshold;
            setShowScrollTop((prev) => (prev !== shouldShow ? shouldShow : prev));
            if (rest.onScroll) {
                rest.onScroll(e);
            }
        },
        [threshold, rest]
    );

    useEffect(() => {
        if (internalRef.current) {
            setShowScrollTop(internalRef.current.scrollTop > threshold);
        } else {
            setShowScrollTop(false);
        }
    }, [resetKey, threshold]);

    const scrollToTop = useCallback((e) => {
        e.stopPropagation();
        if (internalRef.current) {
            internalRef.current.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    }, []);

    return (
        <div className="relative flex-1 flex flex-col min-h-0 w-full overflow-hidden">
            {/* Botão flutuante no canto superior da lista */}
            <div
                className={`absolute top-2.5 right-4 z-20 transition-all duration-150 ease-out ${
                    showScrollTop
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
            >
                <button
                    type="button"
                    onClick={scrollToTop}
                    aria-label="Voltar ao início da lista"
                    title="Voltar ao início da lista"
                    className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md border shadow-xs transition-all duration-150 ease-out active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${
                        filtroSemiarido
                            ? 'bg-white/95 dark:bg-zinc-900/95 border-amber-300/90 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/70 hover:border-amber-400 focus-visible:ring-amber-500/25'
                            : 'bg-white/95 dark:bg-zinc-900/95 border-zinc-200/90 dark:border-zinc-700/90 text-primary-600 dark:text-primary-400 hover:bg-primary-50/90 dark:hover:bg-zinc-800 hover:border-primary-300 dark:hover:border-primary-700 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-zinc-100/20'
                    }`}
                >
                    <ArrowUp className="w-4 h-4 stroke-[2.2] shrink-0" />
                </button>
            </div>

            <div
                {...rest}
                ref={setRefs}
                onScroll={handleScroll}
                className={className}
            >
                {children}
            </div>
        </div>
    );
});

