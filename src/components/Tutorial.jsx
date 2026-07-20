import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, MousePointer2, MapPin, Filter, Search, BarChart3, Database, Target, Maximize2, Sun as SunIcon, RefreshCw, GraduationCap, Info, Layers, Plus, List } from 'lucide-react';

// ==========================================
// TUTORIAL STEPS DEFINITION
// ==========================================
const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Painel Territorial!',
        description: 'Este tutorial interativo vai guiá-lo pelas principais funcionalidades da plataforma. Você aprenderá a navegar pelo mapa, filtrar dados e explorar os indicadores dos Territórios de Identidade da Bahia.',
        icon: <Sparkles size={28} />,
        position: 'center',
        targetSelector: null,
    },
    {
        id: 'kpis',
        title: 'Indicadores Globais (KPIs)',
        description: 'No topo da página, os cards de KPIs apresentam um panorama geral: Estruturas de CT&I, Desenvolvimento Territorial (IFDM), municípios do Semiárido, Cursos Superiores e Cadeias Produtivas. Cada card mostra o valor atual e uma barra de progresso relativa.',
        icon: <BarChart3 size={28} />,
        position: 'below',
        targetSelector: '[data-tutorial="kpis"]',
    },
    {
        id: 'kpi-info',
        title: 'Fonte dos Dados (Ícone de Informação)',
        description: 'No canto superior direito de cada card de KPI, você encontrará o ícone de informação (ⓘ). Ao passar o mouse sobre ele, uma caixa flutuante exibirá a fonte oficial das informações (como INEP, IBGE, FIRJAN ou DataSebrae) com link direto para consulta.',
        icon: <Info size={28} />,
        position: 'below',
        targetSelector: '[data-tutorial="kpis"]',
    },
    {
        id: 'cti-panel',
        title: 'Painel de Ativos CT&I',
        description: 'À esquerda do mapa, o painel vertical mostra os sub-indicadores de CT&I: campi de universidades públicas e privadas, institutos federais, ICTs, centros de pesquisa, espaços dinamizadores, parques tecnológicos e incubadoras. Clique em cada item para filtrá-lo no mapa.',
        icon: <Database size={28} />,
        position: 'right',
        targetSelector: '[data-tutorial="cti-panel"]',
    },
    {
        id: 'map',
        title: 'Mapa Interativo',
        description: 'O mapa central exibe os 27 Territórios de Identidade da Bahia. Passe o mouse sobre um território para ver estatísticas resumidas. Clique em um território para filtrar todos os dados da página por aquela região.',
        icon: <MapPin size={28} />,
        position: 'right',
        targetSelector: '[data-tutorial="map"]',
    },
    {
        id: 'map-interact',
        title: 'Interagindo com o Mapa',
        description: 'Você pode arrastar o mapa para navegar e usar o scroll do mouse para ampliar ou reduzir. Ao selecionar um território, os KPIs e listas são filtrados automaticamente, e a lista de municípios do território aparece ao lado do mapa.',
        icon: <MousePointer2 size={28} />,
        position: 'right',
        targetSelector: '[data-tutorial="map"]',
    },
    {
        id: 'courses',
        title: 'Cursos CT&I — Filtragem por Área',
        description: 'Na lista de Cursos, use a barra de busca e o botão de filtro por Área Geral (Engenharias, Saúde, Tecnologia, etc.) para encontrar cursos específicos. Cada área tem um ícone e cor próprios para fácil identificação.',
        icon: <GraduationCap size={28} />,
        position: 'above',
        targetSelector: '[data-tutorial="cursos-card"]',
    },
    {
        id: 'lists',
        title: 'Listas Detalhadas',
        description: 'À direita do mapa, três listas mostram: Estruturas CT&I (instituições de pesquisa), Cadeias Produtivas (APLs e Indicações Geográficas), e Cursos CT&I (cursos superiores). Cada item pode ser clicado para abrir uma ficha detalhada.',
        icon: <Layers size={28} />,
        position: 'left',
        targetSelector: '[data-tutorial="lists"]',
    },
    {
        id: 'expanded-lists',
        title: 'Modo Expandido',
        description: 'Ao clicar no ícone de expandir (↗) em qualquer lista, ela será aberta em tela cheia com mais detalhes. Isso proporciona uma visão ampla das informações daquela categoria.',
        icon: <Maximize2 size={28} />,
        position: 'left',
        targetSelector: '[data-tutorial="expand-button"]',
    },
    {
        id: 'add-lists',
        title: 'Adicionar Novas Listas',
        description: 'No modo expandido, clique no botão flutuante (+), localizado no canto lateral do painel.',
        icon: <Plus size={28} />,
        position: 'left',
        targetSelector: '[data-tutorial="add-list-button"]',
    },
    {
        id: 'add-lists-dropdown',
        title: 'Escolher a Lista',
        description: 'No menu que se abre, você pode escolher incluir até 3 listas simultaneamente (Estruturas CT&I, Cadeias Produtivas ou Cursos) para comparar os dados lado a lado. Após escolher uma lista, adicione ela.',
        icon: <List size={28} />,
        position: 'left',
        targetSelector: '[data-tutorial="add-list-dropdown"]',
    },
    {
        id: 'added-list',
        title: 'Lista Adicionada!',
        description: 'Pronto! A lista foi adicionada e você pode comparar as informações lado a lado. Para remover uma lista, basta clicar no ícone da lixeira no cabeçalho dela.',
        icon: <Sparkles size={28} />,
        position: 'right',
        targetSelector: '[data-tutorial="expanded-lists-grid"]',
    },
    {
        id: 'search',
        title: 'Pesquisa Global',
        description: 'Na barra lateral direita (desktop) ou no topo (mobile), use o ícone de lupa (🔍) para pesquisar territórios, municípios, instituições ou cursos e encontrá-los rapidamente.',
        icon: <Search size={28} />,
        position: 'left',
        targetSelector: '[data-tutorial="search-button"]',
    },
    {
        id: 'filters',
        title: 'Filtros Avançados',
        description: 'Clique no botão "Filtros" na barra lateral para abrir o painel completo. Aqui você pode: ativar o recorte do Semiárido, definir intervalos de IFDM, filtrar tipos de ativos CT&I, e selecionar cadeias produtivas por segmento (APL e IG).',
        icon: <Filter size={28} />,
        position: 'left',
        targetSelector: '[data-tutorial="filter-button"]',
    },
    {
        id: 'finish',
        title: 'Você está pronto!',
        description: 'Agora você conhece todas as funcionalidades do Painel Territorial. Explore os dados, aplique filtros e descubra informações valiosas sobre a ciência, tecnologia e inovação nos Territórios de Identidade da Bahia. Bom uso! 🎉',
        icon: <Sparkles size={28} />,
        position: 'center',
        targetSelector: null,
    },
];

// ==========================================
// TUTORIAL COMPONENT
// ==========================================
export default function Tutorial({ isOpen, onClose, darkMode, onDeselectLocation, onCloseDetails, onOpenExpandedList, onOpenAddListDropdown, onCloseAddListDropdown, onForceAddList }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const tooltipRef = useRef(null);
    const step = TUTORIAL_STEPS[currentStep];
    const totalSteps = TUTORIAL_STEPS.length;

    // Manage UI states based on active step changes
    useEffect(() => {
        if (isOpen) {
            // Automatically deselect territory when entering Step 6 (cti-panel)
            if (step.id === 'cti-panel' && onDeselectLocation) {
                onDeselectLocation();
            }
            // Automatically open an expanded list when entering Step 10/11
            if ((step.id === 'add-lists' || step.id === 'add-lists-dropdown') && onOpenExpandedList) {
                onOpenExpandedList();
            }
            // Automatically open dropdown
            if (step.id === 'add-lists-dropdown' && onOpenAddListDropdown) {
                onOpenAddListDropdown();
            }
            // Close dropdown if not in dropdown step
            if (step.id !== 'add-lists-dropdown' && onCloseAddListDropdown) {
                onCloseAddListDropdown();
            }
            // Ensure at least one list is added for the added-list step
            if (step.id === 'added-list' && onForceAddList) {
                onForceAddList();
            }
            // Close expanded lists if we navigate away from the expanded list steps
            if ((step.id === 'expanded-lists' || step.id === 'search' || step.id === 'filters' || step.id === 'finish') && onCloseDetails) {
                onCloseDetails();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentStep]);

    // Find and highlight target element with real-time tracking
    useEffect(() => {
        if (!isOpen) return;

        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 350);

        let animFrameId;

        const updateRect = () => {
            let selector = step.targetSelector;

            if (step.id === 'lists' && document.querySelector('[data-tutorial="detail-modal"]')) {
                selector = '[data-tutorial="detail-modal"]';
            } else if ((step.id === 'lists' || step.id === 'expanded-lists') && document.querySelector('[data-tutorial="expanded-lists-modal"]')) {
                selector = '[data-tutorial="expanded-lists-modal"]';
            } else if (step.id === 'add-lists' && document.querySelector('[data-tutorial="add-list-button"]')) {
                selector = '[data-tutorial="add-list-button"]';
            } else if (step.id === 'search' && document.querySelector('[data-tutorial="search-input"]')) {
                const searchEl = document.querySelector('[data-tutorial="search-input"]');
                if (searchEl && searchEl.offsetWidth > 40) {
                    selector = '[data-tutorial="search-input"]';
                }
            } else if ((step.id === 'search' || step.id === 'filters') && document.querySelector('[data-tutorial="filters-panel"]')) {
                selector = '[data-tutorial="filters-panel"]';
            }

            if (!selector) {
                setTargetRect(null);
                return;
            }
            const el = document.querySelector(selector);
            if (el) {
                const rect = el.getBoundingClientRect();
                let top = rect.top - 8;
                let left = rect.left - 8;
                let right = rect.right + 8;
                let bottom = rect.bottom + 8;

                // For expanded-lists-modal and add-list-button, also include the dropdown if open
                const dropdownEl = document.querySelector('[data-tutorial="add-list-dropdown"]');
                if (dropdownEl) {
                    const dRect = dropdownEl.getBoundingClientRect();
                    if (dRect.width > 0 && dRect.height > 0) {
                        top = Math.min(top, dRect.top - 8);
                        left = Math.min(left, dRect.left - 8);
                        right = Math.max(right, dRect.right + 8);
                        bottom = Math.max(bottom, dRect.bottom + 8);
                    }
                }

                const width = right - left;
                const height = bottom - top;

                if (width > 0 && height > 0) {
                    setTargetRect(prev => {
                        if (
                            prev &&
                            Math.abs(prev.top - top) < 0.5 &&
                            Math.abs(prev.left - left) < 0.5 &&
                            Math.abs(prev.width - width) < 0.5 &&
                            Math.abs(prev.height - height) < 0.5
                        ) {
                            return prev;
                        }
                        return { top, left, width, height };
                    });
                    return;
                }
            }
            setTargetRect(null);
        };

        updateRect();

        // Scroll the element into view smoothly when step changes
        if (step.targetSelector) {
            const el = document.querySelector(step.targetSelector);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Continuous frame tracking to catch smooth CSS layout shifts & map selection changes
        const loop = () => {
            updateRect();
            animFrameId = requestAnimationFrame(loop);
        };
        animFrameId = requestAnimationFrame(loop);

        const handleResize = () => updateRect();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        return () => {
            clearTimeout(timer);
            if (animFrameId) cancelAnimationFrame(animFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [isOpen, currentStep, step.targetSelector]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (onCloseDetails) onCloseDetails();
                if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
                else onClose();
            }
            if (e.key === 'ArrowLeft') {
                if (onCloseDetails) onCloseDetails();
                if (currentStep > 0) setCurrentStep(s => s - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentStep, totalSteps, onClose, onCloseDetails]);

    // Reset on open
    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    // Listen for custom event to advance tutorial from external clicks
    useEffect(() => {
        if (!isOpen) return;
        const handleExternalNext = () => {
            if (onCloseDetails) onCloseDetails();
            if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
            else onClose();
        };
        window.addEventListener('tutorial-next-step', handleExternalNext);
        return () => window.removeEventListener('tutorial-next-step', handleExternalNext);
    }, [isOpen, currentStep, totalSteps, onClose, onCloseDetails]);

    if (!isOpen) return null;

    const goNext = () => {
        if (onCloseDetails) onCloseDetails();
        if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
        else onClose();
    };

    const goPrev = () => {
        if (onCloseDetails) onCloseDetails();
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    // Calculate tooltip position with intelligent responsive fallbacks & viewport clamping
    const getTooltipStyle = () => {
        if (!targetRect || step.position === 'center') {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        // Special override: If targeting the expanded list modal, force the tooltip to the far left reserved dark area
        if ((step.id === 'lists' || step.id === 'expanded-lists') && document.querySelector('[data-tutorial="expanded-lists-modal"]')) {
            const isSm = window.innerWidth >= 640;
            if (!isSm) {
                return {
                    position: 'fixed',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(380px, calc(100vw - 24px))',
                };
            }
            return {
                position: 'fixed',
                top: '50%',
                left: '16px',
                transform: 'translateY(-50%)',
                width: '380px',
            };
        }

        // Special override: Step 11 (add-lists) — place tooltip in the left reserved dark area, above the + button
        if (step.id === 'add-lists' && document.querySelector('[data-tutorial="add-list-button"]')) {
            const isSm = window.innerWidth >= 640;
            if (!isSm) {
                return {
                    position: 'fixed',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(380px, calc(100vw - 24px))',
                };
            }
            return {
                position: 'fixed',
                top: '50%',
                left: '16px',
                transform: 'translateY(-50%)',
                width: '380px',
            };
        }

        const pad = 16;
        const isMobile = window.innerWidth < 640;
        const tooltipW = isMobile ? Math.min(360, window.innerWidth - 32) : 400;
        const tooltipH = tooltipRef.current ? tooltipRef.current.offsetHeight : 280;

        let pos = step.position;

        // Auto-fallback if 'left' or 'right' doesn't fit horizontally on screen
        if (pos === 'left' && (targetRect.left - tooltipW - pad < 16)) {
            pos = (targetRect.top + targetRect.height + tooltipH + pad < window.innerHeight - 16) ? 'below' : 'above';
        } else if (pos === 'right' && (targetRect.left + targetRect.width + tooltipW + pad > window.innerWidth - 16)) {
            pos = (targetRect.top + targetRect.height + tooltipH + pad < window.innerHeight - 16) ? 'below' : 'above';
        }

        let top, left;

        if (pos === 'below') {
            top = targetRect.top + targetRect.height + pad;
            left = targetRect.left + (targetRect.width / 2) - (tooltipW / 2);
        } else if (pos === 'above') {
            top = targetRect.top - tooltipH - pad;
            left = targetRect.left + (targetRect.width / 2) - (tooltipW / 2);
        } else if (pos === 'left') {
            top = targetRect.top + (targetRect.height / 2) - (tooltipH / 2);
            left = targetRect.left - tooltipW - pad;
        } else if (pos === 'right') {
            top = targetRect.top + (targetRect.height / 2) - (tooltipH / 2);
            left = targetRect.left + targetRect.width + pad;
        } else {
            return {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        // Strict viewport clamping to keep tooltip 100% visible on screen
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
        top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

        return {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            width: `${tooltipW}px`,
        };
    };

    const progressPct = ((currentStep + 1) / totalSteps) * 100;

    return (
        <>
            {/* Full screen overlay */}
            <div className="fixed inset-0 z-[9990] pointer-events-none transition-opacity duration-300">

                {/* Click blocker — covers entire screen EXCEPT the spotlight area */}
                {targetRect ? (
                    <>
                        <div className="fixed top-0 left-0 right-0 pointer-events-auto" style={{ height: Math.max(0, targetRect.top) }} />
                        <div className="fixed bottom-0 left-0 right-0 pointer-events-auto" style={{ top: targetRect.top + targetRect.height }} />
                        <div className="fixed pointer-events-auto" style={{ top: Math.max(0, targetRect.top), height: targetRect.height, left: 0, width: Math.max(0, targetRect.left) }} />
                        <div className="fixed pointer-events-auto" style={{ top: Math.max(0, targetRect.top), height: targetRect.height, left: targetRect.left + targetRect.width, right: 0 }} />
                    </>
                ) : (
                    <div className="fixed inset-0 pointer-events-auto" />
                )}

                {/* SVG Mask for spotlight cutout — visual only */}
                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    <defs>
                        <mask id="tutorial-spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {targetRect && (
                                <rect
                                    x={targetRect.left}
                                    y={targetRect.top}
                                    width={targetRect.width}
                                    height={targetRect.height}
                                    rx="16"
                                    fill="black"
                                    className={isAnimating ? "transition-all duration-300 ease-out" : ""}
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        x="0" y="0" width="100%" height="100%"
                        fill={darkMode ? 'rgba(0,0,0,0.82)' : 'rgba(15,20,35,0.75)'}
                        mask="url(#tutorial-spotlight-mask)"
                    />
                </svg>

                {/* Spotlight ring glow */}
                {targetRect && (
                    <div
                        className={`absolute rounded-2xl border-2 border-gov-blue/60 shadow-[0_0_30px_rgba(0,90,156,0.3)] pointer-events-none ${isAnimating ? "transition-all duration-300 ease-out" : ""}`}
                        style={{
                            top: targetRect.top,
                            left: targetRect.left,
                            width: targetRect.width,
                            height: targetRect.height,
                        }}
                    >
                        <div className="absolute inset-0 rounded-2xl animate-pulse border-2 border-gov-blue/30"></div>
                    </div>
                )}

                {/* Tooltip Card */}
                <div
                    ref={tooltipRef}
                    className={`w-[90vw] max-w-[420px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden p-0 z-[9999] transition-all duration-500 ease-out ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}
                    style={{ ...getTooltipStyle(), pointerEvents: 'auto' }}
                >
                    {/* Segmented Progress Bar */}
                    <div className={`w-full flex items-center gap-1 px-3 pt-2 shrink-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        {TUTORIAL_STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                    idx <= currentStep
                                        ? 'bg-gov-blue'
                                        : (darkMode ? 'bg-gray-800' : 'bg-gray-200')
                                }`}
                            />
                        ))}
                    </div>

                    {/* Top bar: step counter + close button */}
                    <div className={`flex items-center justify-between px-5 pt-3 pb-0 shrink-0`}>
                        <span className={`text-[9px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Passo {currentStep + 1} de {totalSteps}
                        </span>
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                            title="Fechar tutorial (Esc)"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 pb-4">

                        {/* Icon + Title */}
                        <div className="flex items-start gap-3.5 mb-3">
                            <div className={`p-2.5 rounded-xl shrink-0 ${darkMode ? 'bg-gov-blue/20 text-blue-400' : 'bg-gov-blue/10 text-gov-blue'}`}>
                                {step.icon}
                            </div>
                            <div>
                                <h3 className={`text-base font-black leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {step.title}
                                </h3>
                            </div>
                        </div>

                        {/* Description */}
                        <p className={`text-[12.5px] leading-relaxed mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {step.description}
                        </p>

                        {/* Step Dots */}
                        <div className="flex items-center justify-center gap-1.5 mb-4">
                            {TUTORIAL_STEPS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (onCloseDetails) onCloseDetails();
                                        setCurrentStep(idx);
                                    }}
                                    className={`rounded-full transition-all duration-300 ${idx === currentStep
                                        ? 'w-6 h-2 bg-gov-blue'
                                        : idx < currentStep
                                            ? `w-2 h-2 ${darkMode ? 'bg-gov-blue/60' : 'bg-gov-blue/50'}`
                                            : `w-2 h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                                        }`}
                                    title={`Ir para passo ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className={`flex items-center justify-between px-6 py-3.5 border-t rounded-b-2xl ${darkMode ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                        <button
                            onClick={onClose}
                            className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Pular Tutorial
                        </button>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={goPrev}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${darkMode
                                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <ChevronLeft size={14} />
                                    Anterior
                                </button>
                            )}
                            <button
                                onClick={goNext}
                                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gov-blue text-white hover:bg-gov-blue/90 transition-all shadow-md shadow-gov-blue/20"
                            >
                                {currentStep === totalSteps - 1 ? 'Concluir' : 'Próximo'}
                                {currentStep < totalSteps - 1 && <ChevronRight size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
