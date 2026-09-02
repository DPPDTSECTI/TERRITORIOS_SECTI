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

 {/* DIVISOR DIREITO DO BRASÃO */}
 <div className="h-6 w-[1px] bg-border-strong"></div>

 {/* ÁREA DO USUÁRIO E AÇÕES (Para o tutorial) */}
 <div className="tour-user-menu flex items-center gap-3">
 {/* PERFIL DO USUÁRIO */}
 <div className="flex items-center gap-3 cursor-pointer group">
 <div className="relative">
 <img
 src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSEu8mb2FMhQAmdhOwKNR0jYJPWugKBA61474wGmqc8Q&s=10"
 alt="Avatar do Usuário"
 className="w-10 h-10 rounded-full object-cover shadow-sm  transition-transform"
 />
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
 </div>
 <div className="flex flex-col text-left hidden sm:flex">
 <span className="text-[14px] font-medium text-text-primary leading-tight group-hover:text-text-secondary transition-colors">
 Usuario
 </span>
 </div>
 </div>

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