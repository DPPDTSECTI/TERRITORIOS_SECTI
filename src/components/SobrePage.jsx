import React from 'react';
import {
 Map as MapIcon, Settings,
 Building2, Target, Eye, Users, Lightbulb, Database, MapPin, Calculator,
 Info, Zap, TrendingUp, GraduationCap, Milestone
} from 'lucide-react';

const SobrePage = () => {

 const SectionTitle = ({ number, title, icon: Icon }) => (
 <div className="flex items-center gap-4 mb-8 pt-10">
 <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary-200 text-text-secondary transition-transform duration-500 hover:rotate-3 cursor-default">
 {Icon ? <Icon size={20} strokeWidth={2.5} /> : <span className="font-semibold text-lg">{number}</span>}
 </div>
 <h3 className="font-semibold uppercase tracking-[0.1em] text-xl text-text-primary">{title}</h3>
 </div>
 );

 return (
 <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative flex flex-col items-center bg-transparent font-sans w-full">
 <div className="animate-soft-fade relative p-6 md:p-10 max-w-5xl w-full z-10 flex flex-col justify-start">

 {/* HEADER DA PÁGINA */}
 <div className="flex flex-col items-start gap-4 mb-12 mt-4">
 <div className="px-4 py-1.5 rounded-full border border-primary-200 bg-surface text-xs font-medium uppercase flex items-center gap-2 text-text-secondary shadow-sm cursor-default hover:shadow-md transition-shadow justify-center leading-none">
 <Info size={16} /> Documentação
 </div>
 <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
 Sobre o <span className="text-primary-700">Painel SECTI</span>
 </h2>
 <p className="text-base lg:text-lg max-w-3xl leading-relaxed mt-2 text-text-secondary font-medium">
 Uma plataforma digital interativa para consolidar, analisar e dar transparência aos principais dados do ecossistema de Ciência, Tecnologia e Inovação nos 27 Territórios de Identidade do estado da Bahia.
 </p>
 <div className="divider-territorial w-48 mt-2"></div>
 </div>

 <div className="space-y-12 pb-20">

 {/* OBJETIVOS */}
 <div>
 <SectionTitle icon={Target} title="Nossos Objetivos" />
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {[
 { t: 'Apoiar a Tomada de Decisão', d: 'Fornecer dados qualificados para planejar e formular políticas públicas.', i: <MapIcon /> },
 { t: 'Promover a Transparência', d: 'Disponibilizar informações sobre investimentos e indicadores de CT&I.', i: <Eye /> },
 { t: 'Fomentar a Articulação', d: 'Sinergias entre governo, setor produtivo, academia e sociedade civil.', i: <Users /> },
 { t: 'Democratizar a Informação', d: 'Fonte de consulta para pesquisadores, estudantes, gestores e investidores.', i: <Lightbulb /> },
 ].map((item, idx) => (
 <div key={idx} className="p-6 bg-surface rounded-xl border border-border shadow-sm hover:shadow-md flex items-start gap-4 transition-shadow duration-200 group cursor-default">
 <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
 {React.cloneElement(item.i, { size: 22, strokeWidth: 2.5 })}
 </div>
 <div>
 <strong className="block text-base font-semibold mb-1 text-text-primary">{item.t}</strong>
 <span className="text-sm font-medium leading-relaxed text-text-secondary">{item.d}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* DEFINIÇÕES */}
 <div>
 <SectionTitle icon={Zap} title="Definições e Indicadores (KPIs)" />
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {[
 { t: 'Capacidade em CT&I', d: 'Infraestruturas mapeadas: Universidades, IFs, ICTs, Parques Tecnológicos e Incubadoras.', i: <Building2 /> },
 { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM), média dos municípios do Território.', i: <TrendingUp /> },
 { t: 'Cursos Superiores', d: 'Capacidade de formação de talentos através de cursos de nível superior.', i: <GraduationCap /> },
 { t: 'APLs e IGs', d: 'Arranjos Produtivos Locais e Indicações Geográficas (certificações de origem).', i: <Milestone /> }
 ].map((item, idx) => (
 <div key={idx} className="p-6 bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 group cursor-default">
 <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center bg-primary-100 text-primary-700">
 {React.cloneElement(item.i, { size: 22, strokeWidth: 2.5 })}
 </div>
 <strong className="block font-semibold mb-1 text-lg text-text-primary tracking-tight">{item.t}</strong>
 <span className="text-sm font-medium leading-relaxed text-text-secondary">{item.d}</span>
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
 <div key={idx} className="relative p-6 bg-surface rounded-xl border border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 group cursor-default">
 <span className="absolute -right-4 -bottom-6 text-[120px] font-medium leading-none opacity-[0.03] text-text-primary select-none pointer-events-none">{item.s}</span>
 <div className="w-12 h-12 mb-5 rounded-xl flex items-center justify-center bg-primary-100 text-primary-700 shadow-xs">
 {React.cloneElement(item.i, { size: 22, strokeWidth: 2.5 })}
 </div>
 <strong className="block text-base font-semibold mb-2 z-10 text-text-primary tracking-tight">{item.t}</strong>
 <span className="text-sm font-medium leading-relaxed z-10 text-text-secondary">{item.d}</span>
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