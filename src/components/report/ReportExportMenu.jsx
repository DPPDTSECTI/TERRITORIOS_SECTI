import React, { useState, useRef, useEffect } from 'react';
import { Download, Image, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import { exportReportAsImage } from '../../../utils/reportExportService.js';
import { generateAndDownloadReport } from '../../../utils/pdfReportService.js';
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

  const handleExportPNG = async (elementId, prefix) => {
    setIsExporting(true);
    setExportStatus('Gerando imagem PNG...');
    try {
      await exportReportAsImage(elementId, prefix);
    } catch (err) {
      console.error('Erro ao exportar PNG:', err);
      alert('Erro ao exportar imagem PNG. Verifique se o elemento está disponível.');
    } finally {
      setIsExporting(false);
      setExportStatus(null);
      setIsOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportStatus('Gerando PDF institucional...');
    try {
      const munEl = document.getElementById('municipios-report-image');
      const heatEl = document.getElementById('area-heatmap-image');

      await generateAndDownloadReport({
        title: 'Programa de Ciência, Tecnologia e Inovação',
        subtitle: filtros.selectedLocation
          ? `Relatório Agregado — ${filtros.selectedLocation.nome || filtros.selectedLocation.territory}`
          : 'Relatório Institucional Agregado — Estado da Bahia',
        municipiosData: territoriosData,
        municipiosReportElement: munEl,
        heatmapReportElement: heatEl,
        includeMunicipiosReport: Boolean(munEl),
        includeHeatmapReport: Boolean(heatEl),
        includeMap: false,
        includeStatistics: false,
        includeData: false,
        filename: `Relatorio_CTI_Bahia_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
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

  const buttonStyle = variant === 'nav'
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
        title="Exportar Relatórios Agregados (PNG / PDF / Excel)"
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
            <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border backdrop-blur-md z-50 overflow-hidden transform transition-all ${
            darkMode
              ? 'bg-gray-900/95 border-gray-700 text-gray-200'
              : 'bg-white/95 border-gray-200 text-gray-800'
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Opções de Exportação
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Aplicável aos filtros atualmente selecionados
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleExportPNG('municipios-report-image', 'relatorio_municipios_secti')}
              disabled={isExporting}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Image size={16} className="text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-bold">Exportar Imagem (PNG)</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Mapa e Municípios com Ensino Superior</div>
              </div>
            </button>

            <button
              onClick={() => handleExportPNG('area-heatmap-image', 'relatorio_heatmap_secti')}
              disabled={isExporting}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Image size={16} className="text-indigo-500 flex-shrink-0" />
              <div>
                <div className="font-bold">Exportar Heatmap (PNG)</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Matriz Município × Área do Conhecimento</div>
              </div>
            </button>

            <div className="my-1 border-t border-gray-200/60 dark:border-gray-800"></div>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FileText size={16} className="text-red-500 flex-shrink-0" />
              <div>
                <div className="font-bold">Exportar PDF Completo</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Relatório institucional padrão ABNT</div>
              </div>
            </button>

            <div className="my-1 border-t border-gray-200/60 dark:border-gray-800"></div>

            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-3 transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <FileSpreadsheet size={16} className="text-green-600 flex-shrink-0" />
              <div>
                <div className="font-bold">Exportar Planilha (Excel)</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">Dados consolidados em 5 abas (.xlsx)</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
