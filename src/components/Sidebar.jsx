import React, { useState } from 'react';
import { Home, LayoutDashboard, FileText, Info, Database, GraduationCap, GitPullRequest } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ username, navOnly = false }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const navItemsGroup1 = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/territorios', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/relatorio', label: 'Relatório', icon: FileText },
    { path: '/sobre', label: 'Sobre', icon: Info },
  ];

  const modulesItems = [
    { path: '/territorios', label: 'Visão Geral', icon: LayoutDashboard },
    { path: '/ativos', label: 'Ativos', icon: Database },
    { path: '/cadeia', label: 'Cadeia', icon: GitPullRequest },
    { path: '/cursos', label: 'Cursos', icon: GraduationCap },
  ];

  const adminItems = [
    { path: '/admin', label: 'Ativos de CTI', icon: Database },
  ];

  return (
    <aside 
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={`h-[calc(100vh-48px)] my-6 ml-6 bg-white rounded-[28px] shadow-[0_8px_30px_rgba(29,53,87,0.04)] flex flex-col py-6 flex-shrink-0 z-50 font-sans select-none relative transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] px-3.5 overflow-hidden will-change-[width] ${
        isCollapsed ? 'w-[68px]' : 'w-[190px]'
      }`}
    >

      {/* ================= TOPO: LOGO ================= */}
      <div className="w-full h-[40px] flex items-center mb-4 cursor-pointer group shrink-0">
        <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#1D3557] flex items-center justify-center text-white shadow-sm font-extrabold text-[13px] tracking-tight">
            BA
          </div>
        </div>
        
        <span className={`text-[16px] font-extrabold text-[#1D3557] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pl-2 ${
          isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0'
        }`}>
          {username ? username : "Gestor BA"}
        </span>
      </div>

      {/* ================= NAVEGAÇÃO COM ESPAÇAMENTOS VERTICAIS ESTÁTICOS ================= */}
      <nav className="flex-1 w-full flex flex-col gap-1 overflow-y-auto overflow-x-hidden hide-scroll">
        
        {/* SEÇÃO: MENU (ALTURA FIXA h-[18px] SEMPRE RESERVADA) */}
        <div className="w-full h-[18px] flex items-center px-2 shrink-0">
          <span className={`text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
          }`}>
            Menu
          </span>
        </div>

        {navItemsGroup1.map((item) => {
          const isDashboardItem = item.label === 'Dashboard';
          const isModuleActive = modulesItems.some(mod => mod.path === location.pathname);
          const isActive = location.pathname === item.path || (isDashboardItem && isModuleActive);
          return (
            <div key={item.path} className="w-full flex items-center shrink-0">
              <Link
                to={item.path}
                className={`w-full h-[40px] flex items-center rounded-full transition-colors duration-200 ${
                  isActive
                    ? `bg-[#457B9D] text-white shadow-sm shadow-[#457B9D]/20`
                    : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0 pr-2'
                } ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}

        {/* SEÇÃO: MÓDULOS */}
        {!navOnly && (
          <div className="mt-2 flex flex-col gap-1 w-full shrink-0">
            {/* ALTURA FIXA h-[18px] SEMPRE RESERVADA */}
            <div className="w-full h-[18px] flex items-center px-2 shrink-0">
              <span className={`text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
              }`}>
                Módulos
              </span>
            </div>

            {modulesItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path} className="w-full flex items-center shrink-0">
                  <Link
                    to={item.path}
                    className={`w-full h-[40px] flex items-center rounded-full transition-colors duration-200 ${
                      isActive
                        ? `bg-[#457B9D] text-white shadow-sm shadow-[#457B9D]/20`
                        : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    
                    <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0 pr-2'
                    } ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* SEÇÃO: ADMIN */}
        {!navOnly && (
          <div className="mt-2 flex flex-col gap-1 w-full shrink-0">
            {/* ALTURA FIXA h-[18px] SEMPRE RESERVADA */}
            <div className="w-full h-[18px] flex items-center px-2 shrink-0">
              <span className={`text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
              }`}>
                Admin
              </span>
            </div>

            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path} className="w-full flex items-center shrink-0">
                  <Link
                    to={item.path}
                    className={`w-full h-[40px] flex items-center rounded-full transition-colors duration-200 ${
                      isActive
                        ? `bg-[#457B9D] text-white shadow-sm shadow-[#457B9D]/20`
                        : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    
                    <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0 pr-2'
                    } ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ================= CARD DE SUPORTE NO RODAPÉ ================= */}
      <div className={`mt-auto pt-2 w-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden shrink-0 ${
        isCollapsed ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100 h-auto'
      }`}>
        <div className="w-full bg-[#1D3557] rounded-[22px] p-3.5 flex flex-col items-center relative overflow-hidden shadow-sm">
          <img
            src="/img/Brasao-Horizontal_Branco.webp"
            alt="Governo da Bahia"
            className="h-[26px] object-contain opacity-90 mb-1.5 z-10"
          />
          <p className="text-[#F1FAEE]/80 text-[10px] text-center font-medium z-10 leading-relaxed mb-2">
            Gestão integrada da Bahia.
          </p>
          <button className="w-full bg-[#457B9D] text-white text-[10px] font-bold py-1.5 rounded-full hover:bg-[#A8DADC] hover:text-[#1D3557] transition-colors shadow-sm">
            Ver Portal
          </button>
        </div>
      </div>

    </aside>
  );
}