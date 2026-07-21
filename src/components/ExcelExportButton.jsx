import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, RefreshCw } from 'lucide-react';

export default function ExcelExportButton({
  territoriosData = [],
  className = '',
  variant = 'solid',
  darkMode = false
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportExcel = () => {
    setIsLoading(true);

    try {
      // 1. INICIALIZAR AS MATRIZES DE DADOS (Tabelas)
      const dataTerritorios = [];
      const dataCTI = [];
      const dataCadeias = [];
      const dataMunicipios = [];
      const dataCursos = [];

      territoriosData.forEach(t => {
        // ABA 1: RESUMO DO TERRITÓRIO
        dataTerritorios.push({
          "Território de Identidade": t.nome,
          "Recorte Semiárido": t.isSemiarido ? "Sim" : "Não",
          "IFDM Territorial (Média)": t.kpis?.ifdm !== "-" ? Number(t.kpis.ifdm) : "-",
          "Total Entidades CT&I": Number(t.kpis?.capacidadeCti || 0),
          "Total Cadeias/IGs": Number(t.kpis?.cadeiasIgs || 0),
          "Assistência Pública em CT&I (PTI)": t.kpis?.conectaBahia || t.kpis?.pti || "Não Mapeado",
          "Total Cursos Superiores": t.cursosDetalhado ? t.cursosDetalhado.length : 0
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

        // ABA 5: CURSOS EM CT&I (ENSINO SUPERIOR)
        if (t.cursosDetalhado && t.cursosDetalhado.length > 0) {
          t.cursosDetalhado.forEach(curso => {
            dataCursos.push({
              "Território de Identidade": t.nome,
              "Município": curso.municipio || "-",
              "Instituição / Entidade": curso.entidade || "-",
              "Nome do Curso": curso.curso || "-",
              "Área Geral": curso.areaGeral || "-",
              "Nível / Grau": curso.nivel || "-",
              "Modalidade": curso.modalidade || "-",
              "Org. Acadêmica": curso.orgAcademica || "-",
              "Categoria Adm.": curso.categoriaAdm || "-",
              "Quantidade": curso.quantidade ? Number(curso.quantidade) : 1
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
      const wsCursos = XLSX.utils.json_to_sheet(dataCursos);

      // 3. AJUSTAR LARGURAS DAS COLUNAS PARA FICAR PROFISSIONAL
      wsTerritorios['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 32 }, { wch: 25 }];
      wsCTI['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 55 }];
      wsCadeias['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 45 }, { wch: 25 }, { wch: 50 }, { wch: 30 }];
      wsMunicipios['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 22 }];
      wsCursos['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];

      // 4. MONTAR O LIVRO EXCEL (Workbook)
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, wsTerritorios, "Resumo Territorial");
      XLSX.utils.book_append_sheet(workbook, wsCTI, "Infraestrutura CT&I");
      XLSX.utils.book_append_sheet(workbook, wsCadeias, "Cadeias Produtivas");
      XLSX.utils.book_append_sheet(workbook, wsMunicipios, "Municípios e IFDM");
      XLSX.utils.book_append_sheet(workbook, wsCursos, "Cursos Ensino Superior");

      // 5. EXPORTAR FICHEIRO
      XLSX.writeFile(workbook, "Dados_Consolidados_CT&I_DPPDT.xlsx");

    } catch (err) {
      console.error('Erro ao gerar Excel:', err);
      alert("Ocorreu um erro ao exportar a planilha. Verifique o console.");
    } finally {
      setIsLoading(false);
    }
  };

  // Nav / Icon Variant (Download Arrow Button)
  if (variant === 'nav' || variant === 'icon') {
    return (
      <button
        onClick={handleExportExcel}
        disabled={isLoading || !territoriosData || territoriosData.length === 0}
        className={className || `p-2.5 rounded-lg transition-colors ${isLoading || !territoriosData || territoriosData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-green-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-green'}`}
        title="Exportar Base de Dados Excel (.xlsx)"
      >
        {isLoading ? (
          <RefreshCw size={18} strokeWidth={2.5} className="animate-spin text-gov-green" />
        ) : (
          <Download size={18} strokeWidth={2.5} />
        )}
      </button>
    );
  }

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
            <RefreshCw className="animate-spin h-4 w-4 mr-2" />
            <span>A Estruturar Base...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            <span>Exportar Planilha Excel</span>
          </>
        )}
      </button>
    </div>
  );
}