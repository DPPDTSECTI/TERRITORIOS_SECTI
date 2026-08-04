import React from 'react';
import { User, Home, LayoutDashboard, FileText, Info } from 'lucide-react';
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
    <aside className="w-[200px] h-screen bg-[#18181B] rounded-r-[5px] flex flex-col py-6 p-3 px-[9.5px] shadow-2xl border-r border-white/5 flex-shrink-0 z-50">
      
      {/* ================= TOPO: USUÁRIO ================= */}
      <div className="w-full h-[55px] bg-[#232326] rounded-[5px] flex items-center px-3 gap-3 cursor-pointer hover:bg-[#2A2A2E] transition-colors shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#D9D9D9] flex items-center justify-center shrink-0">
          <User size={18} className="text-[#18181B]" />
        </div>
        <span className="text-[11px] font-semibold text-white/80 truncate">
          {username ? username : "Convidado"}
        </span>
      </div>

      <div className="w-full h-[1px] bg-[#2A2A2E] my-5 shrink-0" />

      {/* ================= NAVEGAÇÃO ================= */}
      <nav className="flex-1 w-full flex flex-col gap-1 overflow-y-auto hide-scroll">
        
        {/* GRUPO PRINCIPAL: Todas as páginas */}
        {navItemsGroup1.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="relative w-full h-[36px] flex items-center group cursor-pointer rounded-[5px] hover:bg-[#232326] transition-colors">
              {isActive && (
                <div className="absolute left-[-9.5px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3117ea] rounded-r-md shadow-[2px_0_8px_rgba(49,23,234,0.5)]" />
              )}
              <div className={`w-5 h-5 rounded-[5px] flex items-center justify-center ml-2 transition-colors ${isActive ? 'bg-[#3117ea]' : 'bg-[#232326] group-hover:bg-[#2A2A2E]'}`}>
                <item.icon size={11} className={isActive ? 'text-white' : 'text-white/60'} />
              </div>
              <span className={`ml-3 text-[11px] font-medium transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Renderiza Filtros/Rabiscos APENAS se navOnly for falso */}
        {!navOnly && (
          <>
            <div className="w-full h-[1px] bg-[#2A2A2E] my-3 shrink-0" />
            <div className="relative w-full h-[36px] flex items-center opacity-60">
              <div className="w-5 h-5 bg-[#232326] rounded-[5px] ml-2" />
              <div className="ml-3 h-1.5 w-14 bg-[#232326] rounded-full" />
            </div>
            <div className="relative w-full h-[36px] flex items-center opacity-60">
              <div className="w-5 h-5 bg-[#232326] rounded-[5px] ml-2" />
              <div className="ml-3 h-1.5 w-16 bg-[#232326] rounded-full" />
            </div>
            <div className="relative w-full h-[36px] flex items-center opacity-60">
              <div className="w-5 h-5 bg-[#232326] rounded-[5px] ml-2" />
              <div className="ml-3 h-1.5 w-10 bg-[#232326] rounded-full" />
            </div>
          </>
        )}
      </nav>

      {/* ================= RODAPÉ ================= */}
      <div className="mt-4 w-full shrink-0">
        <div className="w-full h-[122px] bg-[#232326] rounded-[5px] flex flex-col items-center justify-center p-3 opacity-60">
           <div className="w-8 h-8 rounded-full bg-[#313136] mb-2" />
           <div className="h-1.5 w-24 bg-[#313136] rounded-full mb-1" />
           <div className="h-1 w-16 bg-[#313136] rounded-full" />
        </div>
      </div>

    </aside>
  );
}