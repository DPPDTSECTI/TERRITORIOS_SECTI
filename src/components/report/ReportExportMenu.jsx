import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import { CATEGORIAS_RELATORIO } from '../../../utils/reportCategorias.js';
import { generateAndDownloadUnifiedReport } from '../../../utils/unifiedReportService.js';
import { exportToExcel } from '../ExcelExportButton.jsx';

export default function ReportExportMenu({
  territoriosData = [],
  filtros = {},
  darkMode = false,
  className = '',
  variant = 'nav',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(() =>
    CATEGORIAS_RELATORIO.map((c) => c.id)
  );
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedCategories.length === CATEGORIAS_RELATORIO.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(CATEGORIAS_RELATORIO.map((c) => c.id));
    }
  };

  const handleExportPDF = async () => {
    if (selectedCategories.length === 0) {
      alert('Selecione ao menos uma categoria para gerar o relatório PDF.');
      return;
    }

    setIsExporting(true);
    setExportStatus('Gerando PDF institucional...');
    try {
      await generateAndDownloadUnifiedReport({
        categoriasSelecionadasIds: selectedCategories,
        territoriosData,
        filtros,
        title: 'Programa de Ciência, Tecnologia e Inovação',
        subtitle:
          filtros?.selectedLocation && (filtros.selectedLocation.matchType === 'Território' || !filtros.selectedLocation.matchType)
            ? `Relatório Agregado — Território ${filtros.selectedLocation.nome || filtros.selectedLocation.territory}`
            : 'Relatório Institucional Agregado — Todos os Territórios do Estado da Bahia',
      });
    } catch (err) {
      console.error('Erro ao gerar PDF unificado:', err);
      alert('Erro ao exportar relatório PDF. Verifique o console.');
    } finally {
      setIsExporting(false);
      setExportStatus(null);
      setIsOpen(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    setExportStatus('Estruturando planilha Excel...');
    try {
      exportToExcel(territoriosData);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      alert('Erro ao exportar planilha Excel. Verifique o console.');
    } finally {
      setIsExporting(false);
      setExportStatus(null);
      setIsOpen(false);
    }
  };

  const buttonStyle =
    variant === 'nav'
      ? `p-2.5 rounded-lg transition-colors flex items-center justify-center ${
          isOpen
            ? darkMode
              ? 'bg-gov-blue text-white shadow-md'
              : 'bg-gov-blue text-white shadow-md'
            : darkMode
              ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gov-blue'
        }`
      : `px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg ${
          darkMode
            ? 'bg-gov-blue hover:bg-blue-600 text-white'
            : 'bg-gov-green-600 hover:bg-gov-green-700 text-white'
        }`;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`${buttonStyle} ${className}`}
        title="Exportar Relatórios Agregados (PDF / Excel)"
      >
        {isExporting ? (
          <Loader2 size={18} className="animate-spin text-blue-500" />
        ) : (
          <Download size={18} strokeWidth={2.2} />
        )}
        {variant !== 'nav' && (
          <>
            <span className="hidden md:inline">
              {isExporting ? exportStatus || 'Exportando...' : 'Exportar Relatório'}
            </span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`${
            variant === 'nav'
              ? 'absolute right-[125%] bottom-0'
              : 'absolute right-0 top-full mt-2'
          } w-80 sm:w-84 rounded-2xl shadow-2xl border backdrop-blur-xl z-[300] overflow-hidden transition-all animate-soft-fade ${
            darkMode
              ? 'bg-gray-900/95 border-gray-700 text-gray-200'
              : 'bg-white/95 border-gray-200 text-gray-800'
          }`}
        >
          <div className={`px-4 py-3.5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200/60'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText size={15} className={darkMode ? 'text-blue-400' : 'text-gov-blue'} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-gov-blue'}`}>
                  Seções do Relatório PDF
                </span>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  selectedCategories.length === CATEGORIAS_RELATORIO.length
                    ? darkMode
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-500 hover:bg-gray-100'
                    : darkMode
                      ? 'text-blue-400 hover:bg-blue-900/30'
                      : 'text-gov-blue hover:bg-gov-blue/10'
                }`}
              >
                {selectedCategories.length === CATEGORIAS_RELATORIO.length
                  ? 'Desmarcar todas'
                  : 'Marcar todas'}
              </button>
            </div>
            <p className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 font-medium`}>
              Escolha as categorias para compor o arquivo
            </p>
            <div className={`mt-2.5 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold border ${
              darkMode ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <span>{filtros?.selectedLocation && (filtros.selectedLocation.matchType === 'Território' || !filtros.selectedLocation.matchType) ? '📍' : '🌐'}</span>
              <span className="truncate">
                {filtros?.selectedLocation && (filtros.selectedLocation.matchType === 'Território' || !filtros.selectedLocation.matchType)
                  ? `Território: ${filtros.selectedLocation.nome || filtros.selectedLocation.territory}`
                  : 'Escopo: Todos os Territórios da Bahia'}
              </span>
            </div>
          </div>

          <div className="px-3 py-2 space-y-1 max-h-56 overflow-y-auto hide-scroll">
            {CATEGORIAS_RELATORIO.map((cat) => {
              const checked = selectedCategories.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all select-none text-xs font-semibold ${
                    checked
                      ? darkMode
                        ? 'bg-blue-950/40 text-gray-100 border border-blue-500/30'
                        : 'bg-gov-blue/5 text-gray-900 border border-gov-blue/20'
                      : darkMode
                        ? 'hover:bg-gray-800/60 text-gray-400 border border-transparent'
                        : 'hover:bg-gray-100/80 text-gray-600 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors flex-shrink-0 ${
                      checked
                        ? darkMode
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-gov-blue text-white border border-gov-blue'
                        : darkMode
                          ? 'border border-gray-600 bg-gray-800/80'
                          : 'border border-gray-300 bg-white'
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="truncate">{cat.label}</span>
                </label>
              );
            })}
          </div>

          <div className={`p-3 border-t space-y-2 ${darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-gray-50/80 border-gray-200/60'}`}>
            <button
              onClick={handleExportPDF}
              disabled={isExporting || selectedCategories.length === 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                selectedCategories.length === 0
                  ? darkMode
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : darkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                    : 'bg-gov-blue hover:bg-gov-blue-dark text-white shadow-blue-500/15 hover:shadow-lg'
              }`}
            >
              <FileText size={15} />
              <span>{isExporting ? (exportStatus || 'Gerando...') : 'Gerar Relatório PDF'}</span>
              {selectedCategories.length > 0 && !isExporting && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-black ${darkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-800 text-blue-100'}`}>
                  {selectedCategories.length}
                </span>
              )}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className={`w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                darkMode
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
            >
              <FileSpreadsheet size={15} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
              <span>Exportar Planilha (Excel)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

