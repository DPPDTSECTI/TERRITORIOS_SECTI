import React, { useState, useMemo, useContext } from 'react';
import { 
  Map as MapIcon, Settings, Sun, Download, ExternalLink, ChevronDown, ChevronUp, 
  BookOpen, Building2, Target, Eye, Users, Lightbulb, Database, MapPin, Calculator, 
  Info, Zap, TrendingUp, GraduationCap, Milestone
} from 'lucide-react';
import DataContext from '../context/DataContext';
import { resolveCadeiaFonte } from '../utils/cadeiasUtils';
// Sidebar REMOVIDO daqui!

const SobrePage = ({ darkMode = true }) => {
  const [showAllIgs, setShowAllIgs] = useState(false);
  const [showAllIncubadoras, setShowAllIncubadoras] = useState(false);
  const context = useContext(DataContext) || {};
  const { carregarTodosDetalhes } = context;
  const territoriosData = context.territoriosData || [];

  React.useEffect(() => {
    if (carregarTodosDetalhes) carregarTodosDetalhes();
  }, [carregarTodosDetalhes]);

  const igPotenciais = useMemo(() => {
    const allCadeias = territoriosData.flatMap(t => t.cadeiasProdutivasDetalhado || []);
    const uniqueArticles = new Map();
    allCadeias.forEach(cad => {
      if ((cad.tipo || '').toLowerCase() !== 'ig potencial') return;
      const fonteInfo = resolveCadeiaFonte(cad);
      const isGeneric = ['mapa interativo', 'observatório apl', 'observatorioapl', 'datasebrae', 'gov.br/empresas'].some(term => (fonteInfo.label || '').toLowerCase().includes(term));
      const linkCorreto = cad.urlTarget || fonteInfo.url;
      if (linkCorreto && !isGeneric && (fonteInfo.label || '').length > 20) {
        if (!uniqueArticles.has(linkCorreto)) uniqueArticles.set(linkCorreto, { txt: fonteInfo.label, link: linkCorreto });
      }
    });
    return Array.from(uniqueArticles.values()).sort((a, b) => a.txt.localeCompare(b.txt, 'pt'));
  }, [territoriosData]);

  const incubadorasAceleradorasList = useMemo(() => {
    const allCapacidade = territoriosData.flatMap(t => t.capacidadeDetalhada || []);
    const uniqueMap = new Map();
    allCapacidade.forEach(item => {
      const cat = (item.categoria || '').toLowerCase();
      const tipo = (item.tipo || '').toLowerCase();
      const entidadeNome = item.entidade ? String(item.entidade).trim() : '';
      if (cat.includes('incubadora') || cat.includes('aceleradora') || tipo.includes('incubadora') || tipo.includes('aceleradora') || cat === 'aceleradoras' || cat === 'incubadoras') {
        const rawLink = item.site || item.fonte || '';
        if (entidadeNome && rawLink && rawLink !== '#' && rawLink !== '' && !uniqueMap.has(entidadeNome)) {
          uniqueMap.set(entidadeNome, { nome: entidadeNome, link: rawLink.startsWith('http') ? rawLink : `https://${rawLink}`, municipio: item.municipio || '' });
        }
      }
    });
    let extracted = Array.from(uniqueMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (extracted.length === 0) {
      extracted = [
        { nome: "Áity Incubadora", link: "https://inovacao.uneb.br/", municipio: "Salvador" },
        { nome: "CIMATEC Park", link: "https://senaicimatec.com.br/", municipio: "Camaçari" },
        { nome: "SENAI CIMATEC", link: "https://senaicimatec.com.br/", municipio: "Salvador" }
      ];
    }
    return extracted;
  }, [territoriosData]);

  const mainReferences = [
    { categoria: 'Mapa Cartográfico e Divisão do Semiárido Brasileiro', fontes: [{ nome: 'SECULT-BA', info: 'Divisão Territorial', link: 'https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia' }, { nome: 'IBGE', info: 'Semiárido Brasileiro', link: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html' }] },
    { categoria: 'Indicador de Desenvolvimento Territorial', fontes: [{ nome: 'IFDM', info: 'Índice FIRJAN', link: 'https://www.firjan.com.br/ifdm/' }] },
    { categoria: 'Estruturas de CT&I', fontes: [{ nome: 'INEP', info: 'Censo Educação Superior', link: 'https://www.gov.br/inep/pt-br/' }] },
    { categoria: 'Cadeias Produtivas', fontes: [{ nome: 'DataSebrae', info: 'IGs', link: 'https://datasebrae.com.br/' }] }
  ];

  const SectionTitle = ({ number, title, icon: Icon }) => (
    <div className="flex items-center gap-4 mb-8 pt-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-[#3117ea]/20 text-[#9170FA]' : 'bg-blue-100 text-blue-600'}`}>
        {Icon ? <Icon size={20} /> : <span className="font-black text-lg">{number}</span>}
      </div>
      <h3 className={`font-black uppercase tracking-[0.1em] text-xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    </div>
  );

  return (
    // Agora retornamos apenas o <main>, sem envolver com Sidebar lateral
    <main className={`flex-1 h-screen overflow-y-auto overflow-x-hidden relative flex flex-col items-center ${darkMode ? 'bg-[#18181b]' : 'bg-slate-50'} font-sans w-full`}>
      <div className="animate-soft-fade relative p-6 md:p-10 max-w-5xl w-full z-10 flex flex-col justify-start">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col items-start gap-4 mb-12 mt-4">
          <div className={`px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
            <Info size={14} /> Documentação
          </div>
          <h2 className={`text-4xl lg:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Sobre o <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9170FA] to-[#FFD2FF]">Painel SECTI</span>
          </h2>
          <p className={`text-base lg:text-lg max-w-3xl leading-relaxed mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            Uma plataforma digital interativa para consolidar, analisar e dar transparência aos principais dados do ecossistema de Ciência, Tecnologia e Inovação nos 27 Territórios de Identidade do estado da Bahia.
          </p>
        </div>

        <div className="space-y-12 pb-20">

          {/* OBJETIVOS */}
          <div>
            <SectionTitle icon={Target} title="Nossos Objetivos" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { t: 'Apoiar a Tomada de Decisão', d: 'Fornecer dados qualificados para planejar e formular políticas públicas.', i: <MapIcon /> },
                { t: 'Promover a Transparência', d: 'Disponibilizar informações sobre investimentos e indicadores de CT&I.', i: <Eye /> },
                { t: 'Fomentar a Articulação', d: 'Sinergias entre governo, setor produtivo, academia e sociedade civil.', i: <Users /> },
                { t: 'Democratizar a Informação', d: 'Fonte de consulta para pesquisadores, estudantes, gestores e investidores.', i: <Lightbulb /> },
              ].map((item, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border flex gap-4 transition-transform hover:-translate-y-1 duration-300 ${darkMode ? 'bg-[#232326] border-[#2A2A2E]' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className={`mt-1 shrink-0 ${darkMode ? 'text-[#9170FA]' : 'text-blue-600'}`}>{React.cloneElement(item.i, { size: 24, strokeWidth: 1.5 })}</div>
                  <div>
                    <strong className={`block text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</strong>
                    <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DEFINIÇÕES */}
          <div>
            <SectionTitle icon={Zap} title="Definições e Indicadores (KPIs)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { t: 'Capacidade em CT&I', d: 'Infraestruturas mapeadas: Universidades, IFs, ICTs, Parques Tecnológicos e Incubadoras.', i: <Building2 /> },
                { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM), média dos municípios do Território.', i: <TrendingUp /> },
                { t: 'Cursos Superiores', d: 'Capacidade de formação de talentos através de cursos de nível superior.', i: <GraduationCap /> },
                { t: 'APLs e IGs', d: 'Arranjos Produtivos Locais e Indicações Geográficas (certificações de origem).', i: <Milestone /> }
              ].map((item, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-[#232326] border-[#2A2A2E] hover:bg-[#2A2A2E]' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                  <div className={`w-10 h-10 mb-4 rounded-lg flex items-center justify-center ${darkMode ? 'bg-[#313136] text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {React.cloneElement(item.i, { size: 20 })}
                  </div>
                  <strong className={`block font-extrabold mb-2 text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</strong>
                  <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* METODOLOGIA */}
          <div>
            <SectionTitle icon={Settings} title="Metodologia e Tratamento" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { s: '01', t: 'Limpeza', d: 'Dados brutos são tratados e padronizados para garantir consistência.', i: <Database /> },
                { s: '02', t: 'Georreferenciamento', d: 'Vinculação espacial aos municípios e Territórios.', i: <MapPin /> },
                { s: '03', t: 'Indicadores', d: 'Geração de índices processados considerando o contexto geográfico.', i: <Calculator /> },
              ].map((item, idx) => (
                <div key={idx} className={`relative p-6 rounded-2xl border overflow-hidden flex flex-col ${darkMode ? 'bg-[#232326] border-[#2A2A2E]' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <span className={`absolute -right-4 -bottom-6 text-[120px] font-black leading-none opacity-5 select-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.s}</span>
                  <div className={`w-12 h-12 mb-5 rounded-full flex items-center justify-center border shadow-sm ${darkMode ? 'bg-[#3117ea]/20 border-[#3117ea]/50 text-[#9170FA]' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                    {React.cloneElement(item.i, { size: 22 })}
                  </div>
                  <strong className={`block text-lg font-bold mb-3 z-10 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</strong>
                  <span className={`text-sm leading-relaxed z-10 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.d}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default SobrePage;