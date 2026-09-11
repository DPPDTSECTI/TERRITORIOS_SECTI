import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Filter, Search, Pencil, ChevronDown, FileText, MapPin, Layers, CheckCircle, Settings, LogOut } from 'lucide-react';
import UserHeaderProfile from './UserHeaderProfile';

export default function AdminPage() {
 const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
 const dropdownRef = useRef(null);

 useEffect(() => {
 function handleClickOutside(event) {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
 setIsAddDropdownOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const [ativos, setAtivos] = useState([
 { id: 1, nome: 'Senai CIMATEC', tipo: 'Hub', municipio: 'Salvador', referencia: 'FIEB', sigla: 'CIMATEC' },
 { id: 2, nome: 'Parque Tecnológico', tipo: 'Parque', municipio: 'Salvador', referencia: 'SECTI', sigla: 'PTB' },
 { id: 3, nome: 'Polo de Inovação', tipo: 'Polo', municipio: 'Ilhéus', referencia: 'UESC', sigla: 'CEPEDI' },
 { id: 4, nome: 'Incubadora Casulo', tipo: 'Incubadora', municipio: 'Feira de Santana', referencia: 'UEFS', sigla: 'INC' },
 { id: 5, nome: 'Hub de IA', tipo: 'Hub', municipio: 'Vitória da Conquista', referencia: 'UESB', sigla: 'HIA' },
 { id: 6, nome: 'Centro de Pesquisa', tipo: 'Laboratório', municipio: 'Camaçari', referencia: 'IFBA', sigla: 'CPQ' },
 ]);

 const handleDeleteRow = (id) => {
 setAtivos(ativos.filter(ativo => ativo.id !== id));
 };

 const handleSaveAssets = (newAssets) => {
 const validAssets = newAssets.filter(a => a.nome || a.municipio);
 if (validAssets.length > 0) {
 setAtivos([...ativos, ...validAssets]);
 }
 };

 const getBadgeStyle = (tipo) => {
 const t = tipo?.toLowerCase() || '';
 if (t.includes('hub')) return 'bg-primary-200 text-text-primary';
 if (t.includes('parque')) return 'bg-primary-300 text-text-primary';
 if (t.includes('polo')) return 'bg-primary-600 text-surface-soft';
 if (t.includes('incubadora')) return 'bg-primary-900 text-surface-soft';
 if (t === '') return 'bg-surface-soft text-text-secondary';
 return 'bg-primary-200 text-text-secondary';
 };

 return (
 <div className="w-full h-screen py-6 pr-6 pl-5 bg-surface-soft font-sans flex flex-col overflow-hidden">
 <div className="max-w-[1300px] w-full h-full mx-auto flex flex-col gap-6">
 
 {/* HEADER DA PÁGINA */}
 <div className="flex items-center justify-between w-full">
 <div>
 <h1 className="text-3xl font-bold text-text-primary tracking-tight">Ativos de CTI</h1>
 <p className="text-sm text-text-secondary mt-1.5 font-medium">Sexta-feira, 14 de Agosto de 2026</p>
 </div>

 {/* AÇÕES E PERFIL DO USUÁRIO */}
 <UserHeaderProfile />
 </div>

 {/* SUMMARY CARDS */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {/* Card 1 - Destaque Azul */}
 <div className="bg-primary-600 rounded-xl p-7 text-surface-soft flex flex-col shadow-card-soft gap-8 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-card-hover cursor-default group">
 {/* Decoração sutil de fundo */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-surface-soft/10 rounded-lg blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform duration-500 "></div>
 
 <div className="flex justify-between items-start z-10">
 <div className="w-11 h-11 bg-surface-soft text-text-primary rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ">
 <FileText size={20} strokeWidth={2} />
 </div>
 <div className="px-2.5 py-1 bg-primary-900 rounded-full text-[12px] font-medium inline-flex items-center justify-center leading-none">
 +12.4%
 </div>
 </div>
 <div className="z-10 mt-2">
 <p className="text-surface-soft/80 text-[14px] font-medium mb-1">Total de Ativos</p>
 <div className="flex items-baseline gap-2">
 <h2 className="text-[40px] leading-none font-medium tracking-tight">{ativos.length}</h2>
 <span className="text-surface-soft/60 text-[13px] font-medium max-w-[80px] leading-tight"></span>
 </div>
 </div>
 </div>

 {/* Card 2 - Branco */}
 <div className="bg-white rounded-xl p-7 flex flex-col shadow-card-soft gap-8 border border-transparent hover:border-primary-200/50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-card-hover cursor-default group">
 <div className="flex justify-between items-start">
 <div className="w-11 h-11 text-text-secondary rounded-xl flex items-center justify-center bg-primary-200 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]  group-hover:rotate-3">
 <MapPin size={20} strokeWidth={2} />
 </div>
 <div className="px-2.5 py-1 bg-primary-300/30 text-text-primary rounded-full text-[12px] font-medium inline-flex items-center justify-center leading-none">
 +8.4%
 </div>
 </div>
 <div className="mt-2">
 <p className="text-text-secondary text-[14px] font-medium mb-1">Municípios Cobertos</p>
 <div className="flex items-baseline gap-2">
 <h2 className="text-[40px] leading-none font-medium text-text-primary tracking-tight">43</h2>
 <span className="text-primary-300 text-[13px] font-medium max-w-[80px] leading-tight"></span>
 </div>
 </div>
 </div>

 {/* Card 3 - Branco */}
 <div className="bg-white rounded-xl p-7 flex flex-col shadow-card-soft gap-8 border border-transparent hover:border-primary-200/50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-card-hover cursor-default group">
 <div className="flex justify-between items-start">
 <div className="w-11 h-11 text-text-secondary rounded-xl flex items-center justify-center bg-primary-200 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]  group-hover:rotate-[-3deg]">
 <Layers size={20} strokeWidth={2} />
 </div>
 <div className="px-2.5 py-1 bg-surface-soft text-text-secondary rounded-full text-[12px] font-medium inline-flex items-center justify-center leading-none">
 -2.08%
 </div>
 </div>
 <div className="mt-2">
 <p className="text-text-secondary text-[14px] font-medium mb-1">Tipos de Ativo</p>
 <div className="flex items-baseline gap-2">
 <h2 className="text-[40px] leading-none font-medium text-text-primary tracking-tight">12</h2>
 </div>
 </div>
 </div>

 {/* Card 4 - Branco */}
 <div className="bg-white rounded-xl p-7 flex flex-col shadow-card-soft gap-8 border border-transparent hover:border-primary-200/50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:shadow-card-hover cursor-default group">
 <div className="flex justify-between items-start">
 <div className="w-11 h-11 text-text-secondary rounded-xl flex items-center justify-center bg-primary-200 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]  group-hover:rotate-3">
 <CheckCircle size={20} strokeWidth={2} />
 </div>
 <div className="px-2.5 py-1 bg-primary-300/30 text-text-primary rounded-full text-[12px] font-medium inline-flex items-center justify-center leading-none">
 +12.1%
 </div>
 </div>
 <div className="mt-2">
 <p className="text-text-secondary text-[14px] font-medium mb-1">Marcados REP</p>
 <div className="flex items-baseline gap-2">
 <h2 className="text-[40px] leading-none font-medium text-text-primary tracking-tight">0</h2>
 </div>
 </div>
 </div>
 </div>

 {/* LISTAGEM PRINCIPAL COMO UM DASHBOARD CARD */}
 <div className="w-full bg-white rounded-xl shadow-card-soft hover:shadow-card-hover transition-shadow duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-7 md:p-8 flex flex-col flex-1 min-h-0">
 
 {/* HEADER DA TABELA */}
 <div className="flex flex-col md:flex-row md:items-center justify-between w-full mb-8 gap-4">
 <div>
 <h2 className="text-[22px] font-medium text-text-primary tracking-tight">Lista de Ativos</h2>
 <p className="text-sm text-text-secondary mt-1 font-medium">Track your active locations</p>
 </div>
 
 <div className="flex items-center gap-3">
 <button className="w-11 h-11 bg-surface-soft rounded-lg flex items-center justify-center text-text-primary hover:bg-primary-200 transition-colors shadow-sm">
 <Search size={18} />
 </button>
 <button className="w-11 h-11 bg-surface-soft rounded-lg flex items-center justify-center text-text-primary hover:bg-primary-200 transition-colors shadow-sm relative">
 <Filter size={18} />
 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-300 rounded-full"></span>
 </button>
 
 <div className="relative" ref={dropdownRef}>
 <button 
 onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
 className="h-11 px-6 bg-primary-900 rounded-lg flex items-center gap-2 text-surface-soft hover:bg-primary-600 transition-all font-medium text-[15px] shadow-lg shadow-primary-900/20 "
 >
 <Plus size={18} strokeWidth={2} />
 <span>Novo Ativo</span>
 </button>

 {/* DROPDOWN MENU */}
 {isAddDropdownOpen && (
 <div className="absolute right-[calc(100%+12px)] top-0 w-96 bg-white border border-primary-200 shadow-card-soft rounded-xl p-6 z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-8 h-8 rounded-xl bg-primary-200 text-text-primary flex items-center justify-center">
 <Plus size={16} strokeWidth={2} />
 </div>
 <h3 className="text-[16px] font-medium text-text-primary">Cadastro Rápido</h3>
 </div>
 
 <div className="space-y-3">
 <input type="text" placeholder="Nome do ativo *" className="w-full px-4 py-3 text-sm bg-surface-soft border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all placeholder-primary-600/60 font-medium text-text-primary" id="quick-nome" />
 
 <div className="flex gap-3">
 <select className="w-full px-4 py-3 text-sm bg-surface-soft border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all font-medium text-text-secondary" id="quick-tipo">
 <option value="">Tipo... *</option>
 <option value="Hub">Hub</option>
 <option value="Parque">Parque</option>
 <option value="Polo">Polo</option>
 <option value="Incubadora">Incubadora</option>
 <option value="Laboratório">Laboratório</option>
 </select>
 <input type="text" placeholder="Município *" className="w-full px-4 py-3 text-sm bg-surface-soft border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all placeholder-primary-600/60 font-medium text-text-primary" id="quick-municipio" />
 </div>

 <div className="flex gap-3">
 <input type="text" placeholder="Sigla (Opcional)" className="w-1/3 px-4 py-3 text-sm bg-surface-soft border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all placeholder-primary-600/60 font-medium text-text-primary" id="quick-sigla" />
 <input type="text" placeholder="Referência" className="w-2/3 px-4 py-3 text-sm bg-surface-soft border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all placeholder-primary-600/60 font-medium text-text-primary" id="quick-referencia" />
 </div>
 </div>
 
 <div className="pt-4 mt-2">
 <button 
 onClick={() => {
 const nome = document.getElementById('quick-nome').value;
 const tipo = document.getElementById('quick-tipo').value;
 const municipio = document.getElementById('quick-municipio').value;
 const sigla = document.getElementById('quick-sigla').value;
 const referencia = document.getElementById('quick-referencia').value;
 
 if (nome || municipio) {
 handleSaveAssets([{ id: Date.now(), nome, tipo, municipio, referencia: referencia, sigla: sigla }]);
 setIsAddDropdownOpen(false);
 }
 }}
 className="w-full bg-primary-600 text-surface-soft rounded-xl py-3 text-[14px] font-medium hover:bg-primary-900 transition-all active:scale-[0.98] shadow-md shadow-primary-600/20"
 >
 Salvar Ativo
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* TABLE HEADER */}
 <div className="w-full pb-4 border-b border-primary-200/50 grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.8fr_70px] items-center px-4">
 <span className="text-[12px] font-medium text-primary-300 ">ATIVO</span>
 <span className="text-[12px] font-medium text-primary-300 ">CATEGORIA</span>
 <span className="text-[12px] font-medium text-primary-300 ">LOCALIDADE</span>
 <span className="text-[12px] font-medium text-primary-300 ">FONTE/REF</span>
 <span className="text-[12px] font-medium text-primary-300 ">ABREV.</span>
 <span className="text-[12px] font-medium text-primary-300 text-center">AÇÕES</span>
 </div>

 {/* DATA ROWS */}
 <div className="flex flex-col w-full mt-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
 {ativos.map((ativo) => (
 <div key={ativo.id} className="w-full py-4 border-b border-surface-soft last:border-b-0 grid grid-cols-[1.5fr_1fr_1.2fr_1.2fr_0.8fr_70px] items-center px-4 hover:bg-surface-soft/50 transition-colors group rounded-xl cursor-default">

 <div className="w-full h-full flex items-center pr-2 gap-3.5">
 <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center text-text-primary shrink-0">
 <span className="text-[13px] font-medium">{ativo.nome.charAt(0)}</span>
 </div>
 <span className="text-text-primary font-medium text-[14px] truncate">{ativo.nome}</span>
 </div>

 <div className="w-full h-full flex items-center">
 <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${getBadgeStyle(ativo.tipo)}`}>
 {ativo.tipo}
 </div>
 </div>

 <div className="w-full h-full flex items-center pr-2">
 <span className="text-text-secondary font-medium text-[13px] truncate">{ativo.municipio}</span>
 </div>

 <div className="w-full h-full flex items-center pr-2">
 <span className="text-text-secondary font-medium text-[13px] truncate">{ativo.referencia || '-'}</span>
 </div>

 <div className="w-full h-full flex items-center pr-2">
 <span className="text-text-primary font-medium text-[12px] bg-surface-soft px-2.5 py-1 rounded-lg truncate border border-transparent inline-flex items-center justify-center leading-none">{ativo.sigla || '-'}</span>
 </div>

 <div className="w-full h-full flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-primary-200 transition-colors">
 <Pencil size={16} strokeWidth={2} />
 </button>
 <button onClick={() => handleDeleteRow(ativo.id)} className="text-text-secondary hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
 <Trash2 size={16} strokeWidth={2} />
 </button>
 </div>

 </div>
 ))}
 </div>

 </div>
 </div>
 </div>
 ); 
}

