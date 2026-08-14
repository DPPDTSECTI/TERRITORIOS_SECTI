import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CitySelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const cities = [
    'Salvador', 'Feira de Santana', 'Camaçari', 'Vitória da Conquista', 
    'Itabuna', 'Juazeiro', 'Ilhéus', 'Lauro de Freitas', 'Jequié', 'Teixeira de Freitas'
  ];

  const filteredCities = cities.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {value ? (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 text-left border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
        >
          {value}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 text-left border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
        >
          Selecione o Município
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 relative shrink-0">
            <input
              type="text"
              placeholder="Pesquise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs py-1.5 pl-2 pr-6 outline-none text-gray-700 placeholder-gray-400 bg-gray-50 rounded"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>
          <div className="max-h-[160px] overflow-y-auto flex flex-col">
            {filteredCities.map(city => (
              <button
                key={city}
                onClick={() => { onChange(city); setIsOpen(false); setSearch(''); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 font-medium shrink-0"
              >
                {city}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <div className="px-3 py-3 text-xs text-gray-400 text-center shrink-0">Nenhum município encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
