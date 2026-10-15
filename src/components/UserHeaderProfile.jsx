import React from 'react';
import { HelpCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { IconButton } from './ui/Button';

export default function UserHeaderProfile() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      {/* BRASÃO / LOGOMARCA COM TRANSIÇÃO CLARO/ESCURO */}
      <div className="flex items-center">
        <img
          src={isDark ? '/img/Brasao-Horizontal_Branco.webp' : '/img/brasao_preto.webp'}
          alt="Brasão do Estado da Bahia"
          className="h-10 w-auto object-contain shrink-0 transition-opacity duration-300 select-none"
        />
      </div>

      {/* ÁREA DE AÇÕES */}
      <div className="tour-user-menu flex items-center gap-2.5">
        {/* DIVISOR SUTIL DIREITA */}
        <div className="h-6 w-px bg-border hidden sm:block" />

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