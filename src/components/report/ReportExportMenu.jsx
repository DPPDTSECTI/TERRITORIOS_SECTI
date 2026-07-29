import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2, CheckSquare, Square } from 'lucide-react';
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
          filtros?.selectedLocation
            ? `Relatório Agregado — ${filtros.selectedLocation.nome || filtros.selectedLocation.territory}`
            : 'Relatório Institucional Agregado — Estado da Bahia',
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
          darkMode
            ? 'text-gray-400 hover:bg-gray-800 hover:text-green-400'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gov-green'
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
          <Loader2 size={18} className="animate-spin text-gov-green-500" />
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
          className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border backdrop-blur-md z-50 overflow-hidden transform transition-all ${
            darkMode
              ? 'bg-gray-900/95 border-gray-700 text-gray-200'
              : 'bg-white/95 border-gray-200 text-gray-800'
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Seções do Relatório PDF
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedCategories.length === CATEGORIAS_RELATORIO.length
                  ? 'Desmarcar todas'
                  : 'Marcar todas'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Escolha as categorias para compor o arquivo
            </p>
          </div>

          <div className="px-4 py-2 space-y-2 max-h-64 overflow-y-auto">
            {CATEGORIAS_RELATORIO.map((cat) => {
              const checked = selectedCategories.includes(cat.id);
              return (
                <label
                  key={cat.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    darkMode
                      ? 'hover:bg-gray-800/80 text-gray-200'
                      : 'hover:bg-gray-100/80 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.id)}
                    className="sr-only"
                  />
                  {checked ? (
                    <CheckSquare size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <Square size={16} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
                  )}
                  <span className="font-medium">{cat.label}</span>
                </label>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200/50 dark:border-gray-800 space-y-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || selectedCategories.length === 0}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow ${
                selectedCategories.length === 0
                  ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              <FileText size={16} />
              <span>Gerar Relatório PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors border ${
                darkMode
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <FileSpreadsheet size={16} className="text-green-600" />
              <span>Exportar Planilha (Excel)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
