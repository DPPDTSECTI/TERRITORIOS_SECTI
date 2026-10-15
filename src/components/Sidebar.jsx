import React, { useState } from 'react';
import {
  Home,
  LayoutGrid,
  FileText,
  Info,
  Database,
  GraduationCap,
  GitPullRequest,
  Sun,
  Moon,
  Pin,
  PinOff,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { IconButton } from './ui/Button';
import { SegmentedControl } from './ui/SegmentedControl';
import { cn } from '../lib/cn';

export default function Sidebar({ username = 'PTI Bahia', navOnly = false }) {
  const location = useLocation();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

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
          'tour-sidebar absolute top-4 bottom-4 left-4 bg-surface border border-border rounded-panel shadow-card flex flex-col py-4 px-3 transition-[width,box-shadow] duration-200 ease-standard overflow-hidden z-50',
          isExpanded ? 'w-[232px] shadow-float' : 'w-[64px]'
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
              'text-subtitle font-bold text-text-primary tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-standard pl-2 flex-1',
              isExpanded
                ? 'opacity-100 translate-x-0'
                : 'w-0 opacity-0 -translate-x-2 pointer-events-none'
            )}
          >
            {username}
          </span>

          {isExpanded && (
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={isPinned ? 'Desafixar barra lateral' : 'Fixar barra lateral'}
              title={isPinned ? 'Desafixar barra lateral' : 'Fixar barra lateral'}
              onClick={togglePin}
              className="text-text-muted hover:text-text-primary shrink-0 ml-1"
            >
              {isPinned ? (
                <PinOff size={16} strokeWidth={1.75} className="text-primary-600 dark:text-primary-400" />
              ) : (
                <Pin size={16} strokeWidth={1.75} />
              )}
            </IconButton>
          )}
        </div>

        {/* ================= NAVEGAÇÃO ================= */}
        <nav className="flex-1 w-full flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-none pt-1">
          {/* SEÇÃO: MENU */}
          <div className="w-full h-5 flex items-center px-2 shrink-0">
            <span
              className={cn(
                'text-micro font-bold uppercase text-text-muted transition-all duration-200 ease-standard',
                isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
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
                    'relative w-full h-10 flex items-center rounded-control transition-colors duration-120 group',
                    item.tourClass,
                    isActive
                      ? 'text-primary-900 dark:text-primary-200 font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 bg-primary-50 dark:bg-primary-900/50 border border-primary-200/70 dark:border-primary-700/50 rounded-control -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}

                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <Icon
                      size={18}
                      strokeWidth={1.75}
                      className={cn(
                        'transition-colors',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-text-muted group-hover:text-text-primary'
                      )}
                    />
                  </div>

                  <span
                    className={cn(
                      'text-body-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-standard pr-2',
                      isExpanded
                        ? 'opacity-100 translate-x-0'
                        : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
                      isActive ? 'font-semibold' : 'font-medium'
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
                    'text-micro font-bold uppercase text-text-muted transition-all duration-200 ease-standard',
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
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
                        'relative w-full h-10 flex items-center rounded-control transition-colors duration-120 group',
                        item.tourClass,
                        isActive
                          ? 'text-primary-900 dark:text-primary-200 font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 bg-primary-50 dark:bg-primary-900/50 border border-primary-200/70 dark:border-primary-700/50 rounded-control -z-10"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}

                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <Icon
                          size={18}
                          strokeWidth={1.75}
                          className={cn(
                            'transition-colors',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-text-muted group-hover:text-text-primary'
                          )}
                        />
                      </div>

                      <span
                        className={cn(
                          'text-body-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ease-standard pr-2',
                          isExpanded
                            ? 'opacity-100 translate-x-0'
                            : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
                          isActive ? 'font-semibold' : 'font-medium'
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

        {/* ================= RODAPÉ: CONTROLE DE TEMA ================= */}
        <div className="pt-3 border-t border-border/70 shrink-0 w-full">
          {isExpanded ? (
            <SegmentedControl
              options={[
                {
                  value: 'light',
                  label: 'Claro',
                  icon: <Sun size={14} strokeWidth={1.75} className="text-amber-500" />,
                },
                {
                  value: 'dark',
                  label: 'Escuro',
                  icon: <Moon size={14} strokeWidth={1.75} className="text-blue-400" />,
                },
              ]}
              value={theme}
              onChange={(val) => setTheme(val)}
              size="sm"
              className="w-full justify-center"
            />
          ) : (
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
              className="w-10 h-10 mx-auto rounded-control flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isDark ? (
                <Sun size={18} strokeWidth={1.75} className="text-amber-400" />
              ) : (
                <Moon size={18} strokeWidth={1.75} className="text-text-secondary" />
              )}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}