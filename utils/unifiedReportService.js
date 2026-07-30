import {
  createPDFDocument,
  addCover,
  addSection,
  addParagraph,
  addTable,
  addImage,
  addFooter,
  htmlElementToBase64,
} from './pdfReportService.js';
import { CATEGORIAS_RELATORIO, getTerritoryArrayByFonte } from './reportCategorias.js';
import {
  buildTopMunicipiosRanking,
  buildMunicipiosInstituicoesList,
  buildCadeiasPorSegmento,
  buildEntidadesPorCategoria,
  classificarInstituicao,
  filterTerritoriosByLocation,
} from './reportAggregation.js';

const ABNT_TOP_MARGIN = 30;

function formatEsfera(cat) {
  if (cat === 'federal' || cat === 'campiUniversidadePublica') return 'Federal';
  if (cat === 'estadual') return 'Estadual';
  if (cat === 'institutoFederal' || cat === 'campiInstitutoFederal') return 'Instituto Federal';
  if (cat === 'privada' || cat === 'campiUniversidadePrivada') return 'Privada';
  return cat || 'Pública';
}

/**
 * Monta cabeçalhos e linhas para a tabela do PDF conforme a categoria
 */
function buildTableDataForCategory(categoryId, territoriosData = [], filtros = {}) {
  if (categoryId === 'cursos') {
    const ranking = buildTopMunicipiosRanking(territoriosData, filtros, 25);
    const totalGeral = ranking.reduce((acc, r) => acc + (r.total || 0), 0);
    const headers = ['Nº', 'Município', 'Qtd. Cursos', 'Participação'];
    const rows = ranking.map((r, idx) => [
      String(idx + 1),
      String(r.municipio || '-'),
      String(r.total || 0),
      totalGeral > 0 ? `${((r.total / totalGeral) * 100).toFixed(1)}%` : '-',
    ]);
    return { headers, rows };
  }

  if (categoryId === 'univ_publicas') {
    const pubEntities = [];
    territoriosData.forEach(t => {
      const arrCap = getTerritoryArrayByFonte(t, 'capacidadeDetalhada');
      arrCap.forEach(ent => {
        if (ent) {
          const info = classificarInstituicao(ent);
          const cat = info.categoria || ent.categoria || '';
          if (
            ['campiUniversidadePublica', 'campiInstitutoFederal', 'federal', 'estadual', 'institutoFederal'].includes(cat)
          ) {
            pubEntities.push(ent);
          }
        }
      });
      const arrCursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
      arrCursos.forEach(c => {
        const info = classificarInstituicao(c);
        if (['campiUniversidadePublica', 'campiInstitutoFederal', 'federal', 'estadual', 'institutoFederal'].includes(info.categoria)) {
          pubEntities.push(c);
        }
      });
    });

    const list = buildMunicipiosInstituicoesList(pubEntities, filtros);
    const headers = ['Nº', 'Município', 'Sigla', 'Instituição', 'Esfera'];
    const rows = [];
    let rowNum = 1;
    list.forEach(m => {
      (m.instituicoes || []).forEach(inst => {
        rows.push([
          String(rowNum++),
          String(m.municipio || '-'),
          String(inst.sigla || '-'),
          String(inst.nome || inst.sigla || '-'),
          formatEsfera(inst.categoria),
        ]);
      });
    });
    return { headers, rows };
  }

  if (categoryId === 'univ_privadas') {
    // Filtramos apenas as entidades e cursos com classificação de instituição privada
    const privEntities = [];
    territoriosData.forEach(t => {
      const arrCap = getTerritoryArrayByFonte(t, 'capacidadeDetalhada');
      arrCap.forEach(ent => {
        if (ent) {
          const info = classificarInstituicao(ent);
          if (
            ent.categoria === 'campiUniversidadePrivada' ||
            ent.categoria === 'privada' ||
            info.isPrivada ||
            info.categoria === 'privada'
          ) {
            privEntities.push(ent);
          }
        }
      });
      const arrCursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
      arrCursos.forEach(c => {
        const info = classificarInstituicao(c);
        if (info.isPrivada || info.categoria === 'privada' || c.categoria === 'campiUniversidadePrivada') {
          privEntities.push(c);
        }
      });
    });

    const listPriv = buildMunicipiosInstituicoesList(privEntities, filtros);
    const headers = ['Nº', 'Município', 'Sigla', 'Instituição', 'Esfera'];
    const rows = [];
    let rowNum = 1;
    listPriv.forEach(m => {
      (m.instituicoes || []).forEach(inst => {
        rows.push([
          String(rowNum++),
          String(m.municipio || '-'),
          String(inst.sigla || '-'),
          String(inst.nome || inst.sigla || '-'),
          'Privada',
        ]);
      });
    });
    return { headers, rows };
  }

  if (categoryId === 'cadeias') {
    const cadeias = buildCadeiasPorSegmento(territoriosData);
    const headers = ['Nº', 'Segmento', 'Sede', 'Território(s)', 'Municípios Pertencentes'];
    const rows = cadeias.map((cad, idx) => [
      String(idx + 1),
      String(cad.segmento || '-'),
      String(cad.sede || '-'),
      String(cad.territorios || '-'),
      String(cad.municipiosPertencentes || '-'),
    ]);
    return { headers, rows };
  }

  if (categoryId === 'ativos_cti') {
    const grupos = buildEntidadesPorCategoria(territoriosData);
    const headers = ['Nº', 'Categoria', 'Entidade / Ativo', 'Município'];
    const rows = [];
    let rowNum = 1;
    grupos.forEach(g => {
      (g.entidades || []).forEach(ent => {
        rows.push([
          String(rowNum++),
          String(g.label || '-'),
          String(ent.entidade || '-'),
          String(ent.municipio || '-'),
        ]);
      });
    });
    return { headers, rows };
  }

  return { headers: ['Descrição'], rows: [['Nenhuma informação disponível']] };
}

/**
 * Geração unificada do relatório em PDF (padrão ABNT simplificado)
 * Para cada ID selecionado: cria título, imagem offscreen capturada e tabela de dados
 */
export async function generateUnifiedReport(options = {}) {
  const {
    categoriasSelecionadasIds = ['cursos', 'univ_publicas', 'univ_privadas', 'cadeias', 'ativos_cti'],
  } = options;

  if (!Array.isArray(categoriasSelecionadasIds) || categoriasSelecionadasIds.length === 0) {
    throw new Error('Nenhuma categoria foi selecionada para a geração do relatório.');
  }

  const pdf = createPDFDocument();

  // 1. Sem capa e 1 página por categoria selecionada (cada relatório gráfico ocupa exatamente 1 página limpa)
  for (let idx = 0; idx < categoriasSelecionadasIds.length; idx++) {
    const id = categoriasSelecionadasIds[idx];
    const config = CATEGORIAS_RELATORIO.find(c => c.id === id);
    if (!config) continue;

    // A primeira categoria usa a página 1 inicial do createPDFDocument(); as seguintes adicionam nova página
    if (idx > 0) {
      pdf.addPage();
    }

    const elementId = `report-image-${id}`;
    const element = document.getElementById(elementId);
    if (element) {
      try {
        const imgBase64 = await htmlElementToBase64(element);
        if (imgBase64) {
          // Imagem ocupa 100% da largura útil (190mm) e altura 266mm, preservando margem em y=282mm para o rodapé ABNT
          pdf.addImage(imgBase64, 'PNG', 10, 10, 190, 266);
        }
      } catch (errImg) {
        console.warn(`Aviso: não foi possível capturar imagem para a categoria ${id}:`, errImg);
      }
    }
  }

  // 2. Adiciona paginação e rodapés ABNT
  addFooter(pdf);

  return pdf;
}

/**
 * Aciona a geração unificada e dispara o download do arquivo PDF no navegador
 */
export async function generateAndDownloadUnifiedReport(options = {}) {
  const pdf = await generateUnifiedReport(options);
  const dateStrFile = new Date().toISOString().split('T')[0];
  const filename = options.filename || `Relatorio_CTI_Bahia_${dateStrFile}.pdf`;
  pdf.save(filename);
  return pdf;
}

export default {
  generateUnifiedReport,
  generateAndDownloadUnifiedReport,
};
