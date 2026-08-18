import React from 'react';
import { Settings, LogOut } from 'lucide-react';

export default function UserHeaderProfile() {
  return (
    <div className="flex items-center gap-3">
      {/* DIVISOR SUTIL ESQUERDA */}
      <div className="h-6 w-[1px] bg-[#D6EAF8] hidden sm:block"></div>

      {/* PERFIL DO USUÁRIO */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
            alt="Avatar do Usuário"
            className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
        </div>
        <div className="flex flex-col text-left hidden sm:flex">
          <span className="text-[14px] font-bold text-[#1D3557] leading-tight group-hover:text-[#457B9D] transition-colors">
            Usuario
          </span>
          <span className="text-[12px] font-medium text-[#457B9D] mt-0.5">
            Admin SECTI
          </span>
        </div>
      </div>

      {/* DIVISOR SUTIL DIREITA */}
      <div className="h-6 w-[1px] bg-[#D6EAF8] hidden sm:block"></div>

      {/* BOTÕES DE CONFIGURAÇÃO E LOGOUT */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Configurações"
          className="w-9 h-9 rounded-full bg-white text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-90 shadow-[0_2px_10px_rgba(29,53,87,0.04)]"
        >
          <Settings size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Sair da Sessão"
          className="w-9 h-9 rounded-full bg-white text-[#457B9D] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 active:scale-90 shadow-[0_2px_10px_rgba(29,53,87,0.04)]"
        >
          <LogOut size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
