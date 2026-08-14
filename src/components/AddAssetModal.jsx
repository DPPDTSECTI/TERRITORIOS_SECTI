import React, { useState } from 'react';
import { X } from 'lucide-react';
import CitySelect from './CitySelect';

export default function AddAssetModal({ isOpen, onClose, onSave }) {
  const [newAtivo, setNewAtivo] = useState({ nome: '', tipo: '', municipio: '', referencia: '', sigla: '' });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave([newAtivo]);
    setNewAtivo({ nome: '', tipo: '', municipio: '', referencia: '', sigla: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-sm rounded-full">
              Novo Ativo
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Nome do ativo</label>
              <input 
                type="text" 
                placeholder="Ex: Senai CIMATEC" 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                value={newAtivo.nome} 
                onChange={e => setNewAtivo({...newAtivo, nome: e.target.value})} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Tipo de Ativo</label>
              <input 
                type="text" 
                placeholder="Ex: Hub, Parque..." 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                value={newAtivo.tipo} 
                onChange={e => setNewAtivo({...newAtivo, tipo: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Município Sede</label>
              <CitySelect value={newAtivo.municipio} onChange={val => setNewAtivo({...newAtivo, municipio: val})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Referência</label>
              <input 
                type="text" 
                placeholder="Ex: SECTI, FIEB..." 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                value={newAtivo.referencia} 
                onChange={e => setNewAtivo({...newAtivo, referencia: e.target.value})} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase px-1">Sigla</label>
              <input 
                type="text" 
                placeholder="Ex: EXM" 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100" 
                value={newAtivo.sigla} 
                onChange={e => setNewAtivo({...newAtivo, sigla: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95">Salvar Registro</button>
        </div>
      </div>
    </div>
  );
}
