import React from 'react';
import { Printer } from 'lucide-react';
import { getReportRoute } from '../../utils/exportReportClient';

/**
 * Componente unificado para exportação de relatório em PDF na proporção nativa da tela.
 *
 * Pode ser utilizado de duas formas:
 * 1. Com `onClick`: executa a função de impressão fornecida (ex: handlePrint do react-to-print).
 * 2. Com `reportType`, `territorioId`, `reportMode`: exporta o relatório executivo em PDF widescreen 16:9.
 */
export default function ExportPdfButton({
  onClick,
  reportType = 'sintese',
  territorioId = 'bahia',
  reportMode = 'normal',
  isLoading = false,
  className = '',
  title = 'Exportar Relatório Executivo em PDF 16:9',
  label = 'Exportar PDF',
  size = 'md', // 'sm' | 'md'
  variant = 'primary' // 'primary' | 'navy' | 'emerald'
}) {
  const handleClick = (e) => {
    if (isLoading) return;
    if (onClick) {
      onClick(e);
      return;
    }

    const type = reportType === 'cursos'
      ? 'cursos'
      : (reportType === 'ativos'
          ? 'ativos'
          : (reportType === 'cadeias' ? 'cadeias' : 'sintese'));

    const route = getReportRoute(type, territorioId, reportMode) + '&autoPrint=1';
    window.open(route, '_blank');
  };

  const variantStyles = {
    primary: 'bg-primary-900 text-white hover:bg-primary-800 shadow-2xs',
    navy: 'bg-[#1D3557] text-white hover:bg-[#2563EB] shadow-xs',
    emerald: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 rounded-lg text-[11px] font-semibold gap-1.5',
    md: 'px-3.5 py-1.5 rounded-xl text-xs font-bold gap-2'
  };

  const selectedVariant = variantStyles[variant] || variantStyles.primary;
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center leading-none transition-all cursor-pointer disabled:opacity-60 select-none ${selectedSize} ${selectedVariant} ${className}`}
      title={title}
    >
      {isLoading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin shrink-0" />
          <span>Gerando PDF...</span>
        </>
      ) : (
        <>
          <Printer size={size === 'sm' ? 14 : 15} className="shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
