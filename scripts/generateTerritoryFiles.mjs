import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export function territorySlug(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateTerritoriesSplit(result, publicDir) {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Salvar dados.json completo como fallback
  const fallbackPath = path.join(publicDir, 'dados.json');
  fs.writeFileSync(fallbackPath, JSON.stringify(result, null, 2), 'utf-8');

  // 2. Criar diretório public/data/territorios
  const territoriosDir = path.join(publicDir, 'data', 'territorios');
  if (!fs.existsSync(territoriosDir)) {
    fs.mkdirSync(territoriosDir, { recursive: true });
  }

  const territoriesList = Array.isArray(result.territories) ? result.territories : [];

  // Calcular metaLists (para popular seletores/filtros sem baixar detalhes de todos os territórios)
  const todasAsAreasGerais = Array.from(new Set(
    territoriesList.flatMap(t => (t.cursosDetalhado || []).map(c => c.areaGeral || 'Não Informada'))
  )).sort();

  const aplSegments = new Set();
  const igSegments = new Set();
  territoriesList.forEach(t => {
    (t.cadeiasProdutivasDetalhado || []).forEach(cad => {
      const tipoLower = String(cad.tipo || '').toLowerCase();
      const seg = cad.segmento;
      if (!seg) return;
      if (tipoLower.includes('apl') || tipoLower.includes('arranjo')) {
        aplSegments.add(seg);
      } else if (tipoLower.includes('ig') || tipoLower.includes('indicação')) {
        igSegments.add(seg);
      }
    });
  });
  const todasAsCadeiasPorTipo = {
    APL: Array.from(aplSegments).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    IG: Array.from(igSegments).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  };

  // 3. Gerar arquivos individuais <slug>.json para cada território
  const indexTerritories = territoriesList.map((t) => {
    const slug = territorySlug(t.territory);
    const territoryFilePath = path.join(territoriosDir, `${slug}.json`);

    const territoryDetail = {
      territory: t.territory || '',
      slug,
      isSemiarido: t.isSemiarido || false,
      pctSemiarido: t.pctSemiarido || 0,
      desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
      assistenciaPublica: t.assistenciaPublica || { existe: false, iniciativas: [] },
      capacidadeDetalhada: Array.isArray(t.capacidadeDetalhada) ? t.capacidadeDetalhada : [],
      cadeiasProdutivasDetalhado: Array.isArray(t.cadeiasProdutivasDetalhado) ? t.cadeiasProdutivasDetalhado : [],
      desenvolvimentoDetalhado: Array.isArray(t.desenvolvimentoDetalhado) ? t.desenvolvimentoDetalhado : [],
      cursosDetalhado: Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [],
    };

    fs.writeFileSync(territoryFilePath, JSON.stringify(territoryDetail, null, 2), 'utf-8');

    // Retorna item resumo para index.json
    return {
      territory: t.territory || '',
      slug,
      isSemiarido: t.isSemiarido || false,
      pctSemiarido: t.pctSemiarido || 0,
      desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
      assistenciaPublica: t.assistenciaPublica || { existe: false, iniciativas: [] },
      resumo: {
        ifdmTi: t.desenvolvimento?.ifdmTi || 0,
        populacaoTotal: t.desenvolvimento?.populacaoTotal || 0,
        capacidadeCtiCount: (t.capacidadeDetalhada || []).length,
        cadeiasCount: (t.cadeiasProdutivasDetalhado || []).length,
        cursosCount: (t.cursosDetalhado || []).length,
        iniciativasCount: (t.assistenciaPublica?.iniciativas || []).length,
      },
    };
  });

  // 4. Gerar index.json leve (sem arrays detalhados)
  const indexData = {
    generatedAt: result.generatedAt || new Date().toISOString(),
    semiaridoMunicipiosList: result.semiaridoMunicipiosList || [],
    globalStats: result.globalStats || { totalBahia: 417, totalSemiarido: 0, pctGlobalSemiarido: 0 },
    summary: result.summary || { territories: indexTerritories.length },
    metaLists: {
      todasAsAreasGerais,
      todasAsCadeiasPorTipo
    },
    territories: indexTerritories,
  };

  const indexPath = path.join(territoriosDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');

  return {
    fallbackPath,
    indexPath,
    count: indexTerritories.length,
  };
}

if (process.argv[1] && process.argv[1] === __filename) {
  const publicDir = path.join(ROOT, 'public');
  const dadosJsonPath = path.join(publicDir, 'dados.json');
  if (fs.existsSync(dadosJsonPath)) {
    const raw = fs.readFileSync(dadosJsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const res = generateTerritoriesSplit(parsed, publicDir);
    console.log(`[generateTerritoryFiles] ✓ Gerados ${res.count} territórios e index.json com metaLists em public/data/territorios/`);
  } else {
    console.warn(`[generateTerritoryFiles] Aviso: ${dadosJsonPath} não encontrado.`);
  }
}
