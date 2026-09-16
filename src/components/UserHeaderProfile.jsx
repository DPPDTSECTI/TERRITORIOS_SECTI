import React from 'react';
import { HelpCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function UserHeaderProfile() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      {/* BRASÃO / LOGOMARCA COM TRANSIÇÃO CLARO/ESCURO */}
      <div className="flex items-center">
        <img
          src={isDark ? '/img/Brasao-Horizontal_Branco.webp' : '/img/brasao_preto.webp'}
          alt="Brasão do Estado da Bahia"
          className="h-12 w-auto object-contain shrink-0 transition-opacity duration-300"
        />
      </div>

      {/* ÁREA DE AÇÕES */}
      <div className="tour-user-menu flex items-center gap-3">
        {/* DIVISOR SUTIL DIREITA */}
        <div className="h-6 w-[1px] bg-border-strong hidden sm:block"></div>

        {/* BOTÕES: TEMA + TUTORIAL */}
        <div className="flex items-center gap-2">
          {/* BOTÃO ALTERNADOR DE MODO ESCURO / CLARO */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="w-8 h-8 rounded-full bg-surface-soft text-text-secondary hover:text-primary-600 hover:bg-surface border border-border/70 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95"
          >
            {isDark ? (
              <Sun size={16} strokeWidth={2} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon size={16} strokeWidth={2} className="text-neutral-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* BOTÃO DE TUTORIAL / AJUDA */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('start-tour'))}
            title="Tutorial / Ajuda"
            aria-label="Tutorial e Ajuda do Painel"
            className="tour-help-button w-8 h-8 rounded-full bg-surface-soft text-text-muted hover:text-primary-600 hover:bg-surface border border-border/70 flex items-center justify-center transition-colors shadow-xs active:scale-95"
          >
            <HelpCircle size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}