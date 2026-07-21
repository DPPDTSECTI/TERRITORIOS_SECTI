import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, RefreshCw } from 'lucide-react';

/**
 * Calcula dinamicamente as larguras ideais para cada coluna da planilha
 * garantindo que nenhum texto fique cortado ou sobreposto.
 */
function calculateColumnWidths(data) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map(key => {
    let maxLen = key.length;
    data.forEach(row => {
      const val = row[key];
      if (val !== null && val !== undefined) {
        const strVal = String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    });
    // Adiciona margem de respiro e define limites razoáveis
    return { wch: Math.min(Math.max(maxLen + 4, 14), 65) };
  });
}

/**
 * Cria a aba (worksheet) com colunas autoajustadas e Filtro Automático ativado
 */
function createOrganizedSheet(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  if (data && data.length > 0) {
    ws['!cols'] = calculateColumnWidths(data);
    const range = XLSX.utils.decode_range(ws['!ref']);
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }
  return ws;
}

/**
 * Função utilitária para ordenação alfabética
 */
function sortAlpha(a, b, key) {
  return String(a[key] || '').localeCompare(String(b[key] || ''), 'pt-BR');
}

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
      // 1. ESTRUTURAR AS TABELAS DE DADOS
      const dataTerritorios = [];
      const dataCTI = [];
      const dataCadeias = [];
      const dataCursos = [];
      const dataMunicipios = [];

      territoriosData.forEach(t => {
        const ifdmVal = t.kpis?.ifdm !== "-" && t.kpis?.ifdm ? Number(t.kpis.ifdm) : (t.desenvolvimento?.ifdmTi ? Number(Number(t.desenvolvimento.ifdmTi).toFixed(3)) : "-");
        const semiaridoQtd = t.qtdSemiarido !== undefined ? t.qtdSemiarido : 0;

        // ABA 1: RESUMO DO TERRITÓRIO
        dataTerritorios.push({
          "Território de Identidade": t.nome || t.regiao || "-",
          "Recorte Semiárido": t.isSemiarido ? "Pertencente" : "Não pertencente",
          "Qtd. Municípios no Semiárido": semiaridoQtd,
          "IFDM Territorial (Média)": ifdmVal,
          "Total Entidades CT&I": Number(t.kpis?.capacidadeCti || (t.entidadesDetalhadas ? t.entidadesDetalhadas.length : 0)),
          "Total Cadeias / IGs": Number(t.kpis?.cadeiasIgs || (t.cadeiasProdutivasDetalhado ? t.cadeiasProdutivasDetalhado.length : 0)),
          "Total Cursos Superiores": t.cursosDetalhado ? t.cursosDetalhado.length : 0,
          "Programa PTI (Assistência Pública)": t.kpis?.conectaBahia || t.kpis?.pti || (t.assistenciaPublica?.existe ? "Presente" : "Não mapeado")
        });

        // ABA 2: INFRAESTRUTURA DE CT&I
        if (t.entidadesDetalhadas && t.entidadesDetalhadas.length > 0) {
          t.entidadesDetalhadas.forEach(ent => {
            dataCTI.push({
              "Território de Identidade": t.nome,
              "Município Sede": ent.municipio || "-",
              "Categoria / Segmento": ent.tipo || ent.categoria || "-",
              "Nome da Instituição": ent.entidade || "-"
            });
          });
        }

        // ABA 3: CADEIAS PRODUTIVAS E IGs
        if (t.cadeiasProdutivasDetalhado && t.cadeiasProdutivasDetalhado.length > 0) {
          t.cadeiasProdutivasDetalhado.forEach(cad => {
            dataCadeias.push({
              "Território de Identidade": t.nome,
              "Segmento": cad.segmento || "-",
              "Classificação / Tipo": cad.tipo || "-",
              "Entidade / Produto": cad.entidade || "-",
              "Sede / Satélite": cad.sede || cad.municipioSatelite || "-",
              "Municípios Pertencentes": cad.municipiosPertencentes || "-",
              "Fonte Oficial": cad.fonte || "-"
            });
          });
        }

        // ABA 4: CURSOS DE ENSINO SUPERIOR EM CT&I
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

        // ABA 5: MUNICÍPIOS, IFDM E POPULAÇÃO
        if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
          t.desenvolvimentoDetalhado.forEach(mun => {
            dataMunicipios.push({
              "Território de Identidade": t.nome,
              "Município": mun.municipio || "-",
              "IFDM Municipal": mun.ifdm ? Number(Number(mun.ifdm).toFixed(3)) : "-",
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

      // 2. ORDENAR OS DADOS PARA UMA APRESENTAÇÃO LÓGICA E ORGANIZADA
      dataTerritorios.sort((a, b) => sortAlpha(a, b, "Território de Identidade"));
      dataCTI.sort((a, b) => sortAlpha(a, b, "Território de Identidade") || sortAlpha(a, b, "Município Sede") || sortAlpha(a, b, "Categoria / Segmento"));
      dataCadeias.sort((a, b) => sortAlpha(a, b, "Território de Identidade") || sortAlpha(a, b, "Segmento"));
      dataCursos.sort((a, b) => sortAlpha(a, b, "Território de Identidade") || sortAlpha(a, b, "Município") || sortAlpha(a, b, "Área Geral"));
      dataMunicipios.sort((a, b) => sortAlpha(a, b, "Território de Identidade") || sortAlpha(a, b, "Município"));

      // 3. CRIAR AS FOLHAS (Worksheets) FORMATADAS
      const wsTerritorios = createOrganizedSheet(dataTerritorios);
      const wsCTI = createOrganizedSheet(dataCTI);
      const wsCadeias = createOrganizedSheet(dataCadeias);
      const wsCursos = createOrganizedSheet(dataCursos);
      const wsMunicipios = createOrganizedSheet(dataMunicipios);

      // 4. MONTAR O LIVRO EXCEL (Workbook)
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, wsTerritorios, "1. Resumo Territorial");
      XLSX.utils.book_append_sheet(workbook, wsCTI, "2. Infraestrutura CT&I");
      XLSX.utils.book_append_sheet(workbook, wsCadeias, "3. Cadeias Produtivas e IGs");
      XLSX.utils.book_append_sheet(workbook, wsCursos, "4. Cursos Ensino Superior");
      XLSX.utils.book_append_sheet(workbook, wsMunicipios, "5. Municípios e IFDM");

      // 5. EXPORTAR FICHEIRO FICANDO COM NOME CLARO E DATA
      const dataFormatada = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Dados_Consolidados_CTI_Bahia_${dataFormatada}.xlsx`);

    } catch (err) {
      console.error('Erro ao gerar Excel:', err);
      alert("Ocorreu um erro ao exportar a planilha. Verifique o console.");
    } finally {
      setIsLoading(false);
    }
  };

  // Variante para Barra Lateral / Ícone (Botão de Seta de Download)
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