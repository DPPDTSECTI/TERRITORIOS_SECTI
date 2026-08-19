import React, { useState } from 'react';
import { Home, LayoutDashboard, FileText, Info, Database, GraduationCap, GitPullRequest, GripVertical } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

function SortableSidebarItem({ item, isActive, isCollapsed }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative flex items-center w-full ${isDragging ? 'opacity-70' : ''}`}>
      <Link
        to={item.path}
        className={`w-full h-[40px] flex items-center rounded-full transition-colors duration-150 ${
          isActive
            ? `bg-[#457B9D] text-white shadow-sm shadow-[#457B9D]/20`
            : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
          <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        
        <span className={`text-[13px] tracking-tight flex-1 text-left whitespace-nowrap overflow-hidden transition-all duration-200 ${
          isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100 pr-1'
        } ${isActive ? 'font-bold' : 'font-medium'}`}>
          {item.label}
        </span>

        {/* DRAG HANDLE DISCRETO */}
        {!isCollapsed && (
          <div 
            {...attributes} 
            {...listeners} 
            className={`p-1 mr-2 cursor-grab active:cursor-grabbing rounded-md transition-opacity shrink-0 flex items-center justify-center opacity-30 hover:opacity-100 ${
              isActive ? 'text-white hover:bg-white/20' : 'text-[#A0AEC0] hover:text-[#1D3557] hover:bg-[#1D3557]/10'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <GripVertical size={14} />
          </div>
        )}
      </Link>
    </div>
  );
}

export default function Sidebar({ username, navOnly = false }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    setIsCollapsed(true);
  };

  const navItemsGroup1 = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/territorios', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/relatorio', label: 'Relatório', icon: FileText },
    { path: '/sobre', label: 'Sobre', icon: Info },
  ];

  const INITIAL_MODULES = [
    { path: '/territorios', label: 'Visão Geral', icon: LayoutDashboard },
    { path: '/ativos', label: 'Ativos', icon: Database },
    { path: '/cadeia', label: 'Cadeia', icon: GitPullRequest },
    { path: '/cursos', label: 'Cursos', icon: GraduationCap },
  ];

  const [modulesItems, setModulesItems] = useState(() => {
    const saved = localStorage.getItem('sidebar-modules-order');
    if (saved) {
      try {
        const order = JSON.parse(saved);
        const restored = order.map(path => INITIAL_MODULES.find(i => i.path === path)).filter(Boolean);
        const missing = INITIAL_MODULES.filter(i => !order.includes(i.path));
        return [...restored, ...missing];
      } catch (e) {
        return INITIAL_MODULES;
      }
    }
    return INITIAL_MODULES;
  });

  const adminItems = [
    { path: '/admin', label: 'Ativos de CTI', icon: Database },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setModulesItems((items) => {
        const oldIndex = items.findIndex(i => i.path === active.id);
        const newIndex = items.findIndex(i => i.path === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('sidebar-modules-order', JSON.stringify(newArray.map(i => i.path)));
        return newArray;
      });
    }
  };

  return (
    <aside 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`h-[calc(100vh-48px)] my-6 ml-6 bg-white rounded-[28px] shadow-[0_8px_30px_rgba(29,53,87,0.04)] flex flex-col py-6 flex-shrink-0 z-50 font-sans select-none relative transition-[width] duration-200 ease-out px-3.5 overflow-hidden ${
        isCollapsed ? 'w-[68px]' : 'w-[190px]'
      }`}
    >

      {/* ================= TOPO: LOGO (EIXO HORIZONTAL TRAVADO) ================= */}
      <div className="w-full h-[40px] flex items-center mb-5 cursor-pointer group">
        <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#1D3557] flex items-center justify-center text-white shadow-sm font-extrabold text-[13px] tracking-tight">
            BA
          </div>
        </div>
        
        <span className={`text-[16px] font-extrabold text-[#1D3557] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 pl-2 ${
          isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'
        }`}>
          {username ? username : "Gestor BA"}
        </span>
      </div>

      {/* ================= NAVEGAÇÃO ================= */}
      <nav className="flex-1 w-full flex flex-col gap-1 overflow-y-auto overflow-x-hidden hide-scroll">
        
        {/* SEÇÃO: MENU */}
        <div className={`px-2 transition-all duration-150 overflow-hidden ${isCollapsed ? 'opacity-0 h-0 m-0' : 'opacity-100 h-auto mb-0.5 mt-1'}`}>
          <span className="text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest">Menu</span>
        </div>

        {navItemsGroup1.map((item) => {
          const isDashboardItem = item.label === 'Dashboard';
          const isModuleActive = INITIAL_MODULES.some(mod => mod.path === location.pathname);
          const isActive = location.pathname === item.path || (isDashboardItem && isModuleActive);
          return (
            <div key={item.path} className="w-full flex items-center">
              <Link
                to={item.path}
                className={`w-full h-[40px] flex items-center rounded-full transition-colors duration-150 ${
                  isActive
                    ? `bg-[#457B9D] text-white shadow-sm shadow-[#457B9D]/20`
                    : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100 pr-2'
                } ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}

        {/* SEÇÃO: MÓDULOS (DRAGGABLE) */}
        {!navOnly && (
          <div className="mt-3 flex flex-col gap-1 w-full">
            <div className={`px-2 transition-all duration-150 overflow-hidden ${isCollapsed ? 'opacity-0 h-0 m-0' : 'opacity-100 h-auto mb-0.5'}`}>
              <span className="text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest">Módulos</span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
              <SortableContext 
                items={modulesItems.map(i => i.path)}
                strategy={verticalListSortingStrategy}
              >
                {modulesItems.map((item) => (
                  <SortableSidebarItem 
                    key={item.path} 
                    item={item} 
                    isActive={location.pathname === item.path} 
                    isCollapsed={isCollapsed}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* SEÇÃO: ADMIN */}
        {!navOnly && (
          <div className="mt-3 flex flex-col gap-1 w-full">
            <div className={`px-2 transition-all duration-150 overflow-hidden ${isCollapsed ? 'opacity-0 h-0 m-0' : 'opacity-100 h-auto mb-0.5'}`}>
              <span className="text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest">Admin</span>
            </div>

            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path} className="w-full flex items-center">
                  <Link
                    to={item.path}
                    className={`w-full h-[40px] flex items-center rounded-full transition-colors duration-150 ${
                      isActive
                        ? `bg-[#457B9D] text-white shadow-sm shadow-[#457B9D]/20`
                        : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    
                    <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ${
                      isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100 pr-2'
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
      <div className={`mt-auto pt-3 w-full transition-all duration-200 overflow-hidden ${
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
