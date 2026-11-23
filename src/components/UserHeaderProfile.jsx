import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Sun, Moon, LogOut, ShieldCheck, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { IconButton, Button } from './ui/Button';
import { cn } from '../lib/cn';

export default function UserHeaderProfile() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, userName, userRole, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center gap-3">
      {/* BRASÃO / LOGOMARCA COM TRANSIÇÃO CLARO/ESCURO */}
      <div className="flex items-center">
        <img
          src={`${import.meta.env.BASE_URL}img/secti-govba-horizontal.svg`}
          alt="Governo da Bahia – Secretaria de Ciência, Tecnologia e Inovação"
          className="h-10 w-auto object-contain shrink-0 block dark:hidden select-none"
        />
        <img
          src={`${import.meta.env.BASE_URL}img/secti-govba-horizontal-branco.svg`}
          alt="Governo da Bahia – Secretaria de Ciência, Tecnologia e Inovação"
          className="h-10 w-auto object-contain shrink-0 hidden dark:block select-none"
        />
      </div>

      {/* ÁREA DE AÇÕES */}
      <div className="tour-user-menu flex items-center gap-2.5">
        {/* DIVISOR SUTIL DIREITA */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* STATUS DO USUÁRIO / AUTENTICAÇÃO */}
        {isAuthenticated && user && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-label="Menu do Usuário Autenticado"
              className={cn(
                'flex items-center gap-2 h-9 px-2.5 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs select-none cursor-pointer',
                dropdownOpen && 'ring-2 ring-zinc-900/10 dark:ring-zinc-100/20'
              )}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={13} strokeWidth={2.2} />
              </div>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                  {userName}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                  {userRole}
                </span>
              </div>
              <ChevronDown size={13} className="text-zinc-400 hidden sm:block shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md p-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {userName}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                    {user.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/admin');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                >
                  <SlidersHorizontal size={14} className="text-zinc-400" />
                  <span>Painel CRUD</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Encerrar Sessão</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOTÕES: TEMA + TUTORIAL */}
        <div className="flex items-center gap-1.5">
          {/* BOTÃO ALTERNADOR DE MODO ESCURO / CLARO */}
          <IconButton
            size="sm"
            variant="secondary"
            aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            onClick={toggleTheme}
            className="text-text-secondary hover:text-text-primary rounded-control shadow-xs"
          >
            {isDark ? (
              <Sun size={16} strokeWidth={1.75} className="text-amber-400" />
            ) : (
              <Moon size={16} strokeWidth={1.75} className="text-text-secondary" />
            )}
          </IconButton>

          {/* BOTÃO DE TUTORIAL / AJUDA */}
          <IconButton
            size="sm"
            variant="secondary"
            aria-label="Tutorial e Ajuda do Painel"
            title="Tutorial / Ajuda"
            onClick={() => window.dispatchEvent(new Event('start-tour'))}
            className="tour-help-button text-text-muted hover:text-text-primary rounded-control shadow-xs"
          >
            <HelpCircle size={16} strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
