import { useState, useEffect, useMemo } from 'react';
import territoriosMunicipios from './utils/territorioMunicipios.json';

// Otimização: Memoiza a função de normalização para evitar recalcular strings repetidamente.
const normalize = (() => {
    const cache = new Map();
    const CACHE_LIMIT = 2000; // Limite para evitar consumo excessivo de memória

    return (value) => {
        const strValue = String(value || '');
        if (cache.has(strValue)) {
            return cache.get(strValue);
        }
        const result = strValue.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cache.size > CACHE_LIMIT) {
            cache.delete(cache.keys().next().value); // Remove o item mais antigo
        }
        cache.set(strValue, result);
        return result;
    };
})();

// Helper para extrair o nome do município satélite de forma robusta
const extrairSatelite = (cad) => {
    const val = cad.municipioSatelite || cad.municipiosSatelites || cad.satelite || cad.municipio_satelite || cad.municipios_satelites || cad.Satelite || cad.Satelites;
    if (!val || val === 'undefined' || val === 'null') return '';
    if (Array.isArray(val)) {
        return val.map(item => typeof item === 'object' ? (item.Title || item.nome || item.NOME || item.value || '') : item).filter(Boolean).join(', ').trim();
    }
    if (typeof val === 'object') return val.Title || val.nome || val.NOME || val.value || '';
    return String(val).trim();
};

// NOVO: Função para truncar o IFDM em 3 casas decimais SEM arredondamento matemático
// Exemplo: 0.58978... se tornará "0.589" em vez de "0.590"
const formatIFDM = (val) => {
    if (val == null || isNaN(val)) return "-";
    // Força 6 casas decimais primeiro para evitar bugs de ponto flutuante do JavaScript
    const str = Number(val).toFixed(6); 
    // Corta a string exatamente 3 posições após o ponto
    return str.substring(0, str.indexOf('.') + 4); 
};

const passesCadeiaFilterAndSearch = (cad, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm) => {
    const tipoLower = String(cad.tipo || '').toLowerCase();
    const isAPL = tipoLower.includes('apl') || tipoLower.includes('arranjo');
    const isIG = tipoLower.includes('ig') || tipoLower.includes('indicação');
    const cadCategory = isAPL ? 'APL' : isIG ? 'IG' : null;

    if (cadeiaProdutivaFilter && cadeiaProdutivaFilter.length > 0) {
        if (!cadCategory) return false;
        const segmentKey = `${cadCategory}__${cad.segmento}`;
        const categorySelected = cadeiaProdutivaFilter.includes(cadCategory);
        const segmentSelected = cadeiaProdutivaFilter.includes(segmentKey);

        if (!categorySelected && !segmentSelected) {
            return false;
        }
    }

    if (debouncedCadeiaSearchTerm) {
        const cTerm = normalize(debouncedCadeiaSearchTerm);
        const satelite = extrairSatelite(cad);
        const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(satelite)} ${normalize(cad.municipiosPertencentes || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
        if (!searchString.includes(cTerm)) {
            return false;
        }
    }

    return true;
};

export default function useTerritoriosData(filters) {
    const {
        selectedLocation,
        filtroSemiarido,
        debouncedSearchTerm,
        ifdmMin,
        ifdmMax,
        semiMunsMin,
        semiMunsMax,
        cadeiaProdutivaFilter,
        ctiFilters,
        isCtiFilterActive,
        areaGeralFilter,
        debouncedCursoSearchTerm,
        debouncedCadeiaSearchTerm,
        debouncedCtiSearchTerm
    } = filters;

    const [territoriosData, setTerritoriosData] = useState([]);
    const [globalStats, setGlobalStats] = useState({ totalBahia: 417, totalSemiarido: 0, pctGlobalSemiarido: 0 });
    const [semiaridoMunicipios, setSemiaridoMunicipios] = useState([]);
    const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
    const [lastUpdate, setLastUpdate] = useState("Atualizando...");

    const carregarDadosDoSharePoint = async (forcarRefresh = false) => {
        setIsLoadingPipeline(true);
        try {
            const isDev = import.meta.env.DEV;
            let url = isDev ? (forcarRefresh ? '/api/sharepoint?nocache=true' : '/api/sharepoint') : '/dados.json';
            let response = await fetch(url);
            if (!response.ok && !isDev) response = await fetch('/api/sharepoint');
            if (!response.ok) throw new Error('Falha ao comunicar com a base de dados');

            const data = await response.json();
            const semiaridoNormList = (data.semiaridoMunicipiosList || []).map(m => normalize(m));

            const territoriosFormatados = data.territories.map((t, index) => {
                const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.territory));
                let trueQtdSemi = 0;
                if (territorioBase) {
                    territorioBase.municipios.forEach(m => { if (semiaridoNormList.includes(normalize(m))) trueQtdSemi++; });
                }
                const trueTotalMuns = territorioBase ? territorioBase.municipios.length : 0;
                const truePctSemiarido = trueTotalMuns > 0 ? (trueQtdSemi / trueTotalMuns) * 100 : 0;
                const trueIsSemiarido = trueQtdSemi > 0;
                const entidadesCTI = Array.isArray(t.capacidadeDetalhada) ? t.capacidadeDetalhada : [];
                const cadeiasAPL = Array.isArray(t.cadeiasProdutivasDetalhado) ? t.cadeiasProdutivasDetalhado : [];
                const cursosEnsino = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];

                return {
                    id: String(index + 1), nome: t.territory || "Desconhecido", tipo: 'Território', regiao: t.territory || "",
                    isSemiarido: trueIsSemiarido, pctSemiarido: truePctSemiarido, qtdSemiarido: trueQtdSemi,
                    entidadesDetalhadas: entidadesCTI, cadeiasProdutivasDetalhado: cadeiasAPL,
                    desenvolvimentoDetalhado: Array.isArray(t.desenvolvimentoDetalhado) ? t.desenvolvimentoDetalhado : [],
                    cursosDetalhado: cursosEnsino,
                    assistenciaPublica: t.assistenciaPublica || { iniciativas: [] },
                    desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
                    kpis: {
                        capacidadeCti: String(entidadesCTI.length), 
                        ifdm: t.desenvolvimento?.ifdmTi ? formatIFDM(t.desenvolvimento.ifdmTi) : "-",
                        conectaBahia: t.assistenciaPublica?.existe ? "Presente" : "Não mapeado", cadeiasIgs: String(cadeiasAPL.length),
                        coberturaSemiarido: trueIsSemiarido ? (truePctSemiarido >= 100 ? "Pertencente" : "") : "Exterior"
                    }
                };
            });

            setTerritoriosData(territoriosFormatados);
            setGlobalStats(data.globalStats || { totalBahia: 417, totalSemiarido: 0, pctGlobalSemiarido: 0 });
            setSemiaridoMunicipios(semiaridoNormList);
            setLastUpdate(new Date(data.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } catch (error) {
            console.error("[Painel] Erro fatal:", error); setLastUpdate("Erro na Sincronização");
        } finally { setIsLoadingPipeline(false); }
    };

    useEffect(() => { carregarDadosDoSharePoint(); }, []);

    const isMunValid = (munName) => {
        if (!munName) return false;
        if (filtroSemiarido && !semiaridoMunicipios.includes(normalize(munName))) return false;
        return true;
    };

    const filteredOptions = useMemo(() => {
        const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
        const results = [];
        territoriosData.forEach(t => {
            if (filtroSemiarido && !t.isSemiarido) return;

            const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(formatIFDM(t.desenvolvimento.ifdmTi)) : 0;
            if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) return;
            if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) return;

            if (!rawTerm) { results.push({ ...t, matchType: 'Território', matchText: t.regiao }); return; }

            let matched = false; let foundMunMatch = null; let foundEntMatch = null; let foundCadeiaMatch = null; let foundCursoMatch = null;
            const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.nome));

            if (territorioBase) {
                const foundMun = territorioBase.municipios.find(m => {
                    const searchString = normalize(m);
                    return terms.every(term => searchString.includes(term));
                });
                if (foundMun && isMunValid(foundMun)) { matched = true; foundMunMatch = foundMun; }
            }
            if (!matched && t.entidadesDetalhadas) {
                foundEntMatch = t.entidadesDetalhadas.find(ent => {
                    if (!isMunValid(ent.municipio) || (ent.categoria && !ctiFilters[ent.categoria])) return false;
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                    return terms.every(term => searchString.includes(term));
                });
                if (foundEntMatch) matched = true;
            }
            if (!matched && t.cadeiasProdutivasDetalhado) {
                foundCadeiaMatch = t.cadeiasProdutivasDetalhado.find(cad => {
                    if (!isMunValid(cad.sede || extrairSatelite(cad))) return false;
                    if (!passesCadeiaFilterAndSearch(cad, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm)) return false;
                    const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                    return terms.every(term => searchString.includes(term));
                });
                if (foundCadeiaMatch) matched = true;
            }
            if (!matched && t.cursosDetalhado) {
                foundCursoMatch = t.cursosDetalhado.find(curso => {
                    if (!isMunValid(curso.municipio)) return false;
                    const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                    return terms.every(term => searchString.includes(term));
                });
                if (foundCursoMatch) matched = true;
            }

            if (foundMunMatch) results.push({ ...t, matchType: 'Município', matchText: foundMunMatch });
            else if (foundEntMatch) results.push({ ...t, matchType: terms.some(term => normalize(foundEntMatch.tipo).includes(term)) ? 'Tipo de Infraestrutura' : 'Entidade CT&I', matchText: foundEntMatch.entidade });
            else if (foundCadeiaMatch) results.push({ ...t, matchType: 'Cadeia Produtiva', matchText: foundCadeiaMatch.segmento });
            else if (foundCursoMatch) results.push({ ...t, matchType: 'Curso Superior', matchText: foundCursoMatch.curso });
            else if (terms.every(term => normalize(t.nome).includes(term))) results.push({ ...t, matchType: 'Território', matchText: t.regiao });
        });
        return results.sort((a, b) => a.nome.localeCompare(b.nome));
    }, [debouncedSearchTerm, territoriosData, filtroSemiarido, semiaridoMunicipios, ifdmMin, ifdmMax, ctiFilters, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm]);

    const territoriesDynamicStats = useMemo(() => {
        const stats = {};
        const rawTerm = normalize(debouncedSearchTerm);
        const terms = rawTerm.split(' ').filter(Boolean);
        const cursoTerm = normalize(debouncedCursoSearchTerm);
        const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === rawTerm);

        const activeCtiCategories = Object.keys(ctiFilters).filter(k => ctiFilters[k]);
        const isCtiFiltered = Boolean(isCtiFilterActive) || activeCtiCategories.length < 8;
        const isCursoFiltered = cursoTerm !== '' || (areaGeralFilter && areaGeralFilter.length > 0);
        const isCadeiaFiltered = (cadeiaProdutivaFilter && cadeiaProdutivaFilter.length > 0) || Boolean(debouncedCadeiaSearchTerm);

        territoriosData.forEach(t => {
            const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(formatIFDM(t.desenvolvimento.ifdmTi)) : 0;

            let passesIntervals = true;
            if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) passesIntervals = false;
            if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) passesIntervals = false;

            let somaIfdmLocal = 0; let qtdIfdmLocal = 0;
            if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
                t.desenvolvimentoDetalhado.forEach(m => {
                    if (isMunValid(m.municipio)) {
                        if (Number(m.ifdm) > 0) { 
                            somaIfdmLocal += Number(m.ifdm); 
                            qtdIfdmLocal += 1; 
                        }
                    }
                });
            } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
                somaIfdmLocal = t.desenvolvimento.ifdmTi; 
                qtdIfdmLocal = 1;
            }

            // LÓGICA E (AND): Se houver filtro ativado (menos de 8 categorias ativas),
            // o território só é mantido se tiver pelo menos 1 entidade de CADA categoria selecionada.
            let passesCtiAndLogic = true;
            if (isCtiFiltered) {
                if (activeCtiCategories.length === 0) {
                    passesCtiAndLogic = false;
                } else {
                    passesCtiAndLogic = activeCtiCategories.every(cat => {
                        return (t.entidadesDetalhadas || []).some(ent => {
                            if (!isMunValid(ent.municipio)) return false;
                            if (ent.categoria !== cat) return false;
                            if (rawTerm && !isSearchTermATerritory) {
                                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(t.nome)}`;
                                if (!terms.every(term => searchString.includes(term))) return false;
                            }
                            if (debouncedCtiSearchTerm) {
                                const cTerm = normalize(debouncedCtiSearchTerm);
                                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(ent.categoria || '')} ${normalize(t.nome)}`;
                                if (!searchString.includes(cTerm)) return false;
                            }
                            return true;
                        });
                    });
                }
            }

            const validCti = (t.entidadesDetalhadas || []).filter(ent => {
                if (!isMunValid(ent.municipio) || (ent.categoria && !ctiFilters[ent.categoria])) return false;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(t.nome)}`;
                    if (!terms.every(term => searchString.includes(term))) return false;
                }
                if (debouncedCtiSearchTerm) {
                    const cTerm = normalize(debouncedCtiSearchTerm);
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(ent.categoria || '')} ${normalize(t.nome)}`;
                    if (!searchString.includes(cTerm)) return false;
                }
                return true;
            });

            const validCadeias = (t.cadeiasProdutivasDetalhado || []).filter(cad => {
                if (!isMunValid(cad.sede || extrairSatelite(cad))) return false;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')} ${normalize(t.nome)}`;
                    if (!terms.every(term => searchString.includes(term))) return false;
                }

                if (cad.entidade) {
                    const entidadeCadeiaNorm = normalize(cad.entidade);
                    const linkedEnt = (t.entidadesDetalhadas || []).find(ent => 
                        normalize(ent.entidade).includes(entidadeCadeiaNorm)
                    );
                    if (linkedEnt && linkedEnt.categoria && !ctiFilters[linkedEnt.categoria]) {
                        return false;
                    }
                }

                if (!passesCadeiaFilterAndSearch(cad, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm)) return false;

                return true;
            });

            const validCursos = (t.cursosDetalhado || []).filter(curso => {
                if (!isMunValid(curso.municipio)) return false;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.areaGeral)} ${normalize(curso.municipio)} ${normalize(t.nome)}`;
                    if (!terms.every(term => searchString.includes(term))) return false;
                }
                if (cursoTerm && !normalize(curso.curso).includes(cursoTerm)) return false;
                if (areaGeralFilter && areaGeralFilter.length > 0 && !areaGeralFilter.includes(curso.areaGeral || 'Não Informada')) return false;

                const tipoNorm = normalize(`${curso.orgAcademica} ${curso.categoriaAdm} ${curso.entidade}`);
                let catCurso = null;
                const isPrivada = tipoNorm.includes('privada') || tipoNorm.includes('lucrativo') || tipoNorm.includes('particular');
                if (['universidade', 'faculdade', 'centro', 'superior'].some(c => tipoNorm.includes(c))) {
                    catCurso = isPrivada ? 'campiUniversidadePrivada' : 'campiUniversidadePublica';
                } else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) {
                    catCurso = 'campiInstitutoFederal';
                }
                if (catCurso && !ctiFilters[catCurso]) return false;

                return true;
            });

            let matchesSearch = true;
            if (rawTerm) {
                const territorioBase = territoriosMunicipios.territorios_de_identidade.find(tb => normalize(tb.nome) === normalize(t.nome));
                const tMatches = terms.every(term => normalize(t.nome).includes(term));
                const mMatches = territorioBase && territorioBase.municipios.some(m => terms.every(term => normalize(m).includes(term)));
                matchesSearch = tMatches || mMatches || (!isSearchTermATerritory && (validCti.length > 0 || validCadeias.length > 0 || validCursos.length > 0));
            }

            const hasDataForFilters = !( (!passesCtiAndLogic) || (isCursoFiltered && validCursos.length === 0) || (isCadeiaFiltered && validCadeias.length === 0) );

            stats[normalize(t.nome)] = {
                ifdm: qtdIfdmLocal > 0 ? formatIFDM(somaIfdmLocal / qtdIfdmLocal) : "-",
                capacidadeCti: String(validCti.length),
                cadeiasIgs: String(validCadeias.length),
                cursos: String(validCursos.length),
                pctSemiarido: t.pctSemiarido,
                matchesFilters: passesIntervals && matchesSearch && hasDataForFilters
            };
        });
        return stats;
    }, [territoriosData, filtroSemiarido, debouncedSearchTerm, semiaridoMunicipios, ifdmMin, ifdmMax, ctiFilters, isCtiFilterActive, areaGeralFilter, debouncedCursoSearchTerm, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm, debouncedCtiSearchTerm]);

    const dashboardData = useMemo(() => {
    if (!territoriosData || territoriosData.length === 0) {
        return { 
            topKpis: { capacidadeCti: "0", ifdm: "-", cadeiasIgs: "0", coberturaSemiarido: "0%", cursos: "0", unfiltCursosCount: 0 },
            topKpisPct: { cti: 0, ifdm: 0, semiarido: 0, cadeias: 0, cursos: 0 },
            subKpis: {}, unfiltSubKpis: {}, entidades: [], aplIgs: [], cursos: [] 
        };
    }

    let targetList = selectedLocation 
        ? territoriosData.filter(t => normalize(t.nome) === normalize(selectedLocation.nome || selectedLocation.territory || selectedLocation.regiao))
        : territoriosData;

    if (targetList.length === 0) targetList = territoriosData;

    const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
    const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === rawTerm);
    
    const kpisPanel = { campiUniversidadePublica: 0, campiUniversidadePrivada: 0, campiInstitutoFederal: 0, icts: 0, centrosPesquisa: 0, espacoDinamizadoress: 0, parquesTecnologicos: 0, incubadoras: 0 };
    const unfiltKpisPanel = { campiUniversidadePublica: 0, campiUniversidadePrivada: 0, campiInstitutoFederal: 0, icts: 0, centrosPesquisa: 0, espacoDinamizadoress: 0, parquesTecnologicos: 0, incubadoras: 0 };
    
    const entidadesFlat = []; const aplIgsFlat = []; const cursosFlat = [];
    const globalIds = new Set(); const globalCadeiasIds = new Set();
    
    let somaIfdmGlobal = 0; let qtdMunicipiosIfdmGlobal = 0;
    
    let unfiltCursosCount = 0;
    const unfiltIds = new Set(); const unfiltCadeiasIds = new Set();

    targetList.forEach(t => {
        unfiltCursosCount += (t.cursosDetalhado || []).length;

        const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(formatIFDM(t.desenvolvimento.ifdmTi)) : 0;
        if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) return;
        if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) return;

        const stats = territoriesDynamicStats[normalize(t.nome)];
        if (stats && !stats.matchesFilters) {
            return;
        }

        (t.entidadesDetalhadas || []).forEach(ent => {
            if (!ent.municipio) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(t.nome)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            if (ent.id) {
                unfiltIds.add(ent.id);
                if (ent.categoria && unfiltKpisPanel[ent.categoria] !== undefined) unfiltKpisPanel[ent.categoria]++;
            }
        });
        
        (t.cadeiasProdutivasDetalhado || []).forEach(cad => {
            const sateliteRobusto = extrairSatelite(cad);
            const sede = cad.sede || sateliteRobusto || 'Não informada';
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(cad.segmento)} ${normalize(sede)} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')} ${normalize(t.nome)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            if (cad.id) unfiltCadeiasIds.add(cad.id);
        });

        if (filtroSemiarido && !t.isSemiarido) return;

        (t.cursosDetalhado || []).forEach(curso => {
            if (!isMunValid(curso.municipio)) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)} ${normalize(t.nome)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }

            const tipoNorm = normalize(`${curso.orgAcademica} ${curso.categoriaAdm} ${curso.entidade}`);
            let catCurso = null;
            const isPrivada = tipoNorm.includes('privada') || tipoNorm.includes('lucrativo') || tipoNorm.includes('particular');
            if (['universidade', 'faculdade', 'centro', 'superior'].some(c => tipoNorm.includes(c))) {
                catCurso = isPrivada ? 'campiUniversidadePrivada' : 'campiUniversidadePublica';
            } else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) {
                catCurso = 'campiInstitutoFederal';
            }
            if (catCurso && !ctiFilters[catCurso]) return;

            cursosFlat.push({ ...curso, territorioRef: t.nome });
        });

        (t.entidadesDetalhadas || []).forEach(ent => {
            if (!isMunValid(ent.municipio)) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(t.nome)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            
            if (ent.categoria && !ctiFilters[ent.categoria]) return;

            if (debouncedCtiSearchTerm) {
                const cTerm = normalize(debouncedCtiSearchTerm);
                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)} ${normalize(ent.categoria || '')} ${normalize(t.nome)}`;
                if (!searchString.includes(cTerm)) return;
            }

            entidadesFlat.push({ ...ent, territorioRef: t.nome });
            if (ent.id && !globalIds.has(ent.id)) {
                globalIds.add(ent.id); 
                if (ent.categoria && kpisPanel[ent.categoria] !== undefined) kpisPanel[ent.categoria]++;
            }
        });
        
        (t.cadeiasProdutivasDetalhado || []).forEach(cad => {
            const sateliteRobusto = extrairSatelite(cad);
            const sede = cad.sede || sateliteRobusto || 'Não informada';
            const perts = filtroSemiarido ? String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(m => isMunValid(m)) : String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(Boolean);
            if (filtroSemiarido && !isMunValid(sede) && perts.length === 0) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(cad.segmento)} ${normalize(sede)} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')} ${normalize(t.nome)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }

            if (cad.entidade) {
                const entidadeCadeiaNorm = normalize(cad.entidade);
                const linkedEnt = (t.entidadesDetalhadas || []).find(ent => 
                    normalize(ent.entidade).includes(entidadeCadeiaNorm)
                );
                if (linkedEnt && linkedEnt.categoria && !ctiFilters[linkedEnt.categoria]) {
                    return;
                }
            }

            if (!passesCadeiaFilterAndSearch(cad, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm)) return;

            aplIgsFlat.push({
                id: cad.id || `${normalize(cad.segmento || '')}-${normalize(cad.tipo || '')}`, segmento: cad.segmento || 'Sem Segmento', entidade: cad.entidade, tipo: cad.tipo || 'N/A',
                municipiosPertencentes: perts.join(', ') || sede, sede, territorioRef: t.nome, municipioSatelite: sateliteRobusto, fonte: cad.fonte
            });
            if (cad.id) globalCadeiasIds.add(cad.id);
        });

        if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
            t.desenvolvimentoDetalhado.forEach(m => {
                if (isMunValid(m.municipio) && Number(m.ifdm) > 0) { 
                    somaIfdmGlobal += Number(m.ifdm); 
                    qtdMunicipiosIfdmGlobal += 1; 
                }
            });
        } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
            somaIfdmGlobal += t.desenvolvimento.ifdmTi;
            qtdMunicipiosIfdmGlobal += 1;
        }
    });

    const ifdmValue = qtdMunicipiosIfdmGlobal > 0 ? (somaIfdmGlobal / qtdMunicipiosIfdmGlobal) : 0;

    let coberturaCalculada = "";
    let pctBarraSemi = 0;

    if (selectedLocation) {
        const tb = territoriosMunicipios.territorios_de_identidade.find(x => normalize(x.nome) === normalize(selectedLocation.nome));
        const totalMunTerr = tb ? tb.municipios.length : 0;
        const qtdSemiTerr = selectedLocation.qtdSemiarido || 0;
        const pctTerr = totalMunTerr > 0 ? (qtdSemiTerr / totalMunTerr) * 100 : 0;
        pctBarraSemi = pctTerr;

        if (filtroSemiarido) {
            coberturaCalculada = `${qtdSemiTerr}/${totalMunTerr} mun.`;
        } else {
            coberturaCalculada = pctTerr >= 100 ? `100% (${qtdSemiTerr} mun.)` : `${pctTerr.toFixed(1)}% (${qtdSemiTerr} mun.)`;
        }
    } else {
        pctBarraSemi = globalStats.pctGlobalSemiarido;
        coberturaCalculada = filtroSemiarido 
            ? `${globalStats.totalSemiarido}/${globalStats.totalBahia} mun.` 
            : `${globalStats.pctGlobalSemiarido.toFixed(1)}% (${globalStats.totalSemiarido} mun.)`;
    }

    const topKpisPct = {
        cti: unfiltIds.size > 0 ? (globalIds.size / unfiltIds.size) * 100 : 0,
        ifdm: ifdmValue * 100, 
        semiarido: pctBarraSemi,
        cadeias: unfiltCadeiasIds.size > 0 ? (globalCadeiasIds.size / unfiltCadeiasIds.size) * 100 : 0,
        cursos: unfiltCursosCount > 0 ? (cursosFlat.length / unfiltCursosCount) * 100 : 0
    };

    const getCursoKey = (c) => {
        return c.id || `${normalize(c.entidade)}-${normalize(c.curso)}-${normalize(c.municipio)}`;
    };

    const aggregatedAplIgs = new Map();
    aplIgsFlat.forEach(item => {
        if (!item.id) return;
        if (!aggregatedAplIgs.has(item.id)) {
            aggregatedAplIgs.set(item.id, { ...item, territorios: [item.territorioRef] });
        } else {
            const existing = aggregatedAplIgs.get(item.id);
            existing.territorios.push(item.territorioRef);
            if (!existing.fonte && item.fonte) existing.fonte = item.fonte;
            const currentMuns = new Set((existing.municipiosPertencentes || '').split(', ').filter(Boolean));
            (item.municipiosPertencentes || '').split(', ').filter(Boolean).forEach(m => currentMuns.add(m));
            existing.municipiosPertencentes = [...currentMuns].sort().join(', ');
        }
    });

    const finalAplIgs = Array.from(aggregatedAplIgs.values()).map(item => {
        const { territorioRef, ...rest } = item;
        rest.territorios = [...new Set(rest.territorios)].sort();
        return rest;
    });

    return { 
        topKpis: {
            capacidadeCti: String(globalIds.size), 
            ifdm: qtdMunicipiosIfdmGlobal > 0 ? formatIFDM(ifdmValue) : "-",
            cadeiasIgs: String(globalCadeiasIds.size), 
            coberturaSemiarido: coberturaCalculada,
            cursos: String(cursosFlat.length),
            unfiltCursosCount: unfiltCursosCount
        }, 
        topKpisPct, subKpis: kpisPanel, unfiltSubKpis: unfiltKpisPanel,
        entidades: Array.from(new Map(entidadesFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.municipio || "").localeCompare(b.municipio || "")),
        aplIgs: finalAplIgs.sort((a, b) => (a.segmento || "").localeCompare(b.segmento || "")),
        cursos: Array.from(new Map(cursosFlat.map(item => [getCursoKey(item), item])).values()).sort((a, b) => (a.curso || "").localeCompare(b.curso || ""))
    };}, [selectedLocation, filtroSemiarido, territoriosData, semiaridoMunicipios, debouncedSearchTerm, ifdmMin, ifdmMax, ctiFilters, globalStats, cadeiaProdutivaFilter, debouncedCadeiaSearchTerm, territoriesDynamicStats]);

    return {
        territoriosData,
        globalStats,
        semiaridoMunicipios,
        isLoadingPipeline,
        lastUpdate,
        carregarDadosDoSharePoint,
        filteredOptions,
        dashboardData,
        territoriesDynamicStats,
    };
}