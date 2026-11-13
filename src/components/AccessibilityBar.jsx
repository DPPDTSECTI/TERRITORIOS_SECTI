import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Accessibility, Contrast, Keyboard, RotateCcw, X } from 'lucide-react';
import { cn } from '../lib/cn';

export const FONT_SCALES = [
  { id: 'sm', label: 'A-', size: '90%', description: 'Reduzir fonte (90%)' },
  { id: 'md', label: 'A', size: '', description: 'Fonte padrão (100%)' },
  { id: 'lg', label: 'A+', size: '112.5%', description: 'Ampliar fonte (112,5%)' },
  { id: 'xl', label: 'A++', size: '125%', description: 'Fonte extra grande (125%)' },
];

const STORAGE_FONT_KEY = 'secti_a11y_font_scale';
const STORAGE_CONTRAST_KEY = 'secti_a11y_high_contrast';
const STORAGE_VLIBRAS_POS_KEY = 'secti_vlibras_pos';
const SYNC_EVENT = 'secti-a11y-sync';

function readStoredFontScale() {
  try {
    const saved = localStorage.getItem(STORAGE_FONT_KEY);
    return FONT_SCALES.some((s) => s.id === saved) ? saved : 'md';
  } catch {
    return 'md';
  }
}

function readStoredContrast() {
  try {
    return localStorage.getItem(STORAGE_CONTRAST_KEY) === 'true';
  } catch {
    return false;
  }
}

function applyRootPreferences(fontScaleId, highContrast) {
  const scale = FONT_SCALES.find((s) => s.id === fontScaleId) || FONT_SCALES[1];
  document.documentElement.style.fontSize = scale.size;
  document.documentElement.classList.toggle('high-contrast', highContrast);
}

/**
 * Hook sincronizado de preferências eMAG (tamanho de fonte e alto contraste)
 * entre a barra lateral (Sidebar) e os controles da página inicial.
 */
export function useAccessibilityPreferences() {
  const [fontScaleId, setFontScaleState] = useState(readStoredFontScale);
  const [highContrast, setHighContrastState] = useState(readStoredContrast);

  useEffect(() => {
    applyRootPreferences(fontScaleId, highContrast);
  }, [fontScaleId, highContrast]);

  useEffect(() => {
    const handleSync = () => {
      setFontScaleState(readStoredFontScale());
      setHighContrastState(readStoredContrast());
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setFontScaleId = useCallback((nextId) => {
    const valid = FONT_SCALES.some((s) => s.id === nextId) ? nextId : 'md';
    try {
      localStorage.setItem(STORAGE_FONT_KEY, valid);
    } catch {
      // ignora indisponibilidade de storage
    }
    setFontScaleState(valid);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  const decreaseFont = useCallback(() => {
    const idx = FONT_SCALES.findIndex((s) => s.id === fontScaleId);
    if (idx > 0) setFontScaleId(FONT_SCALES[idx - 1].id);
  }, [fontScaleId, setFontScaleId]);

  const increaseFont = useCallback(() => {
    const idx = FONT_SCALES.findIndex((s) => s.id === fontScaleId);
    if (idx >= 0 && idx < FONT_SCALES.length - 1) setFontScaleId(FONT_SCALES[idx + 1].id);
  }, [fontScaleId, setFontScaleId]);

  const setHighContrast = useCallback((updater) => {
    setHighContrastState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : Boolean(updater);
      try {
        localStorage.setItem(STORAGE_CONTRAST_KEY, String(next));
      } catch {
        // ignora indisponibilidade de storage
      }
      setTimeout(() => window.dispatchEvent(new Event(SYNC_EVENT)), 0);
      return next;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, [setHighContrast]);

  const resetPreferences = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_FONT_KEY, 'md');
      localStorage.setItem(STORAGE_CONTRAST_KEY, 'false');
    } catch {
      // ignora indisponibilidade de storage
    }
    setFontScaleState('md');
    setHighContrastState(false);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  const currentIdx = FONT_SCALES.findIndex((s) => s.id === fontScaleId);

  return {
    fontScaleId,
    setFontScaleId,
    decreaseFont,
    increaseFont,
    canDecreaseFont: currentIdx > 0,
    canIncreaseFont: currentIdx < FONT_SCALES.length - 1,
    highContrast,
    setHighContrast,
    toggleHighContrast,
    resetPreferences,
    hasCustomPrefs: fontScaleId !== 'md' || highContrast,
  };
}

function focusFirstMatching(selectors, { makeFocusable = false } = {}) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) continue;
    if (makeFocusable && !el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
    }
    el.focus({ preventScroll: false });
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return true;
  }
  return false;
}

export function jumpToMainContent() {
  return focusFirstMatching(
    ['#main-content', 'main'],
    { makeFocusable: true }
  );
}

export function jumpToNavigation() {
  return focusFirstMatching(
    ['#main-nav a', 'aside nav a', 'nav a', '#main-nav', 'nav'],
    { makeFocusable: true }
  );
}

export function jumpToSearch() {
  return focusFirstMatching([
    'input[type="search"]',
    'input[data-search-input]',
    'input[placeholder*="Buscar" i]',
    'input[placeholder*="Filtrar" i]',
    'input[placeholder*="Pesquisar" i]',
  ]);
}

export function triggerVLibras() {
  if (typeof window.VLibrasWidget?.open === 'function') {
    window.VLibrasWidget.open();
    return true;
  }
  const wrapperHost = document.getElementById('vlibras-access-wrapper');
  const shadowBtn = wrapperHost?.shadowRoot?.getElementById('vlibras-button');
  if (shadowBtn && typeof shadowBtn.click === 'function') {
    shadowBtn.click();
    return true;
  }
  const vwBtn = document.querySelector('div[vw-access-button]');
  if (vwBtn && typeof vwBtn.click === 'function') {
    vwBtn.click();
    return true;
  }
  return false;
}

/**
 * Barra de acessibilidade eMAG global:
 * - Skip links invisíveis até o foco (Alt+1 conteúdo, Alt+2 menu, Alt+3 busca)
 * - Em rotas sem Sidebar (como a Landing `/`), exibe botão flutuante discreto no canto inferior direito.
 * - Nas rotas com Sidebar, os controles de fonte e contraste ficam integrados na barra lateral e o VLibras usa o widget padrão do Gov.br.
 */
export default function AccessibilityBar({ showFloatingButton = false }) {
  const [open, setOpen] = useState(false);
  const {
    fontScaleId,
    setFontScaleId,
    highContrast,
    toggleHighContrast,
    resetPreferences,
    hasCustomPrefs,
  } = useAccessibilityPreferences();

  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  // Posiciona o botão oficial do VLibras (Shadow DOM) no canto superior direito e permite arrastá-lo livremente
  useEffect(() => {
    const VIEWPORT_MARGIN = 12;
    const DEFAULT_TOP = 20;
    const DEFAULT_RIGHT = 20;
    const BTN_SIZE = 40;
    const DRAG_THRESHOLD = 5;

    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    const readSavedPos = () => {
      try {
        const raw = localStorage.getItem(STORAGE_VLIBRAS_POS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      } catch {
        // ignore storage errors
      }
      return null;
    };

    let teardownShadow = null;
    let bodyObserver = null;

    const attachToVLibrasHost = (host) => {
      const shadow = host?.shadowRoot;
      if (!shadow) return false;
      const accessEl = shadow.getElementById('vlibras-access');
      const btnEl = shadow.getElementById('vlibras-button');
      if (!accessEl || !btnEl) return false;

      if (!shadow.getElementById('secti-vlibras-override')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'secti-vlibras-override';
        styleEl.textContent = `
          #vlibras-access {
            top: ${DEFAULT_TOP}px !important;
            right: ${DEFAULT_RIGHT}px !important;
            left: auto !important;
            bottom: auto !important;
            transition: width 0.5s ease !important;
            touch-action: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            cursor: grab !important;
          }
          #vlibras-access.vw-dragging,
          #vlibras-access.vw-dragging #vlibras-button {
            cursor: grabbing !important;
            width: ${BTN_SIZE}px !important;
            transition: none !important;
          }
          #vlibras-access.vw-flip-left {
            flex-direction: row-reverse !important;
          }
          #vlibras-access.vw-flip-left #vlibras-button {
            right: auto !important;
            left: 0 !important;
          }
          #vlibras-button {
            cursor: inherit !important;
          }
          #vlibras-button img,
          #vlibras-popup {
            -webkit-user-drag: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
          }
        `;
        shadow.appendChild(styleEl);
      }

      if (!btnEl.getAttribute('title')) {
        btnEl.setAttribute('title', 'VLibras — Clique para abrir ou arraste para mover');
      }

      const applyButtonCoords = (x, y) => {
        const rect = btnEl.getBoundingClientRect();
        const width = rect.width || BTN_SIZE;
        const height = rect.height || BTN_SIZE;
        const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
        const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);
        const clampedX = Math.round(clamp(x, VIEWPORT_MARGIN, maxX));
        const clampedY = Math.round(clamp(y, VIEWPORT_MARGIN, maxY));

        if (clampedX < 200) {
          accessEl.classList.add('vw-flip-left');
          accessEl.style.setProperty('left', `${clampedX}px`, 'important');
          accessEl.style.setProperty('right', 'auto', 'important');
        } else {
          accessEl.classList.remove('vw-flip-left');
          accessEl.style.setProperty(
            'right',
            `${Math.round(window.innerWidth - clampedX - width)}px`,
            'important'
          );
          accessEl.style.setProperty('left', 'auto', 'important');
        }
        accessEl.style.setProperty('top', `${clampedY}px`, 'important');
        accessEl.style.setProperty('bottom', 'auto', 'important');

        return { x: clampedX, y: clampedY };
      };

      const saved = readSavedPos();
      if (saved) {
        applyButtonCoords(saved.x, saved.y);
      }

      let activePointerId = null;
      let isDragging = false;
      let suppressNextClick = false;
      let suppressTimer = null;
      let startX = 0;
      let startY = 0;
      let originLeft = 0;
      let originTop = 0;
      let lastCoords = saved;

      const handleWindowResize = () => {
        const current = readSavedPos();
        if (current) {
          lastCoords = applyButtonCoords(current.x, current.y);
        }
      };

      const handleDragStart = (e) => {
        e.preventDefault();
      };

      const handleCaptureClick = (e) => {
        if (!suppressNextClick) return;
        suppressNextClick = false;
        if (suppressTimer) {
          clearTimeout(suppressTimer);
          suppressTimer = null;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const cleanupMoveListeners = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };

      function handlePointerMove(e) {
        if (e.pointerId !== activePointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!isDragging) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          isDragging = true;
          accessEl.classList.add('vw-dragging');
        }

        lastCoords = applyButtonCoords(originLeft + dx, originTop + dy);
      }

      function handlePointerUp(e) {
        if (e.pointerId !== activePointerId) return;
        cleanupMoveListeners();
        activePointerId = null;

        if (isDragging) {
          accessEl.classList.remove('vw-dragging');
          isDragging = false;
          suppressNextClick = true;
          suppressTimer = setTimeout(() => {
            suppressNextClick = false;
            suppressTimer = null;
          }, 150);

          if (lastCoords) {
            try {
              localStorage.setItem(STORAGE_VLIBRAS_POS_KEY, JSON.stringify(lastCoords));
            } catch {
              // ignore storage errors
            }
          }
        }
      }

      const handlePointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const btnRect = btnEl.getBoundingClientRect();
        activePointerId = e.pointerId;
        isDragging = false;
        startX = e.clientX;
        startY = e.clientY;
        originLeft = btnRect.left;
        originTop = btnRect.top;

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
      };

      accessEl.addEventListener('pointerdown', handlePointerDown);
      accessEl.addEventListener('dragstart', handleDragStart);
      accessEl.addEventListener('click', handleCaptureClick, true);
      window.addEventListener('resize', handleWindowResize);

      teardownShadow = () => {
        cleanupMoveListeners();
        if (suppressTimer) clearTimeout(suppressTimer);
        accessEl.classList.remove('vw-dragging');
        accessEl.removeEventListener('pointerdown', handlePointerDown);
        accessEl.removeEventListener('dragstart', handleDragStart);
        accessEl.removeEventListener('click', handleCaptureClick, true);
        window.removeEventListener('resize', handleWindowResize);
      };

      return true;
    };

    const existingHost = document.getElementById('vlibras-access-wrapper');
    if (!attachToVLibrasHost(existingHost) && typeof MutationObserver !== 'undefined') {
      bodyObserver = new MutationObserver(() => {
        const host = document.getElementById('vlibras-access-wrapper');
        if (attachToVLibrasHost(host)) {
          bodyObserver?.disconnect();
          bodyObserver = null;
        }
      });
      bodyObserver.observe(document.body, { childList: true });
    }

    return () => {
      bodyObserver?.disconnect();
      teardownShadow?.();
    };
  }, []);

  // Atalhos globais de teclado do padrão eMAG (Alt+1, Alt+2, Alt+3)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === '1') {
        e.preventDefault();
        jumpToMainContent();
      } else if (e.key === '2') {
        e.preventDefault();
        jumpToNavigation();
      } else if (e.key === '3') {
        e.preventDefault();
        jumpToSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (
        panelRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <>
      {/* Skip links eMAG (invisíveis até receberem foco por Tab) */}
      <div
        aria-label="Atalhos de navegação rápida"
        className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-3 focus-within:left-3 focus-within:z-[200] focus-within:flex focus-within:flex-wrap focus-within:gap-2 print:hidden"
      >
        <a
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            jumpToMainContent();
          }}
          className="px-3 py-1.5 rounded-control bg-surface border border-border text-text-primary shadow-float text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Ir para o conteúdo <span className="text-text-muted ml-1">[Alt+1]</span>
        </a>
        <a
          href="#main-nav"
          onClick={(e) => {
            e.preventDefault();
            jumpToNavigation();
          }}
          className="px-3 py-1.5 rounded-control bg-surface border border-border text-text-primary shadow-float text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Ir para o menu <span className="text-text-muted ml-1">[Alt+2]</span>
        </a>
        <a
          href="#busca"
          onClick={(e) => {
            e.preventDefault();
            jumpToSearch();
          }}
          className="px-3 py-1.5 rounded-control bg-surface border border-border text-text-primary shadow-float text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Ir para a busca <span className="text-text-muted ml-1">[Alt+3]</span>
        </a>
      </div>

      {/* Gatilho flutuante exibido apenas quando a Sidebar não está visível (Landing `/`) */}
      {showFloatingButton && (
        <div
          data-html2canvas-ignore="true"
          className="fixed bottom-4 right-4 z-[125] print:hidden select-none"
        >
          {open && (
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Opções de acessibilidade"
              className="absolute bottom-11 right-0 w-72 rounded-panel bg-surface border border-border shadow-float p-3.5 space-y-3 text-text-primary"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <Accessibility className="w-4 h-4 text-primary-600 dark:text-primary-400" strokeWidth={1.75} />
                  <span className="text-xs font-semibold tracking-tight">Acessibilidade (eMAG)</span>
                </div>
                <div className="flex items-center gap-1">
                  {hasCustomPrefs && (
                    <button
                      type="button"
                      onClick={resetPreferences}
                      title="Restaurar padrão"
                      aria-label="Restaurar preferências de acessibilidade"
                      className="p-1 rounded-control text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fechar painel de acessibilidade"
                    className="p-1 rounded-control text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Tamanho da fonte
                </span>
                <div className="grid grid-cols-4 gap-1 bg-surface-soft p-1 rounded-control border border-border/80">
                  {FONT_SCALES.map((scale) => {
                    const active = fontScaleId === scale.id;
                    return (
                      <button
                        key={scale.id}
                        type="button"
                        onClick={() => setFontScaleId(scale.id)}
                        aria-label={scale.description}
                        aria-pressed={active}
                        className={cn(
                          'py-1 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          active
                            ? 'bg-surface text-text-primary shadow-2xs border border-border/80'
                            : 'text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {scale.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleHighContrast}
                aria-pressed={highContrast}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-control border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  highContrast
                    ? 'bg-primary-600/10 border-primary-600/40 text-primary-700 dark:text-primary-300'
                    : 'bg-surface-soft border-border/80 text-text-primary hover:bg-surface-raised'
                )}
              >
                <span className="flex items-center gap-2">
                  <Contrast className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                  Alto contraste
                </span>
                <span className="text-[11px] font-semibold">
                  {highContrast ? 'Ativo' : 'Desativado'}
                </span>
              </button>

              <div className="space-y-1.5 pt-1 border-t border-border/70">
                <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  <Keyboard className="w-3 h-3" /> Atalhos rápidos
                </span>
                <div className="space-y-1 text-[11px] text-text-secondary">
                  <button
                    type="button"
                    onClick={() => {
                      jumpToMainContent();
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-surface-soft text-left"
                  >
                    <span>Conteúdo principal</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-soft border border-border text-[10px] font-mono text-text-primary">
                      Alt+1
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      jumpToNavigation();
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-surface-soft text-left"
                  >
                    <span>Menu de navegação</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-soft border border-border text-[10px] font-mono text-text-primary">
                      Alt+2
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      jumpToSearch();
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-surface-soft text-left"
                  >
                    <span>Campo de busca</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-soft border border-border text-[10px] font-mono text-text-primary">
                      Alt+3
                    </kbd>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerVLibras();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-control bg-surface-soft hover:bg-surface-raised border border-border/80 text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>Intérprete em Libras (VLibras)</span>
                <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400">Abrir</span>
              </button>
            </div>
          )}

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Menu de acessibilidade"
            aria-expanded={open}
            title="Acessibilidade (eMAG)"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center border shadow-xs backdrop-blur-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
              hasCustomPrefs || open
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-surface/90 text-text-secondary hover:text-text-primary border-border/80 hover:bg-surface'
            )}
          >
            <Accessibility className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </>
  );
}
