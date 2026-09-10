import React from 'react';
import { Settings, LogOut, HelpCircle } from 'lucide-react';

export default function UserHeaderProfile() {
 return (
 <div className="flex items-center gap-3">
 {/* BRASÃO / LOGOMARCA */}
 <div className="flex items-center">
 <img
 src="/img/brasao_preto.webp"
 alt="Brasão do Estado"
 className="h-12 w-auto object-contain shrink-0"
 />
 </div>


 {/* ÁREA DO USUÁRIO E AÇÕES (Para o tutorial) */}
 <div className="tour-user-menu flex items-center gap-3">

 {/* DIVISOR SUTIL DIREITA */}
 <div className="h-6 w-[1px] bg-border-strong hidden sm:block"></div>

 {/* BOTÕES DE CONFIGURAÇÃO E LOGOUT */}
 <div className="flex items-center gap-2">
  <button
  type="button"
  onClick={() => window.dispatchEvent(new Event('start-tour'))}
  title="Tutorial / Ajuda"
  className="tour-help-button w-8 h-8 rounded-full bg-surface-soft text-text-muted hover:text-primary-600 hover:bg-surface border border-border/70 flex items-center justify-center transition-colors shadow-xs"
  >
  <HelpCircle size={16} strokeWidth={2} />
  </button>
 </div>
 </div>
 </div>
 );
}