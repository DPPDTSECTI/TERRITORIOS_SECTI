import React, { useContext, useState, useMemo } from 'react';
import { 
 Building2, 
 MapPin, 
 Wifi, 
 GraduationCap, 
 PieChart as PieIcon, 
 BarChart3, 
 Printer, 
 X, 
 BookOpen,
 Layers
} from 'lucide-react';
import { 
 ResponsiveContainer, 
 BarChart, 
 Bar, 
 XAxis, 
 YAxis, 
 Tooltip as RechartsTooltip, 
 Cell, 
 PieChart, 
 Pie,
 LabelList
} from 'recharts';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import { municipiosDB } from '../../data/municipiosDB';

const PALETTE = ['#1D3557', '#2563EB', '#457B9D', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const CATEGORIAS_ENSINO_VALIDAS = [
 'Campi Instituto Federal',
 'Campi Universidade Privada',
 'Campi Universidade Pública - Federal',
 'Campi Universidade Pública - Estadual'
];

function normalizeName(value) {
 if (!value) return '';
 return String(value)
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .toLowerCase()
 .replace(/[^a-z0-9]/g, ' ')
 .replace(/\s+/g, ' ')
 .trim();
}

const MUN_LOOKUP = (() => {
 const byName = {};
 municipiosDB.forEach((row) => {
 byName[normalizeName(row.nome_municipio)] = row;
 });
 return { byName };
})();

function getTipoPadronizado(tipoStr) {
 const s = String(tipoStr || '').toLowerCase();
 if (s.includes('federal') && (s.includes('instituto') || s.includes('ifba') || s.includes('if baiano'))) {
 return 'Instituto Federal';
 }
 if (s.includes('estadual')) {
 return 'Univ. Pública Estadual';
 }
 if (s.includes('federal')) {
 return 'Univ. Pública Federal';
 }
 return 'Univ. Privada';
}

export default function RelatorioAtivosPage() {
 const { 
 ativosData = [], 
 cursosData = [], 
 loadingStats = false 
 } = useContext(DataContext);

 const [selectedTerritory, setSelectedTerritory] = useState(null);
 const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

 // 1. Isola ativos de ensino superior
 const baseEnsinoAtivos = useMemo(() => {
 if (!ativosData || ativosData.length === 0) return [];
 return ativosData.filter(a => {
 const tipo = a.tipo || a.nome_tipo || '';
 return CATEGORIAS_ENSINO_VALIDAS.some(cat => 
 normalizeName(cat) === normalizeName(tipo)
 );
 });
 }, [ativosData]);

 // 2. Filtro dos Ativos pelo Território
 const filteredAtivos = useMemo(() => {
 let list = baseEnsinoAtivos;

 if (selectedTerritory) {
 const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
 const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

 list = list.filter(a => {
 const munKey = normalizeName(a.municipio || '');
 const munRow = MUN_LOOKUP.byName[munKey];
 const idTerr = a.id_territorio != null && a.id_territorio !== '' 
 ? String(a.id_territorio) 
 : (munRow?.id_territorio ? String(munRow.id_territorio) : null);
 const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
 const normTerr = normalizeName(rawTerr);

 if (tid && idTerr && idTerr === tid) return true;
 if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
 return false;
 });
 }

 return list;
 }, [baseEnsinoAtivos, selectedTerritory]);

 // 3. Filtro dos Cursos pelo Território
 const filteredCursos = useMemo(() => {
 if (!cursosData || cursosData.length === 0) return [];
 let list = cursosData;

 if (selectedTerritory) {
 const tid = selectedTerritory.id_territorio ? Number(selectedTerritory.id_territorio) : null;
 const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);
 list = list.filter(c => 
 (tid && Number(c.id_territorio) === tid) || 
 (tNorm && normalizeName(c.territorio_identidade || c.territorio) === tNorm)
 );
 }

 return list;
 }, [cursosData, selectedTerritory]);

 // 4. Indicadores Executivos
 const statsCursosKpis = useMemo(() => {
 const totalCursos = filteredCursos.length;
 const totalCampi = filteredAtivos.length;

 const munSet = new Set();
 const terrSet = new Set();
 filteredCursos.forEach(c => {
 if (c.municipio) munSet.add(normalizeName(c.municipio));
 const terr = c.territorio_identidade || c.territorio;
 if (terr) terrSet.add(normalizeName(terr));
 });

 const mediaCursosPorCampus = totalCampi > 0 ? (totalCursos / totalCampi).toFixed(1) : '0';

 return {
 totalCursos,
 totalCampi,
 municipiosComCursos: munSet.size,
 territoriosComCursos: terrSet.size,
 mediaCursosPorCampus
 };
 }, [filteredCursos, filteredAtivos]);

 // 5. Gráfico 1: Donut de Áreas de Conhecimento com Porcentagem
 const areasChartData = useMemo(() => {
 if (!filteredCursos || filteredCursos.length === 0) return [];
 const counts = {};
 const total = filteredCursos.length;

 filteredCursos.forEach(c => {
 const area = c.categoria || c.tipo || 'Outras Áreas';
 counts[area] = (counts[area] || 0) + 1;
 });

 return Object.entries(counts)
 .sort((a, b) => b[1] - a[1])
 .map(([name, value], idx) => ({
 name,
 value,
 percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
 color: PALETTE[idx % PALETTE.length]
 }));
 }, [filteredCursos]);

 // 6. Gráfico 2: Top Municípios por Volume de Cursos
 const topMunicipiosCursosData = useMemo(() => {
 if (!filteredCursos || filteredCursos.length === 0) return [];
 const counts = {};

 filteredCursos.forEach(c => {
 const mun = c.municipio || 'Não informado';
 counts[mun] = (counts[mun] || 0) + 1;
 });

 return Object.entries(counts)
 .sort((a, b) => b[1] - a[1])
 .slice(0, 5)
 .map(([name, count]) => ({ name, count }));
 }, [filteredCursos]);

 // 7. Gráfico 3: Matriz de Distribuição por Área e Natureza Jurídica
 const matrixAreaNaturezaData = useMemo(() => {
 if (!filteredCursos || filteredCursos.length === 0) return [];

 const ativoTipoMap = new Map();
 baseEnsinoAtivos.forEach(a => {
 if (a.id_ativo || a.id) {
 ativoTipoMap.set(Number(a.id_ativo || a.id), getTipoPadronizado(a.tipo || a.nome_tipo));
 }
 });

 const countsByArea = {};

 filteredCursos.forEach(c => {
 const area = c.categoria || c.tipo || 'Geral';

 if (!countsByArea[area]) {
 countsByArea[area] = {
 categoria: area,
 'Univ. Pública Federal': 0,
 'Univ. Pública Estadual': 0,
 'Instituto Federal': 0,
 'Univ. Privada': 0,
 total: 0
 };
 }

 let tipoFinal = 'Univ. Privada';
 if (c.id_ativo && ativoTipoMap.has(Number(c.id_ativo))) {
 tipoFinal = ativoTipoMap.get(Number(c.id_ativo));
 } else if (c.sigla || c.entidade || c.instituicao) {
 tipoFinal = getTipoPadronizado(c.sigla || c.entidade || c.instituicao);
 }

 countsByArea[area][tipoFinal] = (countsByArea[area][tipoFinal] || 0) + 1;
 countsByArea[area].total += 1;
 });

 return Object.values(countsByArea).sort((a, b) => b.total - a.total);
 }, [filteredCursos, baseEnsinoAtivos]);

 // 8. Gráfico 4: Cobertura RNP por Categoria
 const rnpCategoryData = useMemo(() => {
 if (!filteredAtivos || filteredAtivos.length === 0) return [];
 const stats = {};

 filteredAtivos.forEach(a => {
 const tipo = a.tipo || a.nome_tipo || 'Outros';
 if (!stats[tipo]) {
 stats[tipo] = { name: tipo, comRnp: 0, semRnp: 0, total: 0 };
 }
 const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
 if (hasRnp) stats[tipo].comRnp += 1;
 else stats[tipo].semRnp += 1;
 stats[tipo].total += 1;
 });

 return Object.values(stats)
 .sort((a, b) => b.total - a.total)
 .map(item => ({
 ...item,
 pctRnp: Number(((item.comRnp / item.total) * 100).toFixed(1))
 }));
 }, [filteredAtivos]);

 return (
 <main className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white print:overflow-visible">
 
 {/* CABEÇALHO */}
 <div className="flex items-center justify-between w-full pr-[340px] shrink-0">
 <div className="flex flex-col">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
 Relatório Executivo de Cursos e Ensino Superior de CT&I
 </h1>
 <span className="bg-primary-600/10 text-primary-600 text-[11px] font-medium uppercase px-2.5 py-1 rounded-full border border-primary-600/20 flex items-center gap-1 justify-center leading-none">
 <GraduationCap size={16} className="text-primary-600" />
 Formação & Infraestrutura
 </span>

 {selectedTerritory && (
 <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
 <MapPin size={16} className="text-primary-600" />
 <span className="text-[11px] font-medium text-[#0369A1]">
 Recorte: <strong className="text-[#0C4A6E]">{territoryName}</strong>
 </span>
 <button
 type="button"
 onClick={() => setSelectedTerritory(null)}
 className="text-[#0369A1] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
 >
 <X size={16} />
 </button>
 </div>
 )}
 </div>
 <div className="flex items-center gap-3 mt-1">
 <p className="text-xs text-text-secondary font-medium">
 Diagnóstico territorial da oferta acadêmica e distribuição dos campi universitários na Bahia
 </p>
 <button
 type="button"
 onClick={() => window.print()}
 className="inline-flex items-center gap-1 bg-primary-900 hover:bg-primary-600 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer print:hidden justify-center leading-none"
 >
 <Printer size={16} />
 <span>Imprimir / PDF</span>
 </button>
 </div>
 </div>
 </div>

 {/* GRID DE KPIS */}
 <div className="w-full relative z-10 shrink-0">
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
 <div className="h-[92px] bg-white rounded-xl p-4 flex flex-col justify-between shadow-glass border border-transparent">
 <div className="flex items-center gap-2 text-text-secondary">
 <div className="w-7 h-7 rounded-lg bg-primary-200/70 flex items-center justify-center text-primary-600">
 <BookOpen size={16} strokeWidth={2} />
 </div>
 <span className="text-[11px] font-medium uppercase ">Cursos Mapeados</span>
 </div>
 <span className="text-2xl lg:text-3xl font-bold text-text-primary leading-none">
 {loadingStats ? '...' : statsCursosKpis.totalCursos}
 </span>
 </div>

 <div className="h-[92px] bg-white rounded-xl p-4 flex flex-col justify-between shadow-glass border border-transparent">
 <div className="flex items-center gap-2 text-text-secondary">
 <div className="w-7 h-7 rounded-lg bg-primary-200/70 flex items-center justify-center text-primary-600">
 <Building2 size={16} strokeWidth={2} />
 </div>
 <span className="text-[11px] font-medium uppercase ">Campi Ofertantes</span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl lg:text-3xl font-bold text-text-primary leading-none">
 {loadingStats ? '...' : statsCursosKpis.totalCampi}
 </span>
 <span className="text-[11px] font-medium text-text-secondary bg-surface-soft px-2 py-0.5 rounded-md inline-flex items-center justify-center leading-none">
 ~{statsCursosKpis.mediaCursosPorCampus} cursos/campus
 </span>
 </div>
 </div>

 <div className="h-[92px] bg-white rounded-xl p-4 flex flex-col justify-between shadow-glass border border-transparent">
 <div className="flex items-center gap-2 text-text-secondary">
 <div className="w-7 h-7 rounded-lg bg-primary-200/70 flex items-center justify-center text-primary-600">
 <MapPin size={16} strokeWidth={2} />
 </div>
 <span className="text-[11px] font-medium uppercase ">Municípios com Cursos</span>
 </div>
 <span className="text-2xl lg:text-3xl font-bold text-text-primary leading-none">
 {loadingStats ? '...' : `${statsCursosKpis.municipiosComCursos} municípios`}
 </span>
 </div>

 <div className="h-[92px] bg-white rounded-xl p-4 flex flex-col justify-between shadow-glass border border-transparent">
 <div className="flex items-center gap-2 text-text-secondary">
 <div className="w-7 h-7 rounded-lg bg-primary-200/70 flex items-center justify-center text-primary-600">
 <Layers size={16} strokeWidth={2} />
 </div>
 <span className="text-[11px] font-medium uppercase ">Territórios com Oferta</span>
 </div>
 <span className="text-2xl lg:text-3xl font-bold text-text-primary leading-none">
 {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsCursosKpis.territoriosComCursos} de 27`)}
 </span>
 </div>
 </div>
 </div>

 {/* GRID PRINCIPAL */}
 <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full">
 
 {/* COLUNA ESQUERDA: GRID 2x2 */}
 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">
 
 {/* GRÁFICO 1: DONUT DE ÁREAS COM LEGENDA ESTÁTICA EM BAIXO */}
 <div className="bg-white rounded-xl p-4 border border-transparent shadow-glass flex flex-col justify-between min-h-0 h-full overflow-hidden">
 <div className="flex items-center justify-between mb-1 shrink-0">
 <div>
 <h3 className="text-[13px] font-medium text-text-primary">Áreas de Conhecimento</h3>
 <p className="text-[11px] text-text-secondary">Distribuição dos cursos ofertados</p>
 </div>
 <PieIcon size={16} className="text-primary-600" />
 </div>

 <div className="flex-1 flex items-center gap-2 min-h-0 overflow-hidden">
 {/* ROSCA */}
 <div className="w-[45%] h-full flex items-center justify-center">
 {areasChartData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={areasChartData}
 dataKey="value"
 nameKey="name"
 cx="50%"
 cy="50%"
 innerRadius="50%"
 outerRadius="85%"
 paddingAngle={3}
 >
 {areasChartData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 </PieChart>
 </ResponsiveContainer>
 ) : (
 <span className="text-[10px] text-gray-400 font-medium">Sem dados</span>
 )}
 </div>

 {/* LEGENDA DETALHADA FIXA */}
 <div className="w-[55%] flex flex-col justify-center gap-1.5 overflow-y-auto pr-1">
 {areasChartData.map((item, idx) => (
 <div key={idx} className="flex items-center justify-between gap-1 text-[10px]">
 <div className="flex items-center gap-1.5 min-w-0">
 <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
 <span className="font-medium text-text-primary truncate" title={item.name}>
 {item.name}
 </span>
 </div>
 <span className="font-medium text-text-secondary shrink-0">
 {item.value} ({item.percent}%)
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* GRÁFICO 2: POLOS DE OFERTA COM RÓTULOS INTERNOS */}
 <div className="bg-white rounded-xl p-4 border border-transparent shadow-glass flex flex-col justify-between min-h-0 h-full overflow-hidden">
 <div className="flex items-center justify-between mb-1 shrink-0">
 <div>
 <h3 className="text-[13px] font-medium text-text-primary">Polos de Oferta</h3>
 <p className="text-[11px] text-text-secondary">Cidades com maior volume de cursos</p>
 </div>
 <BarChart3 size={16} className="text-primary-600" />
 </div>

 <div className="flex-1 w-full min-h-0 pt-1">
 {topMunicipiosCursosData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={topMunicipiosCursosData} layout="vertical" margin={{ left: 5, right: 28, top: 0, bottom: 0 }}>
 <XAxis type="number" hide />
 <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#1D3557', fontWeight: 700 }} />
 <Bar dataKey="count" radius={[0, 6, 6, 0]}>
 {topMunicipiosCursosData.map((_, index) => (
 <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
 ))}
 <LabelList 
 dataKey="count" 
 position="insideRight" 
 fill="#ffffff" 
 fontSize={10.5} 
 fontWeight={800} 
 offset={8}
 />
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="h-full flex items-center justify-center">
 <span className="text-[11px] text-gray-400 font-medium">Sem dados</span>
 </div>
 )}
 </div>
 </div>

 {/* GRÁFICO 3: MATRIZ DE COMPOSIÇÃO POR ÁREA E REDE */}
 <div className="bg-white rounded-xl p-4 border border-transparent shadow-glass flex flex-col justify-between min-h-0 h-full overflow-hidden">
 <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-surface-soft pb-1">
 <div>
 <h3 className="text-[13px] font-medium text-text-primary">Composição por Área e Rede</h3>
 <p className="text-[10px] text-text-secondary">Proporção Federal, Estadual, IF e Privada</p>
 </div>

 {/* LEGENDA */}
 <div className="flex items-center gap-2 text-[9px] font-medium">
 <span className="flex items-center gap-1 text-text-primary"><span className="w-2 h-2 rounded-full bg-primary-900"></span>Fed.</span>
 <span className="flex items-center gap-1 text-primary-600"><span className="w-2 h-2 rounded-full bg-primary-600"></span>Est.</span>
 <span className="flex items-center gap-1 text-success-500"><span className="w-2 h-2 rounded-full bg-success-500"></span>IF</span>
 <span className="flex items-center gap-1 text-warning-600"><span className="w-2 h-2 rounded-full bg-warning-600"></span>Priv.</span>
 </div>
 </div>

 <div className="flex-1 flex flex-col justify-around gap-1 overflow-y-auto pr-1 min-h-0">
 {matrixAreaNaturezaData.map((row, idx) => (
 <div key={idx} className="flex flex-col gap-0.5">
 <div className="flex items-center justify-between text-[11px]">
 <span className="font-medium text-text-primary truncate max-w-[70%]">
 {row.categoria}
 </span>
 <span className="font-medium text-text-secondary text-[10px]">
 {row.total} cursos
 </span>
 </div>

 <div className="w-full h-2 rounded-full bg-border overflow-hidden flex shadow-2xs">
 {row['Univ. Pública Federal'] > 0 && (
 <div 
 className="h-full bg-primary-900"
 style={{ width: `${(row['Univ. Pública Federal'] / row.total) * 100}%` }}
 title={`Federal: ${row['Univ. Pública Federal']} cursos`}
 />
 )}
 {row['Univ. Pública Estadual'] > 0 && (
 <div 
 className="h-full bg-primary-600"
 style={{ width: `${(row['Univ. Pública Estadual'] / row.total) * 100}%` }}
 title={`Estadual: ${row['Univ. Pública Estadual']} cursos`}
 />
 )}
 {row['Instituto Federal'] > 0 && (
 <div 
 className="h-full bg-success-500"
 style={{ width: `${(row['Instituto Federal'] / row.total) * 100}%` }}
 title={`IF: ${row['Instituto Federal']} cursos`}
 />
 )}
 {row['Univ. Privada'] > 0 && (
 <div 
 className="h-full bg-warning-600"
 style={{ width: `${(row['Univ. Privada'] / row.total) * 100}%` }}
 title={`Privada: ${row['Univ. Privada']} cursos`}
 />
 )}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* GRÁFICO 4: COBERTURA DE REDE RNP */}
 <div className="bg-white rounded-xl p-4 border border-transparent shadow-glass flex flex-col justify-between min-h-0 h-full overflow-hidden">
 <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-surface-soft pb-1">
 <div>
 <h3 className="text-[13px] font-medium text-text-primary">Cobertura de Rede RNP</h3>
 <p className="text-[10px] text-text-secondary">Campi conectados ao backbone de pesquisa</p>
 </div>
 <Wifi size={16} className="text-emerald-500" />
 </div>

 <div className="flex-1 flex flex-col justify-around gap-1.5 my-auto min-h-0">
 {rnpCategoryData.map((cat, idx) => (
 <div key={idx} className="flex flex-col gap-0.5 p-1.5 px-2.5 rounded-xl bg-surface-soft">
 <div className="flex items-center justify-between text-[11px]">
 <span className="font-medium text-text-primary truncate max-w-[60%]">
 {cat.name.replace(/^Campi\s+/i, '')}
 </span>
 <span className="font-medium text-text-secondary text-[10px]">
 <strong className="text-emerald-600 font-medium">{cat.comRnp}</strong> de {cat.total} ({cat.pctRnp}%)
 </span>
 </div>
 <div className="w-full h-1.5 rounded-full bg-border overflow-hidden shadow-2xs">
 <div 
 className="h-full bg-emerald-500 rounded-lg transition-all duration-500"
 style={{ width: `${cat.pctRnp}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </div>

 </div>

 {/* COLUNA DIREITA: SIDEMAP INTEGRADO */}
 <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-full bg-white rounded-xl border border-transparent hover:border-primary-200/50 shadow-card-soft transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
 <SideMap
 mode="ativos"
 processedAtivos={filteredAtivos}
 selectedTerritory={selectedTerritory}
 onSelectTerritory={setSelectedTerritory}
 />
 </div>

 </div>

 </main>
 );
}