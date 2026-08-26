import React from 'react';
import {
  Map as MapIcon, Settings,
  Building2, Target, Eye, Users, Lightbulb, Database, MapPin, Calculator,
  Info, Zap, TrendingUp, GraduationCap, Milestone
} from 'lucide-react';

const SobrePage = () => {

  const SectionTitle = ({ number, title, icon: Icon }) => (
    <div className="flex items-center gap-4 mb-8 pt-10">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-[#D6EAF8] text-[#457B9D] transition-transform duration-500 hover:scale-110 hover:rotate-3 cursor-default">
        {Icon ? <Icon size={20} strokeWidth={2.5} /> : <span className="font-black text-lg">{number}</span>}
      </div>
      <h3 className="font-black uppercase tracking-[0.1em] text-xl text-[#1D3557]">{title}</h3>
    </div>
  );

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative flex flex-col items-center bg-transparent font-sans w-full">
      <div className="animate-soft-fade relative p-6 md:p-10 max-w-5xl w-full z-10 flex flex-col justify-start">

        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col items-start gap-4 mb-12 mt-4">
          <div className="px-4 py-1.5 rounded-full border border-[#D6EAF8] bg-white text-xs font-bold tracking-widest uppercase flex items-center gap-2 text-[#457B9D] shadow-sm cursor-default hover:shadow-md transition-shadow">
            <Info size={14} /> Documentação
          </div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-[#1D3557]">
            Sobre o <span className="text-[#457B9D]">Painel SECTI</span>
          </h2>
          <p className="text-base lg:text-lg max-w-3xl leading-relaxed mt-2 text-[#457B9D]/80 font-medium">
            Uma plataforma digital interativa para consolidar, analisar e dar transparência aos principais dados do ecossistema de Ciência, Tecnologia e Inovação nos 27 Territórios de Identidade do estado da Bahia.
          </p>
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
                <div key={idx} className="p-6 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] flex items-start gap-4 transition-all hover:-translate-y-2 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group cursor-default">
                  <div className="w-12 h-12 rounded-2xl bg-[#D6EAF8] text-[#457B9D] flex items-center justify-center shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-3">
                    {React.cloneElement(item.i, { size: 22, strokeWidth: 2.5 })}
                  </div>
                  <div>
                    <strong className="block text-lg font-bold mb-1 text-[#1D3557]">{item.t}</strong>
                    <span className="text-sm font-medium leading-relaxed text-[#457B9D]/80">{item.d}</span>
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
                <div key={idx} className="p-6 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all hover:-translate-y-2 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group cursor-default">
                  <div className="w-12 h-12 mb-4 rounded-2xl flex items-center justify-center bg-[#D6EAF8] text-[#457B9D] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-3">
                    {React.cloneElement(item.i, { size: 22, strokeWidth: 2.5 })}
                  </div>
                  <strong className="block font-extrabold mb-1 text-lg text-[#1D3557] tracking-tight">{item.t}</strong>
                  <span className="text-sm font-medium leading-relaxed text-[#457B9D]/80">{item.d}</span>
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
                <div key={idx} className="relative p-6 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 overflow-hidden flex flex-col shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all hover:-translate-y-2 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group cursor-default">
                  <span className="absolute -right-4 -bottom-6 text-[120px] font-black leading-none opacity-[0.03] text-[#1D3557] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">{item.s}</span>
                  <div className="w-12 h-12 mb-5 rounded-2xl flex items-center justify-center bg-[#D6EAF8] text-[#457B9D] shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-3">
                    {React.cloneElement(item.i, { size: 22, strokeWidth: 2.5 })}
                  </div>
                  <strong className="block text-lg font-bold mb-2 z-10 text-[#1D3557] tracking-tight">{item.t}</strong>
                  <span className="text-sm font-medium leading-relaxed z-10 text-[#457B9D]/80">{item.d}</span>
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