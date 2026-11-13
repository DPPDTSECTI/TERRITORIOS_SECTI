import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  ArrowLeft,
  Search,
  Database,
  GraduationCap,
  GitPullRequest,
  MapPin,
  Award,
  BookOpen,
  Layers,
  Globe
} from 'lucide-react';
import { DataContext } from '../../context/DataContext';
import { isMunicipioSemiarido, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';
import { getDynamicAssetTypeConfig } from '../../constants/assetTypes';
import { normalize } from '../../utils/normalization';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';

function cleanIes(name) {
  if (!name) return '';
  return String(name)
    .replace(/\s*-\s*Campus\b.*$/i, '')
    .replace(/\s*-\s*Polo\b.*$/i, '')
    .replace(/\s*-\s*Unidade\b.*$/i, '')
    .replace(/\s*\((?:campus|polo|sede|ead).*?\)/gi, '')
    .trim();
}

const MUN_LOOKUP = (() => {
  const byName = {};
  municipiosDB.forEach((row) => {
    byName[normalize(row.nome_municipio)] = row;
  });
  return { byName };
})();

export default function RelatorioAnalisePage() {
  const {
    territoriosData = [],
    ativosData = [],
    cursosData = [],
    distribuicaoCadeias = [],
    listaCadeias = [],
    municipiosTerritorios = [],
    loadingStats = false,
    filtroSemiarido
  } = useContext(DataContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTipo = searchParams.get('tipo') || 'sintese';
  const initialTerr = searchParams.get('territorio') || 'bahia';
  const initialModo = searchParams.get('modo') || (filtroSemiarido ? 'semiarido' : 'normal');

  const [activeTab, setActiveTab] = useState(initialTipo);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState(initialTerr);
  const [reportMode, setReportMode] = useState(initialModo);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCover, setShowCover] = useState(true);

  const isSemiarido = reportMode === 'semiarido';

  const sortedTerritorios = useMemo(() => {
    return [...(territoriosData || [])].sort((a, b) =>
      String(a.nome_territorio || a.territorio || '').localeCompare(
        String(b.nome_territorio || b.territorio || ''),
        'pt-BR'
      )
    );
  }, [territoriosData]);

  const selectedTerritory = useMemo(() => {
    if (!selectedTerritoryId || selectedTerritoryId === 'bahia') return null;
    return territoriosData.find(t => String(t.id_territorio) === String(selectedTerritoryId)) || null;
  }, [territoriosData, selectedTerritoryId]);

  const territoryTitle = selectedTerritory
    ? (selectedTerritory.nome_territorio || selectedTerritory.territorio)
    : (isSemiarido ? 'Semiárido Baiano (278 Municípios)' : 'Estado da Bahia (Toda a Bahia)');

  useEffect(() => {
    // Assegura modo claro e nítido para o documento impresso
    try {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } catch (_) { }
  }, []);

  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint') || searchParams.get('autoprint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats) {
      try {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      } catch (_) { }
      const originalTitle = document.title;
      document.title = '';
      const timer = setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('[RelatorioAnalise] Erro ao disparar impressão:', e);
        }
      }, 700);
      return () => {
        clearTimeout(timer);
        document.title = originalTitle;
      };
    }
  }, [searchParams, loadingStats]);

  useEffect(() => {
    const handleAfterPrint = () => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage('analise-print-done', '*');
        }
      } catch (_) { }
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo) setActiveTab(tipo);
  }, [searchParams]);

  // Processamento e enriquecimento dos Ativos
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    return ativosData.map((a, idx) => {
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);
      const munKey = normalize(a.municipio || '');
      const munRow = MUN_LOOKUP.byName[munKey];

      const rawLat = a.latitude != null && a.latitude !== '' ? Number(a.latitude) : null;
      const rawLng = a.longitude != null && a.longitude !== '' ? Number(a.longitude) : null;
      let lat = rawLat;
      let lng = rawLng;
      if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || lat === 0) {
        const fallback = MUNICIPIOS_COORDS[String(a.municipio || '').trim()] ||
          MUNICIPIOS_COORDS[munKey] ||
          [-12.9714, -38.5014];
        lat = fallback[0];
        lng = fallback[1];
      }

      const id_territorio = a.id_territorio != null && a.id_territorio !== ''
        ? Number(a.id_territorio)
        : (munRow?.id_territorio || null);

      const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
      const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || a.rnp === '1' || String(a.rnp || '').toLowerCase() === 'sim';
      const rawSemi = a.semiarido ?? a.semi_arido ?? a.is_semiarido ?? munRow?.semiarido;
      const isSemi = rawSemi === true || String(rawSemi || '').toLowerCase() === 'sim' || isMunicipioSemiarido(a.municipio);

      return {
        id: a.id_ativo || idx + 1,
        id_territorio,
        nome: a.nome_ativo || a.nome || 'Ativo sem nome',
        sigla: (a.sigla || a.sigla_ativo || '').trim(),
        tipo: nomeTipoColuna,
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || munRow?.nome_municipio || '-',
        territorio: cleanTerr || '-',
        lat,
        lng,
        rnp: hasRnp,
        semiarido: isSemi
      };
    });
  }, [ativosData]);

  // Processamento e enriquecimento das Cadeias
  const enrichedCadeias = useMemo(() => {
    const mapCadeias = new Map();
    (distribuicaoCadeias || []).forEach(cad => {
      const key = cad.nome_cadeia || cad.nome || cad.cadeia;
      if (!key) return;
      if (!mapCadeias.has(key)) {
        mapCadeias.set(key, {
          id: cad.id_cadeia || cad.id,
          nome: key,
          segmento: cad.segmento || cad.tipo || 'Setor Econômico',
          shortTipo: cad.segmento || cad.tipo || 'APL',
          territorio_identidade: cad.territorio_identidade || cad.territorio,
          municipio_sede: cad.municipio_sede || cad.municipio,
          id_territorio: cad.id_territorio,
          semiarido: cad.semiarido,
          municipios_cobertos: [],
          territorios_cobertos: new Set()
        });
      }
      const entry = mapCadeias.get(key);
      if (cad.municipio) {
        entry.municipios_cobertos.push({
          id_municipio: cad.id_municipio,
          nome_municipio: cad.municipio,
          id_territorio: cad.id_territorio,
          nome_territorio: cad.territorio,
          semiarido: cad.semiarido || isMunicipioSemiarido(cad.municipio)
        });
      }
      if (cad.territorio) {
        entry.territorios_cobertos.add(cad.territorio.replace(/^Território de Identidade\s+/i, ''));
      }
    });

    (listaCadeias || []).forEach(cad => {
      const key = cad.nome || cad.cadeia;
      if (!key) return;
      if (!mapCadeias.has(key)) {
        mapCadeias.set(key, {
          id: cad.id,
          nome: key,
          segmento: cad.segmento || cad.tipo || 'Setor Econômico',
          shortTipo: cad.segmento || cad.tipo || 'APL',
          territorio_identidade: cad.territorio_sede || cad.territorio,
          municipio_sede: cad.municipio_sede || cad.municipio,
          id_territorio: cad.id_territorio,
          semiarido: cad.semiarido,
          municipios_cobertos: [],
          territorios_cobertos: new Set()
        });
      }
    });

    return Array.from(mapCadeias.values());
  }, [distribuicaoCadeias, listaCadeias]);

  // Escopo de Ativos
  const scopedAtivos = useMemo(() => {
    let list = selectedTerritoryId === 'bahia'
      ? ativosProcessados
      : ativosProcessados.filter(a => String(a.id_territorio) === String(selectedTerritoryId));
    if (isSemiarido) {
      list = list.filter(a => a.semiarido === true);
    }
    return list;
  }, [ativosProcessados, selectedTerritoryId, isSemiarido]);

  // Escopo de Cursos
  const scopedCursos = useMemo(() => {
    let list = selectedTerritoryId === 'bahia'
      ? cursosData
      : cursosData.filter(c => String(c.id_territorio) === String(selectedTerritoryId));
    if (isSemiarido) {
      list = list.filter(c => c.semiarido === true || isMunicipioSemiarido(c.municipio));
    }
    return list;
  }, [cursosData, selectedTerritoryId, isSemiarido]);

  // Escopo de Cadeias
  const scopedCadeias = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    let list = enrichedCadeias;

    if (selectedTerritory) {
      const tid = Number(selectedTerritory.id_territorio);
      const tNorm = normalize(selectedTerritory.nome_territorio || selectedTerritory.territorio);

      list = list.filter(c => {
        const matchSedeId = Number(c.id_territorio) === tid;
        const matchSedeNome = normalize(c.territorio_identidade) === tNorm;
        const matchAbrangencia = c.municipios_cobertos?.some(m =>
          Number(m.id_territorio) === tid || normalize(m.nome_territorio) === tNorm
        );
        return matchSedeId || matchSedeNome || matchAbrangencia;
      });
    }

    if (isSemiarido) {
      list = list.filter(c =>
        c.semiarido === true ||
        isMunicipioSemiarido(c.municipio_sede) ||
        c.municipios_cobertos?.some(m => m.semiarido || isMunicipioSemiarido(m.nome_municipio))
      );
    }

    return list;
  }, [enrichedCadeias, selectedTerritory, isSemiarido]);

  // Escopo de Municípios
  const scopedMunicipios = useMemo(() => {
    let list = selectedTerritoryId === 'bahia'
      ? municipiosTerritorios
      : municipiosTerritorios.filter(m => String(m.id_territorio) === String(selectedTerritoryId));
    if (isSemiarido) {
      list = list.filter(m => isMunicipioSemiarido(m.nome_municipio || m.municipio));
    }
    return list;
  }, [municipiosTerritorios, selectedTerritoryId, isSemiarido]);

  // Estatísticas da Síntese
  const statsSintese = useMemo(() => {
    const totalAtivos = scopedAtivos.length;
    const rnpAtivos = scopedAtivos.filter(a => a.rnp).length;
    const rnpTaxa = totalAtivos > 0 ? ((rnpAtivos / totalAtivos) * 100).toFixed(1) : '0.0';

    const totalCursos = scopedCursos.length;
    const federalCursos = scopedCursos.filter(c => String(c.entidade || c.instituicao || c.nome || '').toLowerCase().includes('federal')).length;
    const estadualCursos = scopedCursos.filter(c => {
      const e = String(c.entidade || c.instituicao || c.nome || '').toLowerCase();
      return e.includes('estadual') || e.includes('estado da bahia');
    }).length;
    const privadaCursos = totalCursos - federalCursos - estadualCursos;
    const eadCursos = scopedCursos.filter(c => c.ead).length;
    const presencialCursos = totalCursos - eadCursos;

    const totalCadeias = scopedCadeias.length;

    const munComAtivo = new Set(scopedAtivos.map(a => a.id_municipio || a.municipio));
    const munComCurso = new Set(scopedCursos.map(c => c.id_municipio || c.municipio));
    const munAtendidos = new Set([...munComAtivo, ...munComCurso]);

    const totalMunEscopo = scopedMunicipios.length || (selectedTerritoryId === 'bahia' ? (isSemiarido ? SEMIARIDO_TOTAL_MUNICIPIOS : BAHIA_TOTAL_MUNICIPIOS) : 0);
    const taxaCoberturaMun = totalMunEscopo > 0 ? ((munAtendidos.size / totalMunEscopo) * 100).toFixed(1) : '0.0';

    let populacaoTotal = 0;
    let ifdmMedio = null;

    if (selectedTerritory) {
      if (isSemiarido) {
        const pct = Number(selectedTerritory.pct_semiarido || 0);
        populacaoTotal = pct > 0 ? Math.round((Number(selectedTerritory.populacao) || 0) * (pct / 100)) : 0;
      } else {
        populacaoTotal = Number(selectedTerritory.populacao) || 0;
      }
      ifdmMedio = selectedTerritory.media_ifdm;
    } else {
      if (isSemiarido) {
        const semiTerrs = (territoriosData || []).filter(t => Number(t.pct_semiarido || t.qtd_mun_semiarido || 0) > 0);
        const somaPop = semiTerrs.reduce((acc, t) => {
          const pct = Number(t.pct_semiarido || 100);
          return acc + Math.round((Number(t.populacao) || 0) * (pct / 100));
        }, 0);
        populacaoTotal = somaPop > 0 ? somaPop : 7150000;
        const validIfdms = semiTerrs.map(t => Number(t.media_ifdm)).filter(n => !isNaN(n) && n > 0);
        ifdmMedio = validIfdms.length > 0 ? (validIfdms.reduce((a, b) => a + b, 0) / validIfdms.length).toFixed(3) : '0.598';
      } else {
        populacaoTotal = territoriosData.reduce((acc, t) => acc + (Number(t.populacao) || 0), 0);
        const validIfdms = territoriosData.map(t => Number(t.media_ifdm)).filter(n => !isNaN(n) && n > 0);
        ifdmMedio = validIfdms.length > 0 ? (validIfdms.reduce((a, b) => a + b, 0) / validIfdms.length).toFixed(3) : '0.620';
      }
    }

    return {
      totalAtivos,
      rnpAtivos,
      rnpTaxa,
      totalCursos,
      federalCursos,
      estadualCursos,
      publicCursos: federalCursos + estadualCursos,
      privadaCursos,
      eadCursos,
      presencialCursos,
      totalCadeias,
      totalMunEscopo,
      munAtendidosCount: munAtendidos.size,
      munsComAtivosCount: munComAtivo.size,
      munsComCursosCount: munComCurso.size,
      taxaCoberturaMun,
      populacaoTotal: populacaoTotal ? populacaoTotal.toLocaleString('pt-BR') : (isSemiarido ? '7.150.000' : '14.141.626'),
      ifdmMedio
    };
  }, [scopedAtivos, scopedCursos, scopedCadeias, scopedMunicipios, selectedTerritory, selectedTerritoryId, isSemiarido, territoriosData]);

  const topCadeiasList = useMemo(() => {
    return Array.from(new Set(scopedCadeias.map(c => c.nome).filter(Boolean))).slice(0, 6);
  }, [scopedCadeias]);

  const ativosPorMun = useMemo(() => {
    const map = {};
    scopedAtivos.forEach(a => {
      const m = a.municipio;
      if (m) map[m] = (map[m] || 0) + 1;
    });
    return map;
  }, [scopedAtivos]);

  const cursosPorMun = useMemo(() => {
    const map = {};
    scopedCursos.forEach(c => {
      const m = c.municipio;
      if (m) map[m] = (map[m] || 0) + 1;
    });
    return map;
  }, [scopedCursos]);

  const qNorm = normalize(searchTerm);

  const filteredAtivos = useMemo(() => {
    if (!qNorm) return scopedAtivos;
    return scopedAtivos.filter(a =>
      normalize(a.nome).includes(qNorm) ||
      normalize(a.sigla).includes(qNorm) ||
      normalize(a.tipo).includes(qNorm) ||
      normalize(a.municipio).includes(qNorm) ||
      normalize(a.territorio).includes(qNorm)
    );
  }, [scopedAtivos, qNorm]);

  const filteredCursos = useMemo(() => {
    if (!qNorm) return scopedCursos;
    return scopedCursos.filter(c =>
      normalize(c.nome || c.curso || '').includes(qNorm) ||
      normalize(c.instituicao || c.entidade || '').includes(qNorm) ||
      normalize(c.sigla || '').includes(qNorm) ||
      normalize(c.tipo || c.area_conhecimento || '').includes(qNorm) ||
      normalize(c.municipio || '').includes(qNorm) ||
      normalize(c.territorio_identidade || c.territorio || '').includes(qNorm)
    );
  }, [scopedCursos, qNorm]);

  const filteredCadeias = useMemo(() => {
    if (!qNorm) return scopedCadeias;
    return scopedCadeias.filter(cad =>
      normalize(cad.nome || '').includes(qNorm) ||
      normalize(cad.segmento || cad.shortTipo || '').includes(qNorm) ||
      normalize(cad.municipio_sede || '').includes(qNorm) ||
      normalize(cad.territorio_identidade || '').includes(qNorm)
    );
  }, [scopedCadeias, qNorm]);

  const filteredMunicipios = useMemo(() => {
    if (!qNorm) return scopedMunicipios;
    return scopedMunicipios.filter(m =>
      normalize(m.nome_municipio || m.municipio || '').includes(qNorm) ||
      normalize(m.nome_territorio || m.territorio || '').includes(qNorm) ||
      String(m.codigo_ibge || m.id_municipio || '').includes(qNorm)
    );
  }, [scopedMunicipios, qNorm]);

  const handlePrintClick = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const getRedeEnsino = (c) => {
    const raw = String(c.instituicao || c.entidade || c.nome || '').toLowerCase();
    const sigla = String(c.sigla || '').toUpperCase();
    if (raw.includes('federal') || ['UFBA', 'UFRB', 'UFSB', 'UFOB', 'UNIVASF', 'IFBA', 'IF BAIANO'].includes(sigla)) {
      return {
        nome: 'Federal',
        color: 'text-sky-800 font-semibold',
        badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200/80'
      };
    }
    if (raw.includes('estadual') || ['UNEB', 'UEFS', 'UESC', 'UESB'].includes(sigla)) {
      return {
        nome: 'Estadual',
        color: 'text-emerald-800 font-semibold',
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
      };
    }
    return {
      nome: 'Privada',
      color: 'text-amber-800 font-semibold',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/80'
    };
  };

  const docMeta = useMemo(() => {
    const titles = {
      sintese: {
        badge: 'DOSSIÊ ANALÍTICO INTEGRADO',
        title: 'Dossiê Analítico Territorial de Ciência, Tecnologia e Inovação',
        subtitle: 'Consolidação completa de ativos científicos e tecnológicos, oferta universitária em CT&I, cadeias produtivas e cobertura municipal.'
      },
      ativos: {
        badge: 'CADASTRO ANALÍTICO DE INFRAESTRUTURA',
        title: 'Relatório Analítico de Ativos Físicos e Redes de CT&I',
        subtitle: 'Inventário detalhado de instituições, campi, laboratórios, centros tecnológicos e pontos de presença da Rede Nacional de Ensino e Pesquisa (RNP).'
      },
      cursos: {
        badge: 'RELATÓRIO DE FORMAÇÃO SUPERIOR',
        title: 'Relatório Analítico de Cursos Superiores em CT&I',
        subtitle: 'Mapeamento detalhado de graduações e oferta acadêmica presencial e EaD por instituição, rede de ensino e município baiano.'
      },
      cadeias: {
        badge: 'MAPEAMENTO ECONÔMICO E TERRITORIAL',
        title: 'Relatório Analítico de Cadeias Produtivas, APLs e IGs',
        subtitle: 'Inventário de arranjos produtivos locais, indicações geográficas e cadeias econômicas estratégicas por município sede e abrangência.'
      },
      municipios: {
        badge: 'MATRIZ MUNICIPAL DE ATENDIMENTO',
        title: 'Matriz Analítica de Cobertura Territorial e Municípios',
        subtitle: 'Diagnóstico municipal consolidado cruzando presença de ativos de CT&I, cursos superiores, códigos IBGE e recorte do Semiárido.'
      }
    };
    return titles[activeTab] || titles.sintese;
  }, [activeTab]);

  const emissaoDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const emissaoHora = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const docRefCode = `SECTI-${activeTab.toUpperCase().slice(0, 4)}-${selectedTerritoryId === 'bahia' ? 'BA' : `TI${selectedTerritoryId}`}-${isSemiarido ? 'SA' : 'GE'}`;

  const summarySections = [
    {
      show: activeTab === 'sintese' || activeTab === 'ativos',
      num: '01',
      title: 'Base Analítica de Ativos de CT&I e Conectividade RNP',
      desc: 'Instituições científicas, campi, institutos, centros de pesquisa e backbone RNP',
      count: `${filteredAtivos.length} ativos`
    },
    {
      show: activeTab === 'sintese' || activeTab === 'cursos',
      num: '02',
      title: 'Oferta de Ensino Superior em CT&I',
      desc: 'Cursos de graduação por instituição (IES), rede pública/privada e modalidade',
      count: `${filteredCursos.length} cursos`
    },
    {
      show: activeTab === 'sintese' || activeTab === 'cadeias',
      num: '03',
      title: 'Mapeamento de Cadeias Produtivas, APLs e IGs',
      desc: 'Arranjos produtivos locais, indicações geográficas e municípios de abrangência',
      count: `${filteredCadeias.length} cadeias`
    },
    {
      show: activeTab === 'sintese' || activeTab === 'municipios',
      num: '04',
      title: 'Matriz Consolidada de Atendimento Municipal',
      desc: 'Cruzamento municipal de ativos, cursos, códigos IBGE e recorte Semiárido',
      count: `${filteredMunicipios.length} municípios`
    }
  ].filter(s => s.show);

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 14mm 10mm;
        }

        @page :first {
          margin: 0;
        }

        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
            opacity: 1 !important;
          }

          html, html.dark, body, body.dark {
            background: #ffffff !important;
            color: #09090b !important;
            opacity: 1 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print-doc-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
          }

          .report-cover-sheet {
            width: 100% !important;
            min-height: 297mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 14mm 14mm 12mm 14mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .report-body-sheet {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }

          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 7.75pt !important;
            page-break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          th {
            background-color: #f4f4f5 !important;
            color: #18181b !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.04em !important;
            border-bottom: 1.5px solid #a1a1aa !important;
            border-top: 1px solid #d4d4d8 !important;
            padding: 5px 6px !important;
          }

          td {
            padding: 4px 6px !important;
            border-bottom: 1px solid #e4e4e7 !important;
            line-height: 1.32 !important;
            vertical-align: middle !important;
            color: #18181b !important;
          }

          tr:nth-child(even) {
            background-color: #fafafa !important;
          }

          .dark :where(.text-primary-700, .text-primary-800, .text-primary-900, .text-primary-950) {
            color: #09090b !important;
          }
        }
      `}</style>

      <div className="min-h-dvh bg-zinc-100/90 font-sans text-zinc-900 flex flex-col selection:bg-primary-500/20">

        {/* ================= BARRA DE CONTROLE EM TELA (OCULTA NA IMPRESSÃO) ================= */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-2xs px-4 py-2.5 print:hidden">
          <div className="max-w-[1160px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">

            {/* Esquerda: Voltar e Título */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/relatorio')}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition-colors cursor-pointer shrink-0 active:scale-[0.99]"
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </button>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`p-1 rounded-md ${isSemiarido ? 'bg-amber-500/10 text-amber-700' : 'bg-primary-600/10 text-primary-700'}`}>
                    <FileText size={15} />
                  </span>
                  <h1 className="text-sm font-semibold text-zinc-950 tracking-tight truncate">
                    Dossiê Analítico de CT&I
                  </h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    A4 Retrato
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate tnum">
                  {territoryTitle} • {isSemiarido ? 'Recorte Semiárido' : 'Modo Geral'}
                </p>
              </div>
            </div>

            {/* Centro: Seletor de Visão / Módulo */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 text-xs font-medium overflow-x-auto shrink-0">
              {[
                { id: 'sintese', label: 'Dossiê Geral' },
                { id: 'ativos', label: 'Ativos' },
                { id: 'cursos', label: 'Cursos' },
                { id: 'cadeias', label: 'Cadeias' },
                { id: 'municipios', label: 'Municípios' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tipo: tab.id, territorio: selectedTerritoryId, modo: reportMode });
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-zinc-950 shadow-2xs font-semibold border border-zinc-200/70'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Direita: Filtros Rápidos, Capa, Busca e Imprimir */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Seletor de Território */}
              <select
                aria-label="Selecionar território"
                value={selectedTerritoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTerritoryId(val);
                  setSearchParams({ tipo: activeTab, territorio: val, modo: reportMode });
                }}
                className="h-8 max-w-[180px] rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
              >
                <option value="bahia">Toda a Bahia (27 TIs)</option>
                {sortedTerritorios.map((t) => (
                  <option key={t.id_territorio} value={String(t.id_territorio)}>
                    {t.nome_territorio || t.territorio}
                  </option>
                ))}
              </select>

              {/* Alternar Semiárido */}
              <button
                type="button"
                onClick={() => {
                  const next = isSemiarido ? 'normal' : 'semiarido';
                  setReportMode(next);
                  setSearchParams({ tipo: activeTab, territorio: selectedTerritoryId, modo: next });
                }}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSemiarido
                    ? 'bg-amber-500/10 text-amber-800 border-amber-500/30'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900'
                }`}
                title="Alternar entre Modo Geral e Recorte Semiárido"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                Semiárido
              </button>

              {/* Toggle Capa */}
              <button
                type="button"
                onClick={() => setShowCover((prev) => !prev)}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  showCover
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900'
                }`}
                title="Exibir ou ocultar a capa na visualização e impressão"
              >
                <BookOpen size={13} />
                <span>Capa</span>
              </button>

              {/* Busca */}
              <div className="relative w-36 sm:w-44">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filtrar registros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-7 pr-2.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15"
                />
              </div>

              {/* Ação Primária Única */}
              <button
                type="button"
                onClick={handlePrintClick}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] shadow-2xs transition-all cursor-pointer shrink-0"
                title="Abrir diálogo de impressão do navegador ou Salvar como PDF"
              >
                <Printer size={14} />
                <span>Salvar PDF / Imprimir</span>
              </button>
            </div>

          </div>
        </header>

        {/* ================= DOCUMENTO ANALÍTICO IMPRESSO (PADRÃO A4 COM CAPA) ================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center print:p-0 print:m-0">
          <div className="print-doc-container w-full max-w-[850px] flex flex-col gap-6 print:max-w-none print:gap-0">

            {/* ================= FOLHA 1: CAPA OFICIAL A4 DO RELATÓRIO ANALÍTICO ================= */}
            {showCover && (
              <section className="report-cover-sheet bg-white text-zinc-900 rounded-xl border border-zinc-200/80 shadow-sm p-8 sm:p-12 flex flex-col justify-between min-h-[1060px] relative overflow-hidden">
                {/* Faixa geométrica discreta no topo */}
                <div
                  aria-hidden="true"
                  className={`absolute top-0 left-0 right-0 h-2 ${
                    isSemiarido
                      ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700'
                      : 'bg-gradient-to-r from-[#0B2A52] via-[#1B4A8A] to-[#0E7490]'
                  }`}
                />

                {/* TOPO DA CAPA: BRASÃO OFICIAL E HIERARQUIA INSTITUCIONAL */}
                <div className="flex flex-col gap-6 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                    <img
                      src="/img/secti-govba-horizontal.svg"
                      alt="SECTI • Governo do Estado da Bahia"
                      className="h-12 w-auto object-contain object-left select-none"
                    />
                    <div className="flex flex-col sm:items-end text-left sm:text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                        <Award size={12} className={isSemiarido ? 'text-amber-600' : 'text-[#0B2A52]'} />
                        Documento Técnico Homologado
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium mt-1.5 tnum">
                        Ref.: {docRefCode}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    Governo do Estado da Bahia • Secretaria de Ciência, Tecnologia e Inovação (SECTI) • PTI Bahia
                  </div>
                </div>

                {/* BLOCO CENTRAL DA CAPA: TÍTULO, ESCOPO E SÍNTESE EXECUTIVA */}
                <div className="my-auto py-6 flex flex-col gap-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      isSemiarido
                        ? 'bg-amber-500/10 text-amber-800 border-amber-500/25'
                        : 'bg-[#0B2A52]/8 text-[#0B2A52] border-[#0B2A52]/20'
                    }`}>
                      <Layers size={12} />
                      {docMeta.badge}
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      isSemiarido
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                      {isSemiarido ? 'Recorte Semiárido Baiano (278 Municípios)' : 'Cenário Geral Estadual (417 Municípios)'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h1 className="text-3xl sm:text-[34px] font-bold text-zinc-950 tracking-tight leading-[1.12]">
                      {docMeta.title}
                    </h1>
                    <p className="text-sm sm:text-[15px] text-zinc-600 leading-relaxed max-w-[62ch]">
                      {docMeta.subtitle}
                    </p>
                  </div>

                  {/* CARTÃO DE ESCOPO TERRITORIAL NA CAPA */}
                  <div className={`rounded-xl p-5 border ${
                    isSemiarido
                      ? 'bg-amber-50/50 border-amber-200/90'
                      : 'bg-zinc-50/90 border-zinc-200/90'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <Globe size={12} />
                          Escopo Territorial Analisado
                        </span>
                        <div className="text-xl font-bold text-zinc-950 tracking-tight">
                          {territoryTitle}
                        </div>
                        <div className="text-xs text-zinc-600 tnum">
                          Abrangência de {statsSintese.totalMunEscopo} municípios ({statsSintese.taxaCoberturaMun}% com presença direta de ativos ou ensino superior CT&I)
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200/80 text-right">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">População</div>
                          <div className="text-sm font-bold text-zinc-900 tnum">{statsSintese.populacaoTotal}</div>
                        </div>
                        {statsSintese.ifdmMedio && (
                          <div className="px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200/80 text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">IFDM Médio</div>
                            <div className="text-sm font-bold text-zinc-900 tnum">{statsSintese.ifdmMedio}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GRADE DE SÍNTESE EXECUTIVA NA CAPA (4 INDICADORES) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-4 rounded-xl text-white flex flex-col justify-between min-h-[104px] ${
                      isSemiarido
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                        : 'bg-gradient-to-br from-[#0B2A52] to-[#16427A]'
                    }`}>
                      <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider">Ativos CT&I</span>
                      <div className="text-2xl font-bold tracking-tight tnum">{statsSintese.totalAtivos}</div>
                      <span className="text-[11px] font-medium text-white/85 tnum">
                        {statsSintese.rnpAtivos} com RNP ({statsSintese.rnpTaxa}%)
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-zinc-200/90 flex flex-col justify-between min-h-[104px]">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Cursos CT&I</span>
                      <div className="text-2xl font-bold text-zinc-950 tracking-tight tnum">{statsSintese.totalCursos}</div>
                      <span className="text-[11px] font-medium text-zinc-600 tnum">
                        {statsSintese.publicCursos} públicos • {statsSintese.privadaCursos} priv.
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-zinc-200/90 flex flex-col justify-between min-h-[104px]">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Cadeias & APLs</span>
                      <div className="text-2xl font-bold text-zinc-950 tracking-tight tnum">{statsSintese.totalCadeias}</div>
                      <span className="text-[11px] font-medium text-zinc-600">
                        Vocações produtivas
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-zinc-200/90 flex flex-col justify-between min-h-[104px]">
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Municípios</span>
                      <div className="text-2xl font-bold text-zinc-950 tracking-tight tnum">
                        {statsSintese.munAtendidosCount}/{statsSintese.totalMunEscopo}
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 tnum">
                        {statsSintese.taxaCoberturaMun}% cobertura
                      </span>
                    </div>
                  </div>

                  {/* SUMÁRIO EXECUTIVO DA ESTRUTURA DO DOCUMENTO */}
                  <div className="rounded-xl border border-zinc-200/90 overflow-hidden">
                    <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                        Estrutura e Sumário do Dossiê
                      </span>
                      <span className="text-[11px] font-medium text-zinc-500 tnum">
                        {summarySections.length} {summarySections.length === 1 ? 'seção analítica' : 'seções analíticas'}
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-200/70 bg-white">
                      {summarySections.map((sec) => (
                        <div key={sec.num} className="px-4 py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 tnum ${
                              isSemiarido ? 'bg-amber-500/15 text-amber-800' : 'bg-zinc-100 text-zinc-800'
                            }`}>
                              {sec.num}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-900 truncate">{sec.title}</div>
                              <div className="text-[11px] text-zinc-500 truncate">{sec.desc}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/80 px-2.5 py-0.5 rounded-full shrink-0 tnum">
                            {sec.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {topCadeiasList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1">
                        Vocações em destaque:
                      </span>
                      {topCadeiasList.map((nome, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80"
                        >
                          {nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* RODAPÉ OFICIAL DA CAPA */}
                <div className="border-t border-zinc-200 pt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-[11px] text-zinc-500">
                  <div>
                    <div className="font-semibold text-zinc-800">
                      Secretaria de Ciência, Tecnologia e Inovação do Estado da Bahia — SECTI
                    </div>
                    <div>Fontes: Base Homologada SECTI/BA • INEP Censo Superior • Rede RNP • SEI / IBGE</div>
                  </div>
                  <div className="sm:text-right tnum">
                    <div className="font-semibold text-zinc-700">Emitido em {emissaoDate} às {emissaoHora}</div>
                    <div>Salvador — Bahia • Brasil</div>
                  </div>
                </div>
              </section>
            )}

            {/* ================= FOLHAS INTERNAS: CORPO ANALÍTICO E TABELAS ================= */}
            <section className="report-body-sheet bg-white text-zinc-900 rounded-xl border border-zinc-200/80 shadow-sm p-6 sm:p-10 print:p-0">

              {/* CABEÇALHO CORRENTE DAS PÁGINAS DE DADOS */}
              <div className="avoid-break border-b-2 border-zinc-900 pb-4 mb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/img/secti-govba-horizontal.svg"
                      alt="SECTI • Governo do Estado da Bahia"
                      className="h-9 w-auto object-contain shrink-0 select-none"
                    />
                    <div className="h-7 w-px bg-zinc-200 hidden sm:block" />
                    <div className="hidden sm:block">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 leading-tight">
                        Sistema Integrado de Gestão Territorial de CT&I
                      </h2>
                      <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                        Diretoria de Políticas Territoriais • Programa Territórios de Inovação (PTI)
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-zinc-500 shrink-0 tnum">
                    <span className="inline-block px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[9px] font-bold text-zinc-700 uppercase mb-1">
                      Documento Oficial • {docRefCode}
                    </span>
                    <div><strong>Emissão:</strong> {emissaoDate} às {emissaoHora}</div>
                    <div><strong>Origem:</strong> Base Homologada SECTI/BA</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                      {activeTab === 'sintese' && 'Dossiê Analítico Geral • Dados Integrados de CT&I'}
                      {activeTab === 'ativos' && 'Relatório Analítico • Ativos Físicos e Redes de CT&I'}
                      {activeTab === 'cursos' && 'Relatório Analítico • Oferta de Ensino Superior em CT&I'}
                      {activeTab === 'cadeias' && 'Relatório Analítico • Mapeamento de Cadeias Produtivas'}
                      {activeTab === 'municipios' && 'Relatório Analítico • Matriz Territorial de Municípios'}
                    </h1>
                    <p className="text-xs text-zinc-600 font-medium">
                      Escopo: <strong className="text-zinc-900">{territoryTitle}</strong>
                      {isSemiarido && <span className="text-amber-700 font-semibold ml-1.5">• Recorte Semiárido Baiano</span>}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Relatório de Dados Auditáveis
                  </div>
                </div>
              </div>

              {/* RESUMO DE INDICADORES CONSOLIDADOS */}
              <div className="avoid-break bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-3.5 mb-6">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                  Quadro Síntese de Indicadores no Escopo
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3 rounded-lg border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Ativos de CT&I</div>
                    <div className="text-lg font-bold text-zinc-950 tnum mt-0.5">{statsSintese.totalAtivos}</div>
                    <div className="text-[10px] text-emerald-700 font-medium tnum">{statsSintese.rnpAtivos} com RNP ({statsSintese.rnpTaxa}%)</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Cursos Superiores</div>
                    <div className="text-lg font-bold text-zinc-950 tnum mt-0.5">{statsSintese.totalCursos}</div>
                    <div className="text-[10px] text-zinc-600 font-medium tnum">{statsSintese.presencialCursos} pres. / {statsSintese.eadCursos} EaD</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Cadeias Produtivas</div>
                    <div className="text-lg font-bold text-zinc-950 tnum mt-0.5">{statsSintese.totalCadeias}</div>
                    <div className="text-[10px] text-zinc-600 font-medium">APLs e IGs mapeados</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-200/80">
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Cobertura Municipal</div>
                    <div className="text-lg font-bold text-zinc-950 tnum mt-0.5">{statsSintese.taxaCoberturaMun}%</div>
                    <div className="text-[10px] text-zinc-600 font-medium tnum">{statsSintese.munAtendidosCount} de {statsSintese.totalMunEscopo} mun.</div>
                  </div>
                </div>
              </div>

              {/* ================= SEÇÃO 1: TABELA DE ATIVOS DE CT&I ================= */}
              {(activeTab === 'sintese' || activeTab === 'ativos') && (
                <div className="mb-8">
                  <div className="avoid-break flex items-center justify-between border-b-2 border-zinc-900 pb-2 mb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tnum">
                        01
                      </span>
                      <Database size={15} className="text-zinc-800 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase text-zinc-950 tracking-tight truncate">
                        Listagem Detalhada de Ativos de CT&I
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-zinc-500 hidden sm:inline">
                        Infraestrutura Laboratorial e Polos
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 tnum">
                        {filteredAtivos.length} registros
                      </span>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-8 text-center">#</th>
                        <th className="text-left">Nome do Ativo / Sigla</th>
                        <th className="text-left w-28">Tipo / Categoria</th>
                        <th className="text-left w-24">Município</th>
                        <th className="text-left w-28">Território</th>
                        <th className="text-center w-20">RNP</th>
                        <th className="text-center w-20">Semiárido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAtivos.length > 0 ? (
                        filteredAtivos.map((a, idx) => (
                          <tr key={a.id || idx}>
                            <td className="text-center text-zinc-500 font-mono text-[8.5px] font-semibold tnum">{idx + 1}</td>
                            <td>
                              <div className="font-semibold text-zinc-950 text-[9px] leading-snug">{a.nome}</div>
                              {a.sigla && a.sigla !== 'S/S' && a.sigla !== a.nome && (
                                <div className="text-[8px] text-zinc-500 font-semibold">Sigla: {a.sigla}</div>
                              )}
                            </td>
                            <td className="text-zinc-700 font-medium text-[8.5px]">
                              {a.shortTipo || a.tipo}
                            </td>
                            <td className="text-zinc-900 font-medium text-[8.5px]">{a.municipio}</td>
                            <td className="text-zinc-600 font-medium text-[8.5px]">{a.territorio}</td>
                            <td className="text-center">
                              {a.rnp ? (
                                <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[8px]">
                                  Conectado
                                </span>
                              ) : (
                                <span className="text-zinc-400 font-medium text-[8.5px]">Não</span>
                              )}
                            </td>
                            <td className="text-center">
                              {a.semiarido ? (
                                <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[8px]">
                                  Sim
                                </span>
                              ) : (
                                <span className="text-zinc-400 font-medium text-[8.5px]">Não</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-zinc-400 italic">
                            Nenhum ativo localizado para o escopo selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ================= SEÇÃO 2: TABELA DE CURSOS SUPERIORES ================= */}
              {(activeTab === 'sintese' || activeTab === 'cursos') && (
                <div className={`mb-8 ${activeTab === 'sintese' ? 'page-break-before pt-2' : ''}`}>
                  <div className="avoid-break flex items-center justify-between border-b-2 border-zinc-900 pb-2 mb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tnum">
                        {activeTab === 'sintese' ? '02' : '01'}
                      </span>
                      <GraduationCap size={15} className="text-zinc-800 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase text-zinc-950 tracking-tight truncate">
                        Listagem Detalhada de Cursos Superiores
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-zinc-500 hidden sm:inline">
                        Graduações e Modalidades Ofertadas
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 tnum">
                        {filteredCursos.length} registros
                      </span>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-8 text-center">#</th>
                        <th className="text-left">Curso Superior</th>
                        <th className="text-left w-32">Instituição (IES)</th>
                        <th className="text-center w-20">Rede</th>
                        <th className="text-center w-20">Modalidade</th>
                        <th className="text-left w-24">Município</th>
                        <th className="text-left w-28">Território</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCursos.length > 0 ? (
                        filteredCursos.map((c, idx) => {
                          const rede = getRedeEnsino(c);
                          return (
                            <tr key={c.id_curso || c.id || idx}>
                              <td className="text-center text-zinc-400 font-mono text-[8px] tnum">{idx + 1}</td>
                              <td>
                                <div className="font-semibold text-zinc-950 leading-snug">{c.nome || c.curso}</div>
                                {c.grau && (
                                  <div className="text-[8px] text-zinc-500 font-medium">Grau: {c.grau}</div>
                                )}
                              </td>
                              <td>
                                <div className="font-medium text-zinc-800">{cleanIes(c.instituicao || c.entidade)}</div>
                                {c.sigla && (
                                  <span className="text-[8px] font-bold text-zinc-500">{c.sigla}</span>
                                )}
                              </td>
                              <td className="text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-bold ${rede.badgeClass}`}>
                                  {rede.nome}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-semibold border ${
                                  c.ead
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                }`}>
                                  {c.ead ? 'EaD' : 'Presencial'}
                                </span>
                              </td>
                              <td className="text-zinc-800">{c.municipio || '-'}</td>
                              <td className="text-zinc-600">{c.territorio_identidade || c.territorio || '-'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-zinc-400 italic">
                            Nenhum curso localizado para o escopo selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ================= SEÇÃO 3: TABELA DE CADEIAS PRODUTIVAS ================= */}
              {(activeTab === 'sintese' || activeTab === 'cadeias') && (
                <div className={`mb-8 ${activeTab === 'sintese' ? 'page-break-before pt-2' : ''}`}>
                  <div className="avoid-break flex items-center justify-between border-b-2 border-zinc-900 pb-2 mb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tnum">
                        {activeTab === 'sintese' ? '03' : '01'}
                      </span>
                      <GitPullRequest size={15} className="text-zinc-800 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase text-zinc-950 tracking-tight truncate">
                        Listagem de Cadeias Produtivas e APLs
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-zinc-500 hidden sm:inline">
                        Segmentos Econômicos e Arranjos Locais
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 tnum">
                        {filteredCadeias.length} registros
                      </span>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-8 text-center">#</th>
                        <th className="text-left">Cadeia Produtiva</th>
                        <th className="text-left w-32">Segmento / Tipo</th>
                        <th className="text-left w-24">Município Sede</th>
                        <th className="text-left w-28">Território Sede</th>
                        <th className="text-left">Municípios de Abrangência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCadeias.length > 0 ? (
                        filteredCadeias.map((cad, idx) => {
                          const muns = (cad.municipios_cobertos || []).map(m => m.nome_municipio || m.municipio).filter(Boolean);
                          return (
                            <tr key={cad.id || idx}>
                              <td className="text-center text-zinc-400 font-mono text-[8px] tnum">{idx + 1}</td>
                              <td className="font-semibold text-zinc-950 leading-snug">{cad.nome}</td>
                              <td className="text-zinc-700 font-medium text-[8.5px]">
                                {cad.segmento || cad.shortTipo || 'APL'}
                              </td>
                              <td className="text-zinc-800">{cad.municipio_sede || '-'}</td>
                              <td className="text-zinc-600">{cad.territorio_identidade || '-'}</td>
                              <td className="text-zinc-600 text-[8px]">
                                {muns.length > 0 ? (
                                  <span>{muns.join(', ')}</span>
                                ) : (
                                  <span className="text-zinc-400">Territorial / Sede</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-zinc-400 italic">
                            Nenhuma cadeia produtiva localizada para o escopo selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ================= SEÇÃO 4: TABELA DE MUNICÍPIOS E COBERTURA ================= */}
              {(activeTab === 'sintese' || activeTab === 'municipios') && (
                <div className={`mb-8 ${activeTab === 'sintese' ? 'page-break-before pt-2' : ''}`}>
                  <div className="avoid-break flex items-center justify-between border-b-2 border-zinc-900 pb-2 mb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tnum">
                        {activeTab === 'sintese' ? '04' : '01'}
                      </span>
                      <MapPin size={15} className="text-zinc-800 shrink-0" />
                      <h3 className="text-xs sm:text-sm font-bold uppercase text-zinc-950 tracking-tight truncate">
                        Matriz de Atendimento por Município
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium text-zinc-500 hidden sm:inline">
                        Presença de Ativos Físicos e Cursos
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 tnum">
                        {filteredMunicipios.length} municípios
                      </span>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-8 text-center">#</th>
                        <th className="text-left">Município</th>
                        <th className="text-left w-36">Território de Identidade</th>
                        <th className="text-center w-24">Cód. IBGE</th>
                        <th className="text-center w-20">Semiárido</th>
                        <th className="text-center w-20">Qtd. Ativos</th>
                        <th className="text-center w-20">Qtd. Cursos</th>
                        <th className="text-center w-24">Status CT&I</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMunicipios.length > 0 ? (
                        filteredMunicipios.map((m, idx) => {
                          const nomeMun = m.nome_municipio || m.municipio || 'Município';
                          const qAtivos = ativosPorMun[nomeMun] || 0;
                          const qCursos = cursosPorMun[nomeMun] || 0;
                          const atendido = qAtivos > 0 || qCursos > 0;
                          const isSemi = isMunicipioSemiarido(nomeMun);

                          return (
                            <tr key={m.codigo_ibge || m.id_municipio || idx}>
                              <td className="text-center text-zinc-400 font-mono text-[8px] tnum">{idx + 1}</td>
                              <td className="font-semibold text-zinc-950">{nomeMun}</td>
                              <td className="text-zinc-600">{m.nome_territorio || m.territorio || '-'}</td>
                              <td className="text-center font-mono text-[8.5px] text-zinc-500 tnum">{m.codigo_ibge || m.id_municipio || '-'}</td>
                              <td className="text-center">
                                {isSemi ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[8px]">
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 font-medium text-[8.5px]">Não</span>
                                )}
                              </td>
                              <td className="text-center font-bold text-zinc-950 text-[8.5px] tnum">{qAtivos}</td>
                              <td className="text-center font-bold text-zinc-950 text-[8.5px] tnum">{qCursos}</td>
                              <td className="text-center">
                                {atendido ? (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[8px]">
                                    Atendido
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 font-medium text-[8px]">
                                    Sem Registro
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-zinc-400 italic">
                            Nenhum município localizado para o escopo selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ================= RODAPÉ OFICIAL DA PÁGINA ================= */}
              <div className="avoid-break mt-8 pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[9px] text-zinc-500 gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src="/img/secti-govba-horizontal.svg"
                    alt="SECTI • Bahia"
                    className="h-5 w-auto object-contain opacity-85 select-none"
                  />
                  <div>
                    <strong className="text-zinc-700">Sistema de Gestão Territorial de Ciência, Tecnologia e Inovação • SECTI/BA</strong>
                    <p>Governo do Estado da Bahia • Secretaria de Ciência, Tecnologia e Inovação</p>
                  </div>
                </div>
                <div className="sm:text-right tnum">
                  <div>Documento analítico gerado eletronicamente para fins de auditoria e planejamento.</div>
                  <div>Emissão em {emissaoDate} às {emissaoHora} • {docRefCode}</div>
                </div>
              </div>

            </section>

          </div>
        </main>

      </div>
    </>
  );
}
