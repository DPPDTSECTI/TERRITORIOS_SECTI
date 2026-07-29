import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';

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

export function exportToExcel(territoriosData = []) {
  if (!territoriosData || !Array.isArray(territoriosData) || territoriosData.length === 0) return;

  // 1. ESTRUTURAR AS TABELAS DE DADOS
  const dataTerritorios = [];
  const dataCTI = [];
  const dataCadeias = [];
  const dataCursos = [];
  const dataMunicipios = [];

  territoriosData.forEach(t => {
    const ifdmVal = t.kpis?.ifdm !== "-" && t.kpis?.ifdm ? Number(t.kpis.ifdm) : (t.desenvolvimento?.ifdmTi ? Number(Number(t.desenvolvimento.ifdmTi).toFixed(3)) : "-");
    const semiaridoQtd = t.qtdSemiarido !== undefined ? t.qtdSemiarido : 0;
    const semiaridoPct = t.pctSemiarido !== undefined ? Number(t.pctSemiarido) : 0;

    dataTerritorios.push({
      "Território de Identidade": t.nome,
      "Semiárido (Qtd. Municípios)": semiaridoQtd,
      "Semiárido (%)": semiaridoPct,
      "Total Entidades CT&I": t.kpis?.ctiCount ? Number(t.kpis.ctiCount) : 0,
      "Total Cadeias & IGs": t.kpis?.cadeiasCount ? Number(t.kpis.cadeiasCount) : 0,
      "Total Cursos Superiores": t.cursosDetalhado ? t.cursosDetalhado.length : 0,
      "IFDM Território": ifdmVal,
      "Pontos Conecta Bahia": t.iniciativas?.conectaBahia ? Number(t.iniciativas.conectaBahia) : 0
    });

    // ABA 2: ENTIDADES DE CT&I
    if (t.capacidadeDetalhada && t.capacidadeDetalhada.length > 0) {
      t.capacidadeDetalhada.forEach(item => {
        dataCTI.push({
          "Território de Identidade": t.nome,
          "Município": item.municipio || "-",
          "Instituição / Entidade": item.entidade || "-",
          "Categoria": item.categoria || item.tipo || "-",
          "Quantidade": item.quantidade ? Number(item.quantidade) : 1
        });
      });
    }

    // ABA 3: CADEIAS PRODUTIVAS E INDICAÇÕES GEOGRÁFICAS (IGs)
    if (t.cadeiasProdutivasDetalhado && t.cadeiasProdutivasDetalhado.length > 0) {
      t.cadeiasProdutivasDetalhado.forEach(cad => {
        let munStr = "-";
        if (typeof cad.municipioSatelite === 'string' && cad.municipioSatelite.trim() !== '') {
          munStr = cad.municipioSatelite;
        } else if (Array.isArray(cad.municipioSatelite)) {
          munStr = cad.municipioSatelite.join(', ');
        } else if (cad.municipiosPertencentes) {
          munStr = cad.municipiosPertencentes;
        }

        dataCadeias.push({
          "Território de Identidade": t.nome,
          "Nome do Arranjo / IG": cad.entidade || cad.nome || "-",
          "Tipo": cad.tipo || "-",
          "Segmento": cad.segmento || "-",
          "Município Sede": cad.sede || "-",
          "Municípios Envolvidos": munStr,
          "Fonte / Referência": cad.fonte || "-"
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
          "Ano IFDM": mun.anoIfdm || "2016",
          "População": mun.populacao ? Number(mun.populacao) : "-"
        });
      });
    }
  });

  // 2. CRIAR AS WORKSHEETS
  const wsTerritorios = XLSX.utils.json_to_sheet(dataTerritorios);
  const wsCTI = XLSX.utils.json_to_sheet(dataCTI);
  const wsCadeias = XLSX.utils.json_to_sheet(dataCadeias);
  const wsCursos = XLSX.utils.json_to_sheet(dataCursos);
  const wsMunicipios = XLSX.utils.json_to_sheet(dataMunicipios);

  // 3. AUTO-AJUSTAR LARGURAS DAS COLUNAS
  const fitColumns = (ws, data) => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 3, 12), 60) };
    });
  };

  fitColumns(wsTerritorios, dataTerritorios);
  fitColumns(wsCTI, dataCTI);
  fitColumns(wsCadeias, dataCadeias);
  fitColumns(wsCursos, dataCursos);
  fitColumns(wsMunicipios, dataMunicipios);

  // 4. MONTAR E EXPORTAR O WORKBOOK
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsTerritorios, "1. Síntese Territórios");
  XLSX.utils.book_append_sheet(workbook, wsCTI, "2. Infraestrutura CT&I");
  XLSX.utils.book_append_sheet(workbook, wsCadeias, "3. Cadeias Produtivas e IGs");
  XLSX.utils.book_append_sheet(workbook, wsCursos, "4. Cursos Ensino Superior");
  XLSX.utils.book_append_sheet(workbook, wsMunicipios, "5. Municípios e IFDM");

  const dataFormatada = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Dados_Consolidados_CTI_Bahia_${dataFormatada}.xlsx`);
}

export default function ExcelExportButton({
  territoriosData: propTerritoriosData,
  className = '',
  variant = 'solid',
  darkMode: propDarkMode
}) {
  const [isLoading, setIsLoading] = useState(false);
  let contextData;
  try { contextData = useData(); } catch (e) { contextData = null; }

  const territoriosData = (propTerritoriosData && propTerritoriosData.length > 0) ? propTerritoriosData : (contextData?.territoriosData || []);
  const darkMode = propDarkMode !== undefined ? propDarkMode : (contextData?.darkMode || false);

  const handleExportExcel = () => {
    setIsLoading(true);

    try {
      exportToExcel(territoriosData);
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