import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ExcelExportButton({
  territoriosData = [],
  className = '',
  variant = 'solid' 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportExcel = () => {
    setIsLoading(true);

    try {
      // 1. INICIALIZAR AS 4 MATRIZES DE DADOS (Tabelas)
      const dataTerritorios = [];
      const dataCTI = [];
      const dataCadeias = [];
      const dataMunicipios = [];

      territoriosData.forEach(t => {
        // ABA 1: RESUMO DO TERRITÓRIO (Atualizado com Assistência Pública em CT&I)
        dataTerritorios.push({
          "Território de Identidade": t.nome,
          "Recorte Semiárido": t.isSemiarido ? "Sim" : "Não",
          "IFDM Territorial (Média)": t.kpis?.ifdm !== "-" ? Number(t.kpis.ifdm) : "-",
          "Total Entidades CT&I": Number(t.kpis?.capacidadeCti || 0),
          "Total Cadeias/IGs": Number(t.kpis?.cadeiasIgs || 0),
          "Assistência Pública em CT&I": t.kpis?.conectaBahia || "Não Mapeado"
        });

        // ABA 2: ENTIDADES DE CT&I
        if (t.entidadesDetalhadas && t.entidadesDetalhadas.length > 0) {
          t.entidadesDetalhadas.forEach(ent => {
            dataCTI.push({
              "Território de Identidade": t.nome,
              "Município Sede": ent.municipio || "-",
              "Categoria / Segmento": ent.tipo || ent.categoria || "-",
              "Nome da Instituição": ent.entidade || "-",
            });
          });
        }

        // ABA 3: CADEIAS PRODUTIVAS E IGs
        if (t.cadeiasProdutivasDetalhado && t.cadeiasProdutivasDetalhado.length > 0) {
          t.cadeiasProdutivasDetalhado.forEach(cad => {
            dataCadeias.push({
              "Território de Identidade": t.nome,
              "Segmento": cad.segmento || "-",
              "Classificação": cad.tipo || "-",
              "Entidade Vinculada": cad.entidade || "-",
              "Sede / Satélite": cad.sede || cad.municipioSatelite || "-",
              "Municípios Pertencentes": cad.municipiosPertencentes || "-",
              "Fonte Oficial": cad.fonte || "-"
            });
          });
        }

        // ABA 4: MUNICÍPIOS, IFDM E POPULAÇÃO
        if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
            t.desenvolvimentoDetalhado.forEach(mun => {
                dataMunicipios.push({
                    "Território de Identidade": t.nome,
                    "Município": mun.municipio || "-",
                    "IFDM Municipal": mun.ifdm ? Number(mun.ifdm) : "-",
                    "População Estimada": mun.populacao ? Number(mun.populacao) : "-"
                });
            });
        }
      });

      if (dataTerritorios.length === 0) {
        alert("Nenhum dado disponível para exportação no momento.");
        setIsLoading(false);
        return;
      }

      // 2. CRIAR AS FOLHAS (Worksheets)
      const wsTerritorios = XLSX.utils.json_to_sheet(dataTerritorios);
      const wsCTI = XLSX.utils.json_to_sheet(dataCTI);
      const wsCadeias = XLSX.utils.json_to_sheet(dataCadeias);
      const wsMunicipios = XLSX.utils.json_to_sheet(dataMunicipios);

      // 3. AJUSTAR LARGURAS DAS COLUNAS PARA FICAR PROFISSIONAL
      // Coluna 6 (wch: 32) garante espaço para "Assistência Pública em CT&I"
      wsTerritorios['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 32 }];
      wsCTI['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 55 }];
      wsCadeias['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 45 }, { wch: 25 }, { wch: 50 }, { wch: 30 }];
      wsMunicipios['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 22 }];

      // 4. MONTAR O LIVRO EXCEL (Workbook)
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, wsTerritorios, "Resumo Territorial");
      XLSX.utils.book_append_sheet(workbook, wsCTI, "Infraestrutura CT&I");
      XLSX.utils.book_append_sheet(workbook, wsCadeias, "Cadeias Produtivas");
      XLSX.utils.book_append_sheet(workbook, wsMunicipios, "Municípios e IFDM");

      // 5. EXPORTAR FICHEIRO
      XLSX.writeFile(workbook, "Dados_Consolidados_CT&I_DPPDT.xlsx");

    } catch (err) {
      console.error('Erro ao gerar Excel:', err);
      alert("Ocorreu um erro ao exportar a planilha. Verifique o console.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyles = variant === 'outline'
    ? "w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center shadow-sm border border-slate-200 hover:border-slate-300 transform-gpu"
    : "w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gov-green-600 hover:bg-gov-green-700 text-white font-black tracking-wider uppercase text-xs sm:text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center transform-gpu";

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleExportExcel}
        disabled={isLoading || !territoriosData || territoriosData.length === 0}
        className={buttonStyles}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>A Estruturar Base...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar Planilha Excel</span>
          </>
        )}
      </button>
    </div>
  );
}