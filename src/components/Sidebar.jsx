import React, { useState } from 'react';
import { Home, LayoutDashboard, FileText, Info, Database, GraduationCap, GitPullRequest, Map } from 'lucide-react';
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
      { path: '/territorios', label: 'Visão Geral', icon: LayoutDashboard, tourClass: 'tour-nav-visao' },
      { path: '/ativos', label: 'Ativos', icon: Database, tourClass: 'tour-nav-ativos' },
      { path: '/cadeia', label: 'Cadeia', icon: GitPullRequest, tourClass: 'tour-nav-cadeias' },
      { path: '/cursos', label: 'Cursos', icon: GraduationCap, tourClass: 'tour-nav-cursos' },
   ];

   const adminItems = [
      { path: '/admin', label: 'Ativos de CTI', icon: Database },
   ];

   return (
      <aside
         onMouseEnter={() => setIsCollapsed(false)}
         onMouseLeave={() => setIsCollapsed(true)}
         className={`tour-sidebar h-[calc(100vh-48px)] my-6 ml-6 bg-surface rounded-xl shadow-card-soft border border-border flex flex-col py-6 flex-shrink-0 z-50 font-sans select-none relative transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] px-3.5 overflow-hidden will-change-[width] ${isCollapsed ? 'w-[68px]' : 'w-[190px]'
            }`}
      >

         {/* ================= TOPO: LOGO ================= */}
         <div className="w-full h-[40px] flex items-center mb-4 cursor-pointer group shrink-0">
            <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
               <img src="/img/favicon-96x96.webp" alt="Favicon Mapa" className="w-full h-full object-contain" />
            </div>

            <span className={`text-[16px] font-bold text-text-primary tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pl-2 ${isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0'
               }`}>
               {username ? username : "PTI Bahia"}
            </span>
         </div>

         {/* ================= NAVEGAÇÃO COM ESPAÇAMENTOS VERTICAIS ESTÁTICOS ================= */}
         <nav className="flex-1 w-full flex flex-col gap-1 overflow-y-auto overflow-x-hidden hide-scroll">

            {/* SEÇÃO: MENU (ALTURA FIXA h-[18px] SEMPRE RESERVADA) */}
            <div className="w-full h-[18px] flex items-center px-2 shrink-0">
               <span className={`text-[9px] font-bold text-text-muted uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
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
                        className={`w-full h-[40px] flex items-center rounded-lg transition-colors duration-200 border-l-[3px] ${item.path === '/sobre' ? 'tour-nav-sobre ' : ''}${isActive
                           ? `bg-primary-50 border-primary-600 text-primary-900 shadow-xs font-semibold`
                           : `border-transparent text-text-secondary hover:bg-surface-soft hover:text-text-primary`
                           }`}
                        title={isCollapsed ? item.label : undefined}
                     >
                        <div className="w-[37px] h-[40px] flex items-center justify-center shrink-0">
                           <item.icon size={18} className={isActive ? 'text-primary-600' : 'text-text-muted'} strokeWidth={2} />
                        </div>

                        <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0 pr-2'
                           } ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
                     <span className={`text-[9px] font-bold text-text-muted uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
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
                              className={`w-full h-[40px] flex items-center rounded-lg transition-colors duration-200 border-l-[3px] ${item.tourClass ? item.tourClass + ' ' : ''}${isActive
                                 ? `bg-primary-50 border-primary-600 text-primary-900 shadow-xs font-semibold`
                                 : `border-transparent text-text-secondary hover:bg-surface-soft hover:text-text-primary`
                                 }`}
                              title={isCollapsed ? item.label : undefined}
                           >
                              <div className="w-[37px] h-[40px] flex items-center justify-center shrink-0">
                                 <item.icon size={18} className={isActive ? 'text-primary-600' : 'text-text-muted'} strokeWidth={2} />
                              </div>

                              <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0 pr-2'
                                 } ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
                     <span className={`text-[9px] font-bold text-text-muted uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
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
                              className={`w-full h-[40px] flex items-center rounded-lg transition-colors duration-200 border-l-[3px] ${isActive
                                 ? `bg-primary-50 border-primary-600 text-primary-900 shadow-xs font-semibold`
                                 : `border-transparent text-text-secondary hover:bg-surface-soft hover:text-text-primary`
                                 }`}
                              title={isCollapsed ? item.label : undefined}
                           >
                              <div className="w-[37px] h-[40px] flex items-center justify-center shrink-0">
                                 <item.icon size={18} className={isActive ? 'text-primary-600' : 'text-text-muted'} strokeWidth={2} />
                              </div>

                              <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'w-0 opacity-0 -translate-x-2 pointer-events-none' : 'w-auto opacity-100 translate-x-0 pr-2'
                                 } ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
         <div className={`mt-auto pt-2 w-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden shrink-0 ${isCollapsed ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100 h-auto'
            }`}>
            <div className="w-full bg-primary-900 rounded-xl p-3.5 flex flex-col items-center relative overflow-hidden shadow-sm bg-carto-dots">
               <img
                  src="/img/brasao_preto.webp"
                  alt="Governo da Bahia"
                  className="h-[26px] object-contain opacity-90 mb-1.5 z-10"
               />
               <p className="text-white/80 text-[10px] text-center font-medium z-10 leading-relaxed mb-2">
                  Gestão integrada da Bahia.
               </p>
               <button className="w-full bg-primary-800 text-white text-[11px] font-medium py-1.5 rounded-lg hover:bg-primary-700 transition-colors shadow-xs">
                  Ver Portal
               </button>
            </div>
         </div>

      </aside>
   );
}