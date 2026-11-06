import React, { useState } from 'react';
import {
  Home,
  LayoutGrid,
  FileText,
  Info,
  Database,
  GraduationCap,
  GitPullRequest,
  Pin,
  PinOff,
  Sun,
  Moon,
  HelpCircle,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { IconButton } from './ui/Button';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function Sidebar({ username = 'PTI Bahia', navOnly = false }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { filtroSemiarido } = useData();

  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('secti_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('secti_sidebar_pinned', String(next));
      } catch (e) {
        console.warn('Não foi possível salvar preferência de pin da sidebar:', e);
      }
      return next;
    });
  };

  const navItemsGroup1 = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/relatorio', label: 'Relatório', icon: FileText },
    { path: '/sobre', label: 'Sobre', icon: Info, tourClass: 'tour-nav-sobre' },
  ];

  const modulesItems = [
    { path: '/territorios', label: 'Visão Geral', icon: LayoutGrid, tourClass: 'tour-nav-visao' },
    { path: '/ativos', label: 'Ativos', icon: Database, tourClass: 'tour-nav-ativos' },
    { path: '/cadeia', label: 'Cadeia', icon: GitPullRequest, tourClass: 'tour-nav-cadeias' },
    { path: '/cursos', label: 'Cursos CT&I', icon: GraduationCap, tourClass: 'tour-nav-cursos' },
  ];

  return (
    <div
      className={cn(
        'relative h-screen shrink-0 select-none z-50 print:hidden transition-[width] duration-200 ease-standard',
        isPinned ? 'w-[248px]' : 'w-[72px]'
      )}
    >
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'tour-sidebar absolute top-4 bottom-4 left-4 bg-white dark:bg-carbon border rounded-[28px] flex flex-col py-4 px-3 transition-all duration-200 ease-standard overflow-hidden z-50',
          filtroSemiarido
            ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.14)]'
            : 'border-border/80 shadow-bento',
          isExpanded ? (filtroSemiarido ? 'w-[236px] shadow-[0_8px_32px_-4px_rgba(217,119,6,0.2)]' : 'w-[236px] shadow-float') : 'w-[64px]'
        )}
      >
        {/* ================= TOPO: LOGO & PIN BUTTON ================= */}
        <div className="w-full h-10 flex items-center mb-3 shrink-0">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img
              src="/img/favicon-96x96.webp"
              alt="Favicon Mapa"
              className="w-7 h-7 object-contain"
            />
          </div>

          <span
            className={cn(
              'text-subtitle font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-standard pl-2 flex-1',
              filtroSemiarido ? 'text-amber-950 dark:text-amber-100' : 'text-text-primary',
              isExpanded
                ? 'opacity-100'
                : 'w-0 opacity-0 -translate-x-2 pointer-events-none'
            )}
          >
            {username}
          </span>

          <IconButton
            size="sm"
            variant="ghost"
            aria-label={isPinned ? 'Desafixar barra lateral' : 'Fixar barra lateral'}
            title={isPinned ? 'Desafixar barra lateral' : 'Fixar barra lateral'}
            onClick={togglePin}
            tabIndex={isExpanded ? 0 : -1}
            className={cn(
              'shrink-0 rounded-full transition-[opacity,transform,width,margin] duration-200 ease-standard overflow-hidden',
              filtroSemiarido
                ? 'text-amber-700/70 dark:text-amber-400/70 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
                : 'text-text-muted hover:text-text-primary',
              isExpanded
                ? 'w-8 ml-1 opacity-100'
                : 'w-0 ml-0 opacity-0 scale-90 pointer-events-none'
            )}
          >
            {isPinned ? (
              <PinOff size={16} strokeWidth={1.75} className={cn('shrink-0', filtroSemiarido ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400')} />
            ) : (
              <Pin size={16} strokeWidth={1.75} className="shrink-0" />
            )}
          </IconButton>
        </div>

        {/* ================= NAVEGAÇÃO ================= */}
        <nav className="flex-1 min-h-0 w-full flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-none pt-1">
          {/* SEÇÃO: MENU */}
          <div className="w-full h-5 flex items-center px-2 shrink-0">
            <span
              className={cn(
                'text-caption font-semibold uppercase tracking-wider transition-all duration-200 ease-standard text-[11px]',
                filtroSemiarido ? 'text-amber-800/80 dark:text-amber-300/80' : 'text-text-muted',
                isExpanded ? 'opacity-100' : 'opacity-0 -translate-x-2 pointer-events-none'
              )}
            >
              Menu
            </span>
          </div>

          {navItemsGroup1.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <div key={item.path} className="w-full shrink-0">
                <Link
                  to={item.path}
                  title={!isExpanded ? item.label : undefined}
                  className={cn(
                    'relative w-full h-10 flex items-center rounded-full transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2',
                    filtroSemiarido ? 'focus-visible:ring-amber-500' : 'focus-visible:ring-carbon dark:focus-visible:ring-primary-500',
                    item.tourClass,
                    isActive
                      ? isExpanded
                        ? (filtroSemiarido
                            ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 font-semibold border border-amber-300/50 dark:border-amber-600/30'
                            : 'bg-surface-soft dark:bg-surface-raised text-text-primary font-semibold')
                        : 'text-white'
                      : (filtroSemiarido
                          ? 'text-text-secondary hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft dark:hover:bg-surface-raised/70')
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center shrink-0 transition-transform duration-150',
                      !isActive && 'group-hover:scale-105'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150',
                        isActive
                          ? (filtroSemiarido
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white shadow-xs shadow-amber-500/30'
                              : 'bg-carbon dark:bg-primary-600 text-white shadow-xs')
                          : (filtroSemiarido
                              ? 'text-text-muted group-hover:text-amber-600 dark:group-hover:text-amber-400'
                              : 'text-text-muted group-hover:text-text-primary')
                      )}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.75}
                        className={isActive ? 'text-white' : 'currentColor'}
                      />
                    </div>
                  </div>

                  <span
                    className={cn(
                      'text-body-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-standard pr-2 pl-1',
                      isExpanded
                        ? 'opacity-100'
                        : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
                      isActive
                        ? (filtroSemiarido ? 'font-semibold text-amber-950 dark:text-amber-100' : 'font-semibold text-text-primary')
                        : 'font-medium text-text-secondary'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          })}

          {/* SEÇÃO: MÓDULOS */}
          {!navOnly && (
            <div className="mt-3 flex flex-col gap-1 w-full shrink-0">
              <div className="w-full h-5 flex items-center px-2 shrink-0">
                <span
                  className={cn(
                    'text-caption font-semibold uppercase tracking-wider transition-all duration-200 ease-standard text-[11px]',
                    filtroSemiarido ? 'text-amber-800/80 dark:text-amber-300/80' : 'text-text-muted',
                    isExpanded ? 'opacity-100' : 'opacity-0 -translate-x-2 pointer-events-none'
                  )}
                >
                  Módulos
                </span>
              </div>

              {modulesItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <div key={item.path} className="w-full shrink-0">
                    <Link
                      to={item.path}
                      title={!isExpanded ? item.label : undefined}
                      className={cn(
                        'relative w-full h-10 flex items-center rounded-full transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2',
                        filtroSemiarido ? 'focus-visible:ring-amber-500' : 'focus-visible:ring-carbon dark:focus-visible:ring-primary-500',
                        item.tourClass,
                        isActive
                          ? isExpanded
                            ? (filtroSemiarido
                                ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 font-semibold border border-amber-300/50 dark:border-amber-600/30'
                                : 'bg-surface-soft dark:bg-surface-raised text-text-primary font-semibold')
                            : 'text-white'
                          : (filtroSemiarido
                              ? 'text-text-secondary hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-50/80 dark:hover:bg-amber-950/30'
                              : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft dark:hover:bg-surface-raised/70')
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 flex items-center justify-center shrink-0 transition-transform duration-150',
                          !isActive && 'group-hover:scale-105'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150',
                            isActive
                              ? (filtroSemiarido
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white shadow-xs shadow-amber-500/30'
                                  : 'bg-carbon dark:bg-primary-600 text-white shadow-xs')
                              : (filtroSemiarido
                                  ? 'text-text-muted group-hover:text-amber-600 dark:group-hover:text-amber-400'
                                  : 'text-text-muted group-hover:text-text-primary')
                          )}
                        >
                          <Icon
                            size={17}
                            strokeWidth={1.75}
                            className={isActive ? 'text-white' : 'currentColor'}
                          />
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-body-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-standard pr-2 pl-1',
                          isExpanded
                            ? 'opacity-100'
                            : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
                          isActive
                            ? (filtroSemiarido ? 'font-semibold text-amber-950 dark:text-amber-100' : 'font-semibold text-text-primary')
                            : 'font-medium text-text-secondary'
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* ================= RODAPÉ DA SIDEBAR: BRASÃO, MODO ESCURO & TUTORIAL ================= */}
        <div className="mt-auto flex flex-col gap-2 shrink-0 w-full pt-1 pb-1">
          {/* QUADRADO MAIOR COM O BRASÃO (TRANSIÇÃO FLUIDA SEM SQUISH HORIZONTAL) */}
          <div
            aria-hidden={!isExpanded}
            className={cn(
              'w-full overflow-hidden transition-[max-height,opacity,margin] duration-200 ease-standard shrink-0',
              isExpanded
                ? 'max-h-24 opacity-100 mb-0'
                : 'max-h-0 opacity-0 -mb-2 pointer-events-none'
            )}
          >
            <div
              className={cn(
                'w-[212px] h-24 rounded-2xl p-2.5 flex items-center justify-center select-none overflow-hidden transition-colors duration-150',
                filtroSemiarido
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/50'
                  : 'bg-surface-soft/80 dark:bg-surface-raised/40 border border-border/70 dark:border-border/50'
              )}
              title="Governo do Estado da Bahia — SECTI"
            >
              <img
                src="/img/brasao_preto.webp"
                alt="Governo do Estado da Bahia"
                className="h-12 w-auto max-w-[170px] object-contain block dark:hidden select-none"
              />
              <img
                src="/img/Brasao-Horizontal_Branco.webp"
                alt="Governo do Estado da Bahia"
                className="h-12 w-auto max-w-[170px] object-contain hidden dark:block select-none"
              />
            </div>
          </div>

          {/* TOGGLE DARK MODE (CONTAINER ÚNICO H-10 SEM SALTO DE ALTURA OU REMOUNT) */}
          <div
            className={cn(
              'relative w-full h-10 rounded-full shadow-2xs overflow-hidden shrink-0 select-none transition-colors duration-150',
              filtroSemiarido
                ? 'bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-700/60'
                : 'bg-surface-soft/90 dark:bg-surface-raised/60 border border-border/80 dark:border-border/60'
            )}
            role="radiogroup"
            aria-label="Alternar modo de exibição claro ou escuro"
          >
            {/* ESTADO COLAPSADO: ÍCONE CENTRALIZADO NO CÍRCULO DE 40PX */}
            <button
              type="button"
              onClick={toggleTheme}
              tabIndex={isExpanded ? -1 : 0}
              aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              title={!isExpanded ? (isDark ? 'Modo Claro' : 'Modo Escuro') : undefined}
              className={cn(
                'absolute inset-y-0 left-0 w-[38px] h-full rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-[opacity,transform] duration-200 ease-standard cursor-pointer focus-visible:outline-none focus-visible:ring-2 z-20',
                filtroSemiarido ? 'focus-visible:ring-amber-500' : 'focus-visible:ring-primary-500',
                isExpanded
                  ? 'opacity-0 scale-90 pointer-events-none'
                  : 'opacity-100'
              )}
            >
              {isDark ? (
                <Sun size={17} strokeWidth={1.75} className="text-amber-400 shrink-0" />
              ) : (
                <Moon size={17} strokeWidth={1.75} className="text-text-secondary shrink-0" />
              )}
            </button>

            {/* ESTADO EXPANDIDO: CONTROLE SEGMENTADO DE LARGURA FIXA 210PX */}
            <div
              className={cn(
                'w-[210px] h-full p-1 grid grid-cols-2 relative transition-opacity duration-200 ease-standard',
                isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
            >
              {/* PILL INDICADOR DESLIZANTE (PURO CSS GPU-ACCELERATED) */}
              <div
                aria-hidden="true"
                className={cn(
                  'absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-2xs pointer-events-none transition-transform duration-200 ease-standard',
                  filtroSemiarido
                    ? 'bg-white dark:bg-zinc-800 border border-amber-300/70 dark:border-amber-600/30'
                    : 'bg-white dark:bg-zinc-800 border border-border/70 dark:border-zinc-700/70',
                  isDark ? 'translate-x-full' : 'translate-x-0'
                )}
              />

              {/* OPÇÃO: CLARO */}
              <button
                type="button"
                role="radio"
                tabIndex={isExpanded ? 0 : -1}
                aria-checked={!isDark}
                onClick={() => isDark && toggleTheme()}
                className={cn(
                  'relative z-10 h-full rounded-full flex items-center justify-center gap-1.5 text-xs whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2',
                  filtroSemiarido ? 'focus-visible:ring-amber-500' : 'focus-visible:ring-primary-500',
                  !isDark
                    ? (filtroSemiarido ? 'font-semibold text-amber-950 dark:text-amber-100' : 'font-semibold text-text-primary')
                    : 'font-medium text-text-muted hover:text-text-secondary'
                )}
              >
                <Sun size={13} strokeWidth={2} className={cn('shrink-0', !isDark ? 'text-amber-500' : '')} />
                <span>Claro</span>
              </button>

              {/* OPÇÃO: ESCURO */}
              <button
                type="button"
                role="radio"
                tabIndex={isExpanded ? 0 : -1}
                aria-checked={isDark}
                onClick={() => !isDark && toggleTheme()}
                className={cn(
                  'relative z-10 h-full rounded-full flex items-center justify-center gap-1.5 text-xs whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2',
                  filtroSemiarido ? 'focus-visible:ring-amber-500' : 'focus-visible:ring-primary-500',
                  isDark
                    ? (filtroSemiarido ? 'font-semibold text-amber-300' : 'font-semibold text-white')
                    : 'font-medium text-text-muted hover:text-text-secondary'
                )}
              >
                <Moon size={13} strokeWidth={2} className={cn('shrink-0', isDark ? (filtroSemiarido ? 'text-amber-400' : 'text-primary-400') : '')} />
                <span>Escuro</span>
              </button>
            </div>
          </div>

          {/* BOTÃO DE TUTORIAL / AJUDA (ELEMENTO ÚNICO PERSISTENTE COM TRANSIÇÃO SINCRONIZADA) */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('start-tour'))}
            title={!isExpanded ? 'Tutorial Guiado' : 'Iniciar Tutorial Guiado do Painel'}
            aria-label="Tutorial do Painel"
            className={cn(
              'tour-help-button relative w-full h-10 rounded-full flex items-center text-xs font-medium transition-colors duration-150 cursor-pointer shadow-2xs select-none active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 overflow-hidden shrink-0 group',
              filtroSemiarido
                ? 'bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-950/50 border border-amber-300/70 dark:border-amber-700/60 text-amber-900/90 dark:text-amber-200/90 focus-visible:ring-amber-500'
                : 'bg-surface-soft/90 dark:bg-surface-raised/60 hover:bg-surface-soft dark:hover:bg-surface-raised border border-border/80 dark:border-border/60 text-text-secondary hover:text-text-primary focus-visible:ring-primary-500'
            )}
          >
            <div
              className={cn(
                'w-[38px] h-full flex items-center justify-center shrink-0 transition-[margin] duration-200 ease-standard',
                isExpanded ? 'ml-7' : 'ml-0'
              )}
            >
              <HelpCircle
                size={17}
                strokeWidth={1.75}
                className={cn(
                  'transition-colors duration-150 shrink-0',
                  filtroSemiarido
                    ? 'text-amber-600/70 dark:text-amber-400/70 group-hover:text-amber-700 dark:group-hover:text-amber-300'
                    : 'text-text-muted group-hover:text-text-primary'
                )}
              />
            </div>
            <span
              className={cn(
                'whitespace-nowrap overflow-hidden transition-[opacity,transform] duration-200 ease-standard pr-3',
                isExpanded
                  ? 'opacity-100'
                  : 'w-0 opacity-0 -translate-x-2 pointer-events-none p-0'
              )}
            >
              Tutorial do Painel
            </span>
          </button>
        </div>

      </aside>
    </div>
  );
}