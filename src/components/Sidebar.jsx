import React from 'react';
import { User, Home, LayoutDashboard, FileText, Info, Settings, LogOut, ChevronDown, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ username, navOnly = false }) {
  const location = useLocation();

  const navItemsGroup1 = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/territorios', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/relatorio', label: 'Relatório', icon: FileText },
    { path: '/sobre', label: 'Sobre', icon: Info },
  ];

  return (
    <aside className="w-[250px] h-screen bg-[#141415] flex flex-col py-4 px-3 border-r border-white/5 flex-shrink-0 z-50 font-sans select-none relative">
      
      {/* ================= TOPO: WORKSPACE / USUÁRIO ================= */}
      <div className="w-full px-2 py-1.5 rounded-md flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors duration-150 shrink-0 group">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-5 h-5 rounded-[4px] bg-[#593FF7] flex items-center justify-center shrink-0 text-white shadow-sm">
            <span className="text-[10px] font-bold">BA</span>
          </div>
          <span className="text-[13px] font-medium text-white/90 truncate">
            {username ? username : "Workspace GESTOR"}
          </span>
        </div>
        <ChevronDown size={14} className="text-white/30 group-hover:text-white/60 transition-colors" />
      </div>

      {/* ================= BUSCA GLOBAL (COMMAND PALETTE) ================= */}
      <div className="mt-4 mb-2 px-2">
        <button className="w-full h-[32px] px-2 bg-[#18181B] hover:bg-white/[0.04] border border-white/5 rounded-md flex items-center justify-between text-white/40 hover:text-white/70 transition-all duration-150 group">
          <div className="flex items-center gap-2">
            <Search size={14} strokeWidth={2} className="opacity-70 group-hover:opacity-100" />
            <span className="text-[13px] font-medium tracking-wide">Buscar...</span>
          </div>
          <div className="flex items-center">
            {/* Tag KBD para atalhos de teclado */}
            <kbd className="h-[20px] px-1.5 bg-white/5 border border-white/10 rounded-[4px] text-[10px] font-mono font-medium text-white/40 group-hover:text-white/70 transition-colors flex items-center justify-center shadow-sm">
              Ctrl K
            </kbd>
          </div>
        </button>
      </div>

      {/* ================= NAVEGAÇÃO ================= */}
      <div className="mt-4 mb-2 px-2">
        <span className="text-[11px] font-medium text-white/40">Seu Painel</span>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-[2px] overflow-y-auto hide-scroll">
        {navItemsGroup1.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`w-full h-[32px] px-2 flex items-center gap-2.5 rounded-md transition-colors duration-150 ${
                isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              }`}
            >
              <item.icon size={15} className={isActive ? 'text-white' : 'text-white/50'} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[13px] font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Módulos Futuros */}
        {!navOnly && (
          <div className="mt-6">
            <div className="px-2 mb-2">
              <span className="text-[11px] font-medium text-white/40">Módulos (Em breve)</span>
            </div>
            <div className="w-full h-[32px] px-2 flex items-center gap-2.5 opacity-40 cursor-wait hover:bg-white/[0.02] rounded-md transition-colors">
              <div className="w-3.5 h-3.5 bg-white/10 rounded-sm" />
              <div className="h-1.5 w-20 bg-white/10 rounded-full" />
            </div>
            <div className="w-full h-[32px] px-2 flex items-center gap-2.5 opacity-40 cursor-wait hover:bg-white/[0.02] rounded-md transition-colors">
              <div className="w-3.5 h-3.5 bg-white/10 rounded-sm" />
              <div className="h-1.5 w-16 bg-white/10 rounded-full" />
            </div>
          </div>
        )}
      </nav>

      {/* ================= RODAPÉ ================= */}
      <div className="mt-auto pt-3 border-t border-white/5 flex flex-col gap-[2px] shrink-0">
        <div className="w-full h-[32px] px-2 flex items-center gap-2.5 rounded-md cursor-pointer text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors duration-150">
          <Settings size={15} strokeWidth={2} />
          <span className="text-[13px] font-medium tracking-wide">Configurações</span>
        </div>
        
        <div className="w-full h-[32px] px-2 flex items-center gap-2.5 rounded-md cursor-pointer text-white/60 hover:bg-white/5 hover:text-red-400 transition-colors duration-150 group">
          <LogOut size={15} strokeWidth={2} className="group-hover:text-red-400 transition-colors" />
          <span className="text-[13px] font-medium tracking-wide">Sair da Sessão</span>
        </div>
      </div>

    </aside>
  );
}