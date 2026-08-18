import React, { useState, useEffect, useRef } from 'react';
import { User, Home, LayoutDashboard, FileText, Info, Settings, LogOut, ChevronDown, Search, Database, GraduationCap, GitPullRequest, GripVertical } from 'lucide-react';
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
    <div ref={setNodeRef} style={style} className={`relative flex items-center w-full justify-center ${isDragging ? 'opacity-70 scale-105' : ''}`}>
      <Link
        to={item.path}
        className={`h-[40px] flex items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 ${
          isCollapsed
            ? 'w-[40px] justify-center px-0'
            : 'w-full pl-3.5 pr-2 gap-3'
        } ${
          isActive
            ? `bg-[#457B9D] text-white shadow-md shadow-[#457B9D]/25`
            : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        
        {!isCollapsed && (
          <span className={`text-[13px] tracking-tight flex-1 text-left whitespace-nowrap overflow-hidden ${
            isActive ? 'font-bold' : 'font-medium'
          }`}>
            {item.label}
          </span>
        )}

        {/* DRAG HANDLE DISCRETO */}
        {!isCollapsed && (
          <div 
            {...attributes} 
            {...listeners} 
            className={`p-1 cursor-grab active:cursor-grabbing rounded-md transition-colors shrink-0 flex items-center justify-center opacity-40 hover:opacity-100 ${
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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapseTimeoutRef = useRef(null);

  const startCollapseTimer = () => {
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    collapseTimeoutRef.current = setTimeout(() => {
      setIsCollapsed(true);
    }, 2200);
  };

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    startCollapseTimer();
  };

  useEffect(() => {
    startCollapseTimer();
    return () => {
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    };
  }, []);

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
      className={`h-[calc(100vh-48px)] my-6 ml-6 bg-white rounded-[28px] shadow-[0_8px_30px_rgba(29,53,87,0.04)] flex flex-col py-6 flex-shrink-0 z-50 font-sans select-none relative transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isCollapsed ? 'w-[78px] px-3 items-center' : 'w-[260px] px-4'
      }`}
    >

      {/* ================= TOPO: LOGO ================= */}
      <div className={`w-full flex items-center mb-6 cursor-pointer group transition-all duration-300 ${
        isCollapsed ? 'justify-center' : 'justify-start px-2 gap-3'
      }`}>
        <div className="w-9 h-9 rounded-full bg-[#1D3557] flex items-center justify-center shrink-0 text-white shadow-md transition-transform duration-300 ease-in-out group-hover:scale-105 active:scale-95">
          <span className="text-[14px] font-extrabold tracking-tight">BA</span>
        </div>
        {!isCollapsed && (
          <span className="text-[17px] font-extrabold text-[#1D3557] tracking-tight truncate whitespace-nowrap overflow-hidden">
            {username ? username : "Gestor BA"}
          </span>
        )}
      </div>

      {/* ================= NAVEGAÇÃO ================= */}
      <nav className="flex-1 w-full flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden hide-scroll pt-1">
        
        {/* MENU */}
        {!isCollapsed && (
          <div className="px-3 mb-0.5 mt-1">
            <span className="text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest">Menu</span>
          </div>
        )}

        {navItemsGroup1.map((item) => {
          const isDashboardItem = item.label === 'Dashboard';
          const isModuleActive = INITIAL_MODULES.some(mod => mod.path === location.pathname);
          const isActive = location.pathname === item.path || (isDashboardItem && isModuleActive);
          return (
            <div key={item.path} className="w-full flex justify-center">
              <Link
                to={item.path}
                className={`h-[40px] flex items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 ${
                  isCollapsed
                    ? 'w-[40px] justify-center px-0'
                    : 'w-full px-3.5 gap-3'
                } ${
                  isActive
                    ? `bg-[#457B9D] text-white shadow-md shadow-[#457B9D]/25`
                    : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!isCollapsed && (
                  <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}>
                    {item.label}
                  </span>
                )}
              </Link>
            </div>
          );
        })}

        {/* MÓDULOS (DRAGGABLE) */}
        {!navOnly && (
          <div className="mt-4 flex flex-col gap-1.5 w-full">
            {!isCollapsed && (
              <div className="px-3 mb-0.5">
                <span className="text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest">Módulos</span>
              </div>
            )}

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

        {/* ADMIN */}
        {!navOnly && (
          <div className="mt-4 flex flex-col gap-1.5 w-full">
            {!isCollapsed && (
              <div className="px-3 mb-0.5">
                <span className="text-[9px] font-bold text-[#457B9D]/60 uppercase tracking-widest">Admin</span>
              </div>
            )}

            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path} className="w-full flex justify-center">
                  <Link
                    to={item.path}
                    className={`h-[40px] flex items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 ${
                      isCollapsed
                        ? 'w-[40px] justify-center px-0'
                        : 'w-full px-3.5 gap-3'
                    } ${
                      isActive
                        ? `bg-[#457B9D] text-white shadow-md shadow-[#457B9D]/25`
                        : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557]`
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {!isCollapsed && (
                      <span className={`text-[13px] tracking-tight whitespace-nowrap overflow-hidden ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ================= CARD DE SUPORTE ================= */}
      {!isCollapsed && (
        <div className="mt-auto shrink-0 pt-4 w-full">
          <div className="w-full bg-[#1D3557] rounded-[24px] p-4 flex flex-col items-center relative overflow-hidden shadow-[0_10px_30px_rgba(29,53,87,0.2)] group">
            {/* Círculos decorativos de fundo */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#457B9D]/30 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>

            <img
              src="/img/Brasao-Horizontal_Branco.webp"
              alt="Governo da Bahia"
              className="h-[30px] object-contain opacity-90 mb-2 z-10 hover:opacity-100 transition-opacity duration-300 ease-in-out"
            />
            <p className="text-[#F1FAEE]/80 text-[10px] text-center font-medium z-10 leading-relaxed mb-2.5">
              Gestão integrada do Estado da Bahia.
            </p>
            <button className="w-full bg-[#457B9D] text-white text-[11px] font-bold py-1.5 rounded-full hover:bg-[#A8DADC] hover:text-[#1D3557] transition-all duration-300 ease-in-out active:scale-95 shadow-sm hover:shadow-md">
              Ver Portal
            </button>
          </div>
        </div>
      )}

    </aside>
  );
}
