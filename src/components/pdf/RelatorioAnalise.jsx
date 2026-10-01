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
  MapPin
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

  const isSemiarido = reportMode === 'semiarido';

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
    } catch (_) {}
  }, []);

  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint') || searchParams.get('autoprint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats) {
      try {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      } catch (_) {}
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
      } catch (_) {}
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
      privadaCursos,
      eadCursos,
      presencialCursos,
      totalCadeias,
      totalMunEscopo,
      munAtendidosCount: munAtendidos.size,
      taxaCoberturaMun,
      populacaoTotal: populacaoTotal ? populacaoTotal.toLocaleString('pt-BR') : (isSemiarido ? '7.150.000' : '14.141.626'),
      ifdmMedio
    };
  }, [scopedAtivos, scopedCursos, scopedCadeias, scopedMunicipios, selectedTerritory, selectedTerritoryId, isSemiarido, territoriosData]);

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
      return { nome: 'Federal', color: 'text-blue-800 font-bold' };
    }
    if (raw.includes('estadual') || ['UNEB', 'UEFS', 'UESC', 'UESB'].includes(sigla)) {
      return { nome: 'Estadual', color: 'text-emerald-800 font-bold' };
    }
    return { nome: 'Privada / Outra', color: 'text-amber-800 font-semibold' };
  };

  const emissaoDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const emissaoHora = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
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
            color: #0f172a !important;
            opacity: 1 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          .print\:hidden {
            display: none !important;
          }

          .print-doc-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 12mm 10mm 15mm 10mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            opacity: 1 !important;
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
            font-size: 8pt !important;
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
            background-color: #e2e8f0 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.03em !important;
            border-bottom: 2px solid #64748b !important;
            border-top: 1px solid #94a3b8 !important;
            padding: 4.5px 6px !important;
          }

          td {
            padding: 3.5px 6px !important;
            border-bottom: 1px solid #cbd5e1 !important;
            line-height: 1.3 !important;
            vertical-align: middle !important;
            color: #0f172a !important;
          }

          tr:nth-child(even) {
            background-color: #f8fafc !important;
          }

          /* Neutraliza override de texto escuro do Tailwind dark mode */
          .dark :where(.text-primary-700, .text-primary-800, .text-primary-900, .text-primary-950) {
            color: #0f172a !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col selection:bg-primary-500/20">

        {/* ================= BARRA DE CONTROLE EM TELA (OCULTA NA IMPRESSÃO) ================= */}
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 py-3 print:hidden">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Esquerda: Voltar e Título */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => navigate('/relatorio')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </button>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-primary-600/10 text-primary-600 dark:text-primary-400">
                    <FileText size={16} />
                  </span>
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Modo Análise • Relatório de Dados Brutos
                  </h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    A4 Retrato
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {territoryTitle} • {isSemiarido ? 'Modo Semiárido' : 'Modo Geral'}
                </p>
              </div>
            </div>

            {/* Centro: Seletor de Módulo / Visão */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium w-full md:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => { setActiveTab('sintese'); setSearchParams({ tipo: 'sintese', territorio: selectedTerritoryId, modo: reportMode }); }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'sintese'
                    ? 'bg-white dark:bg-slate-700 text-primary-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Dossiê Geral
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('ativos'); setSearchParams({ tipo: 'ativos', territorio: selectedTerritoryId, modo: reportMode }); }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ativos'
                    ? 'bg-white dark:bg-slate-700 text-primary-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Ativos ({scopedAtivos.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('cursos'); setSearchParams({ tipo: 'cursos', territorio: selectedTerritoryId, modo: reportMode }); }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'cursos'
                    ? 'bg-white dark:bg-slate-700 text-primary-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Cursos ({scopedCursos.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('cadeias'); setSearchParams({ tipo: 'cadeias', territorio: selectedTerritoryId, modo: reportMode }); }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'cadeias'
                    ? 'bg-white dark:bg-slate-700 text-primary-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Cadeias ({scopedCadeias.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('municipios'); setSearchParams({ tipo: 'municipios', territorio: selectedTerritoryId, modo: reportMode }); }}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'municipios'
                    ? 'bg-white dark:bg-slate-700 text-primary-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Municípios ({scopedMunicipios.length})
              </button>
            </div>

            {/* Direita: Busca em tela e Botão Imprimir/Salvar PDF */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="relative w-40 sm:w-48">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar dados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <button
                type="button"
                onClick={handlePrintClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-900 hover:bg-primary-800 active:scale-98 shadow-sm transition-all cursor-pointer shrink-0"
                title="Abrir diálogo de impressão do navegador ou Salvar como PDF"
              >
                <Printer size={14} />
                <span>Salvar PDF / Imprimir</span>
              </button>
            </div>

          </div>
        </header>

        {/* ================= DOCUMENTO ANALÍTICO IMPRESSO (PADRÃO A4) ================= */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 flex justify-center print:p-0 print:m-0">
          <div className="print-doc-container w-full max-w-[850px] bg-white text-slate-900 shadow-xl rounded-2xl p-6 sm:p-10 border border-slate-200 print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none">

            {/* ================= CABEÇALHO OFICIAL GOVERNO DA BAHIA / SECTI ================= */}
            <div className="avoid-break border-b-2 border-slate-800 pb-4 mb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-900 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-primary-950 shrink-0">
                    <span className="tracking-tighter">BA</span>
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
                      Governo do Estado da Bahia
                    </h2>
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-tight leading-tight">
                      Secretaria de Ciência, Tecnologia e Inovação — SECTI
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      Sistema Integrado de Gestão Territorial de CT&I • Diretoria de Políticas Territoriais
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-500 shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-700 uppercase mb-1">
                    Documento Oficial
                  </span>
                  <div><strong>Emissão:</strong> {emissaoDate} às {emissaoHora}</div>
                  <div><strong>Origem:</strong> Base Homologada SECTI/BA</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                    {activeTab === 'sintese' && 'Dossiê Analítico Geral • Dados Integrados de CT&I'}
                    {activeTab === 'ativos' && 'Relatório Analítico • Ativos Físicos e Redes de CT&I'}
                    {activeTab === 'cursos' && 'Relatório Analítico • Oferta de Ensino Superior em CT&I'}
                    {activeTab === 'cadeias' && 'Relatório Analítico • Mapeamento de Cadeias Produtivas'}
                    {activeTab === 'municipios' && 'Relatório Analítico • Matriz Territorial de Municípios'}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Escopo: <strong className="text-slate-900">{territoryTitle}</strong>
                    {isSemiarido && <span className="text-amber-800 font-bold ml-1.5">• Recorte Semiárido Baiano</span>}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  Modo de Análise Detalhada
                </div>
              </div>
            </div>

            {/* ================= RESUMO DE INDICADORES / QUADRO RESUMO ================= */}
            <div className="avoid-break bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quadro Resumo de Indicadores Consolidados no Escopo
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Ativos de CT&I</div>
                  <div className="text-base sm:text-lg font-black text-slate-900">{statsSintese.totalAtivos}</div>
                  <div className="text-[9px] text-slate-500">{statsSintese.rnpAtivos} com RNP ({statsSintese.rnpTaxa}%)</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Cursos Superiores</div>
                  <div className="text-base sm:text-lg font-black text-slate-900">{statsSintese.totalCursos}</div>
                  <div className="text-[9px] text-slate-500">{statsSintese.presencialCursos} pres. / {statsSintese.eadCursos} EaD</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Cadeias Produtivas</div>
                  <div className="text-base sm:text-lg font-black text-slate-900">{statsSintese.totalCadeias}</div>
                  <div className="text-[9px] text-slate-500">setores mapeados</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Cobertura Territorial</div>
                  <div className="text-base sm:text-lg font-black text-slate-900">{statsSintese.taxaCoberturaMun}%</div>
                  <div className="text-[9px] text-slate-500">{statsSintese.munAtendidosCount} de {statsSintese.totalMunEscopo} mun.</div>
                </div>
              </div>
            </div>

            {/* ================= SEÇÃO: TABELA DE ATIVOS DE CT&I ================= */}
            {(activeTab === 'sintese' || activeTab === 'ativos') && (
              <div className="mb-8">
                <div className="avoid-break flex items-center justify-between border-b-2 border-primary-900 pb-1.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Database size={15} className="text-primary-900" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-tight">
                      {activeTab === 'sintese' ? '1. Listagem Detalhada de Ativos de CT&I' : 'Listagem Detalhada de Ativos de CT&I'} ({filteredAtivos.length} registros)
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Infraestrutura Laboratorial, Universitária e Centros Tecnológicos
                  </span>
                </div>

                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-8 text-center">#</th>
                      <th className="text-left">Nome do Ativo / Sigla</th>
                      <th className="text-left w-28">Tipo / Categoria</th>
                      <th className="text-left w-24">Município</th>
                      <th className="text-left w-28">Território</th>
                      <th className="text-center w-16">RNP</th>
                      <th className="text-center w-16">Semiárido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAtivos.length > 0 ? (
                      filteredAtivos.map((a, idx) => (
                        <tr key={a.id || idx}>
                          <td className="text-center text-slate-500 font-mono text-[8.5px] font-semibold">{idx + 1}</td>
                          <td>
                            <div className="font-bold text-slate-950 text-[9px] leading-snug">{a.nome}</div>
                            {a.sigla && a.sigla !== 'S/S' && a.sigla !== a.nome && (
                              <div className="text-[8.5px] text-slate-600 font-semibold">Sigla: {a.sigla}</div>
                            )}
                          </td>
                          <td className="text-slate-800 font-semibold text-[8.5px]">
                            {a.shortTipo || a.tipo}
                          </td>
                          <td className="text-slate-900 font-medium text-[8.5px]">{a.municipio}</td>
                          <td className="text-slate-700 font-medium text-[8.5px]">{a.territorio}</td>
                          <td className="text-center">
                            {a.rnp ? (
                              <span className="font-extrabold text-emerald-700 text-[9px]">
                                Sim
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium text-[8.5px]">Não</span>
                            )}
                          </td>
                          <td className="text-center">
                            {a.semiarido ? (
                              <span className="font-extrabold text-amber-700 text-[9px]">
                                Sim
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium text-[8.5px]">Não</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          Nenhum ativo localizado para o escopo selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= SEÇÃO: TABELA DE CURSOS SUPERIORES ================= */}
            {(activeTab === 'sintese' || activeTab === 'cursos') && (
              <div className={`mb-8 ${activeTab === 'sintese' ? 'page-break-before pt-4' : ''}`}>
                <div className="avoid-break flex items-center justify-between border-b-2 border-primary-900 pb-1.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={15} className="text-primary-900" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-tight">
                      {activeTab === 'sintese' ? '2. Listagem Detalhada de Cursos Superiores' : 'Listagem Detalhada de Cursos Superiores'} ({filteredCursos.length} registros)
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Graduações, Pós-graduações e Modalidades Ofertadas
                  </span>
                </div>

                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-8 text-center">#</th>
                      <th className="text-left">Curso Superior</th>
                      <th className="text-left w-32">Instituição (IES)</th>
                      <th className="text-center w-20">Rede</th>
                      <th className="text-center w-16">Modalidade</th>
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
                            <td className="text-center text-slate-400 font-mono text-[8px]">{idx + 1}</td>
                            <td>
                              <div className="font-semibold text-slate-900 leading-snug">{c.nome || c.curso}</div>
                              {c.grau && (
                                <div className="text-[8.5px] text-slate-500 font-medium">Grau: {c.grau}</div>
                              )}
                            </td>
                            <td>
                              <div className="font-medium text-slate-800">{cleanIes(c.instituicao || c.entidade)}</div>
                              {c.sigla && (
                                <span className="text-[8px] font-bold text-slate-500">{c.sigla}</span>
                              )}
                            </td>
                            <td className="text-center">
                              <span className={`text-[8.5px] font-bold ${rede.color}`}>
                                {rede.nome}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className={`text-[8.5px] font-semibold ${
                                c.ead ? 'text-purple-700' : 'text-slate-600'
                              }`}>
                                {c.ead ? 'EaD' : 'Presencial'}
                              </span>
                            </td>
                            <td className="text-slate-800">{c.municipio || '-'}</td>
                            <td className="text-slate-600">{c.territorio_identidade || c.territorio || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                          Nenhum curso localizado para o escopo selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= SEÇÃO: TABELA DE CADEIAS PRODUTIVAS ================= */}
            {(activeTab === 'sintese' || activeTab === 'cadeias') && (
              <div className={`mb-8 ${activeTab === 'sintese' ? 'page-break-before pt-4' : ''}`}>
                <div className="avoid-break flex items-center justify-between border-b-2 border-primary-900 pb-1.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <GitPullRequest size={15} className="text-primary-900" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-tight">
                      {activeTab === 'sintese' ? '3. Listagem de Cadeias Produtivas e APLs' : 'Listagem de Cadeias Produtivas e APLs'} ({filteredCadeias.length} registros)
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Segmentos Econômicos e Arranjos Produtivos Territoriais
                  </span>
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
                            <td className="text-center text-slate-400 font-mono text-[8px]">{idx + 1}</td>
                            <td className="font-semibold text-slate-900 leading-snug">{cad.nome}</td>
                            <td className="text-slate-700 font-medium text-[8.5px]">
                              {cad.segmento || cad.shortTipo || 'APL'}
                            </td>
                            <td className="text-slate-800">{cad.municipio_sede || '-'}</td>
                            <td className="text-slate-600">{cad.territorio_identidade || '-'}</td>
                            <td className="text-slate-600 text-[8px]">
                              {muns.length > 0 ? (
                                <span>{muns.join(', ')}</span>
                              ) : (
                                <span className="text-slate-400">Territorial / Sede</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          Nenhuma cadeia produtiva localizada para o escopo selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= SEÇÃO: TABELA DE MUNICÍPIOS E COBERTURA ================= */}
            {(activeTab === 'sintese' || activeTab === 'municipios') && (
              <div className={`mb-8 ${activeTab === 'sintese' ? 'page-break-before pt-4' : ''}`}>
                <div className="avoid-break flex items-center justify-between border-b-2 border-primary-900 pb-1.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-primary-900" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-tight">
                      {activeTab === 'sintese' ? '4. Matriz de Atendimento por Município' : 'Matriz de Atendimento por Município'} ({filteredMunicipios.length} municípios)
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Presença de Ativos Físicos e Oferta Universitária
                  </span>
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
                            <td className="text-center text-slate-400 font-mono text-[8px]">{idx + 1}</td>
                            <td className="font-semibold text-slate-900">{nomeMun}</td>
                            <td className="text-slate-600">{m.nome_territorio || m.territorio || '-'}</td>
                            <td className="text-center font-mono text-[8.5px] text-slate-500">{m.codigo_ibge || m.id_municipio || '-'}</td>
                            <td className="text-center">
                              {isSemi ? (
                                <span className="font-extrabold text-amber-700 text-[9px]">
                                  Sim
                                </span>
                              ) : (
                                <span className="text-slate-500 font-medium text-[8.5px]">Não</span>
                              )}
                            </td>
                            <td className="text-center font-bold text-slate-950 text-[8.5px]">{qAtivos}</td>
                            <td className="text-center font-bold text-slate-950 text-[8.5px]">{qCursos}</td>
                            <td className="text-center">
                              {atendido ? (
                                <span className="font-bold text-emerald-800 text-[8.5px]">
                                  Atendido
                                </span>
                              ) : (
                                <span className="text-slate-500 font-medium text-[8.5px]">
                                  Sem Registro
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                          Nenhum município localizado para o escopo selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= RODAPÉ OFICIAL DA PÁGINA ================= */}
            <div className="avoid-break mt-8 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 gap-2">
              <div>
                <strong>Sistema de Gestão Territorial de Ciência, Tecnologia e Inovação • SECTI/BA</strong>
                <p>Governo do Estado da Bahia • Secretaria de Ciência, Tecnologia e Inovação</p>
              </div>
              <div className="text-right">
                <div>Documento analítico gerado eletronicamente para fins de auditoria e planejamento.</div>
                <div>Emissão em {emissaoDate} • Todos os direitos reservados.</div>
              </div>
            </div>

          </div>
        </main>

      </div>
    </>
  );
}
