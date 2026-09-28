import React, { useState } from 'react';
import { Printer } from 'lucide-react';

/**
 * Componente unificado para exportação de relatório em PDF na proporção nativa da tela.
 *
 * Pode ser utilizado de duas formas:
 * 1. Com `onClick`: executa a função de impressão fornecida (ex: handlePrint do react-to-print).
 * 2. Com `reportType`, `territorioId`, `reportMode`: exporta o relatório executivo em PDF widescreen 16:9 via Playwright.
 */
export default function ExportPdfButton({
  onClick,
  reportType = 'sintese',
  territorioId = 'bahia',
  reportMode = 'normal',
  isLoading = false,
  className = '',
  title = 'Exportar Relatório Executivo em PDF',
  label = 'Exportar PDF',
  size = 'md', // 'sm' | 'md'
  variant = 'primary' // 'primary' | 'navy' | 'emerald'
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const effectiveLoading = isLoading || internalLoading;

  const handleClick = async (e) => {
    if (effectiveLoading) return;
    if (onClick) {
      onClick(e);
      return;
    }

    const type = reportType === 'cursos'
      ? 'cursos'
      : (reportType === 'ativos'
          ? 'ativos'
          : (reportType === 'cadeias' ? 'cadeias' : 'sintese'));

    let fileBase = 'relatorio_sintese';
    if (type === 'ativos') fileBase = 'relatorio_ativos';
    else if (type === 'cursos') fileBase = 'relatorio_ensino';
    else if (type === 'cadeias') fileBase = 'relatorio_cadeias';

    const terrParam = territorioId && territorioId !== 'bahia'
      ? `territorio=${encodeURIComponent(territorioId)}`
      : 'territorio=bahia';

    const modoParam = `&modo=${reportMode}`;
    const filename = `${fileBase}_${reportMode}.pdf`;
    const apiUrl = `/api/export-pdf?type=${type}&${terrParam}${modoParam}`;

    setInternalLoading(true);

    try {
      const res = await fetch(apiUrl);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('text/html') || contentType.includes('application/json')) {
        let errorMsg = 'Falha ao exportar relatório via Playwright.';
        try {
          const errData = await res.json();
          if (errData?.error) errorMsg = errData.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      if (!blob || blob.size < 500) {
        throw new Error('Arquivo PDF gerado inválido.');
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err) {
      console.error('[ExportPdfButton Playwright] Erro:', err);
      alert(`Erro ao exportar PDF via Playwright: ${err.message || err}`);
    } finally {
      setInternalLoading(false);
    }
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
      disabled={effectiveLoading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center leading-none transition-all cursor-pointer disabled:opacity-60 select-none ${selectedSize} ${selectedVariant} ${className}`}
      title={title}
    >
      {effectiveLoading ? (
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
