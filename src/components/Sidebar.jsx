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
    <div ref={setNodeRef} style={style} className={`relative flex items-center w-full ${isDragging ? 'opacity-70 scale-105' : ''}`}>
      <Link
        to={item.path}
        className={`h-[44px] flex items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 ${isCollapsed ? 'w-[44px] shrink-0 mx-auto justify-center px-0' : 'flex-1 w-full pl-3.5 pr-1.5 gap-3'} ${isActive
          ? `bg-[#457B9D] text-white shadow-lg shadow-[#457B9D]/30 ${isCollapsed ? '' : 'translate-x-1'}`
          : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557] ${isCollapsed ? '' : 'hover:translate-x-1'}`
          }`}
      >
        <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`text-[14px] tracking-wide flex-1 text-left transition-all duration-500 whitespace-nowrap overflow-hidden ${isActive ? 'font-bold' : 'font-medium'} ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[120px]'}`}>
          {item.label}
        </span>

        {/* DRAG HANDLE DENTRO DA CÉLULA (LADO DIREITO) */}
        {!isCollapsed && (
        <div 
          {...attributes} 
          {...listeners} 
          className={`p-1.5 cursor-grab active:cursor-grabbing rounded-lg transition-colors shrink-0 flex items-center justify-center ${isActive ? 'text-white/60 hover:text-white hover:bg-white/20' : 'text-[#A0AEC0] hover:text-[#1D3557] hover:bg-[#1D3557]/10'}`}
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
    }, 2000); // minimiza apos 2 segundos
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
      className={`h-[calc(100vh-48px)] my-6 ml-6 bg-white rounded-[28px] shadow-[0_8px_30px_rgba(29,53,87,0.04)] flex flex-col py-6 px-5 flex-shrink-0 z-50 font-sans select-none relative transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[88px]' : 'w-[260px]'}`}
    >

      {/* ================= TOPO: LOGO ================= */}
      <div className={`w-full flex items-center mb-8 cursor-pointer group transition-all duration-500 ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
        <div className="w-8 h-8 rounded-full bg-[#1D3557] flex items-center justify-center shrink-0 text-white shadow-md transition-transform duration-300 ease-in-out group-hover:scale-110 active:scale-95">
          <span className="text-[14px] font-bold">BA</span>
        </div>
        <span className={`text-[18px] font-bold text-[#1D3557] tracking-tight truncate transition-all duration-300 ease-in-out group-hover:text-[#457B9D] whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[150px]'}`}>
          {username ? username : "Gestor BA"}
        </span>
      </div>

      {/* ================= MENU ================= */}
      <div className="mb-3 px-1 mt-2">
        <span className={`text-[10px] font-bold text-[#457B9D]/60 uppercase tracking-widest transition-opacity duration-500 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Menu</span>
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden hide-scroll px-4 -mx-4 pt-1">
        {navItemsGroup1.map((item) => {
          const isDashboardItem = item.label === 'Dashboard';
          const isModuleActive = INITIAL_MODULES.some(mod => mod.path === location.pathname);
          const isActive = location.pathname === item.path || (isDashboardItem && isModuleActive);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`h-[44px] flex items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 ${isCollapsed ? 'w-[44px] shrink-0 mx-auto justify-center px-0' : 'w-full px-3.5 gap-3'} ${isActive
                ? `bg-[#457B9D] text-white shadow-lg shadow-[#457B9D]/30 ${isCollapsed ? '' : 'translate-x-1'}`
                : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557] ${isCollapsed ? '' : 'hover:translate-x-1'}`
                }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[14px] tracking-wide transition-all duration-500 whitespace-nowrap overflow-hidden ${isActive ? 'font-bold' : 'font-medium'} ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[120px]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* MÓDULOS (DRAGGABLE) */}
        {!navOnly && (
          <div className="mt-6 flex flex-col gap-2">
            <div className="px-1 mb-1">
              <span className={`text-[10px] font-bold text-[#457B9D]/60 uppercase tracking-widest transition-opacity duration-500 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Módulos</span>
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

        {/* ADMIN */}
        {!navOnly && (
          <div className="mt-6 flex flex-col gap-2">
            <div className="px-1 mb-1">
              <span className={`text-[10px] font-bold text-[#457B9D]/60 uppercase tracking-widest transition-opacity duration-500 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Admin</span>
            </div>

            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`h-[44px] flex items-center rounded-full transition-all duration-300 ease-in-out active:scale-95 ${isCollapsed ? 'w-[44px] shrink-0 mx-auto justify-center px-0' : 'w-full px-3.5 gap-3'} ${isActive
                    ? `bg-[#457B9D] text-white shadow-lg shadow-[#457B9D]/30 ${isCollapsed ? '' : 'translate-x-1'}`
                    : `text-[#457B9D] hover:bg-[#D6EAF8]/50 hover:text-[#1D3557] ${isCollapsed ? '' : 'hover:translate-x-1'}`
                    }`}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-[#457B9D]'} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[14px] tracking-wide transition-all duration-500 whitespace-nowrap overflow-hidden ${isActive ? 'font-bold' : 'font-medium'} ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[120px]'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* ================= CARD DE SUPORTE (Referência ao Upgrade Pro) ================= */}
      <div className={`mt-auto shrink-0 overflow-hidden transition-all duration-500 ${isCollapsed ? 'opacity-0 max-h-0 pt-0' : 'opacity-100 max-h-[300px] pt-4'}`}>
        <div className="w-full bg-[#1D3557] rounded-[24px] p-5 flex flex-col items-center relative overflow-hidden shadow-[0_10px_30px_rgba(29,53,87,0.2)] group">
          {/* Círculos decorativos de fundo */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#457B9D]/30 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>

          <img
            src="/img/Brasao-Horizontal_Branco.webp"
            alt="Governo da Bahia"
            className="h-[35px] object-contain opacity-90 mb-3 z-10 hover:opacity-100 transition-opacity duration-300 ease-in-out"
          />
          <p className="text-[#F1FAEE]/80 text-[11px] text-center font-medium z-10 leading-relaxed mb-4">
            Gestão integrada do Estado da Bahia.
          </p>
          <button className="w-full bg-[#457B9D] text-white text-[12px] font-bold py-2.5 rounded-full hover:bg-[#A8DADC] hover:text-[#1D3557] transition-all duration-300 ease-in-out active:scale-95 shadow-md hover:shadow-lg hover:-translate-y-1">
            Ver Portal
          </button>
        </div>
      </div>

    </aside>
  );
}
