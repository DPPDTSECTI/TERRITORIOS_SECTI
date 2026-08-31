import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowUpRight, User, Map as MapIcon, Target, Eye, Users, Lightbulb, 
  Info, Zap, TrendingUp, GraduationCap, Milestone, Building2 
} from 'lucide-react';

// ================= COMPONENTE DE ANIMAÇÃO DOS NÚMEROS =================
const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const target = parseInt(value, 10);
    
    // Fallback caso o valor não seja um número
    if (isNaN(target)) {
      setCount(value);
      return;
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Curva de desaceleração suave (easeOutQuart)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target); // Garante que termine exatamente no alvo
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count}</>;
};

// ================= PÁGINA PRINCIPAL (HERO CLARO ALINHADO AO DASHBOARD) =================
export default function LandingHero() {
  const navigate = useNavigate();
  
  // Controle de Animação ao rolar a página
  const introRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Controle do Efeito de Digitação
  const subtitleText = "Uma plataforma interativa desenvolvida pela SECTI para a visualização das características inerentes à ciência, tecnologia e inovação nos territórios de identidade do Estado da Bahia.";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < subtitleText.length) {
        setTypedText(subtitleText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 25); // Velocidade da digitação (25ms por letra)

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.10 });

    if (introRef.current) observer.observe(introRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToIntro = (e) => {
    e.preventDefault();
    document.getElementById('introducao')?.scrollIntoView({ behavior: 'smooth' });
  };

  const kpis = [
    { prefix: '+', number: '200', label: 'Ativos de CT&I' },
    { prefix: '+', number: '600', label: 'Cursos Superiores' },
    { prefix: '+', number: '50', label: 'Cadeias Produtivas' },
    { prefix: '', number: '27', label: 'Territórios' },
  ];

  return (
    <main className="w-full min-h-screen font-sans relative text-[#1D3557] scroll-smooth bg-gradient-to-b from-[#FFFFFF] via-[#F0F7FD] to-[#E2E8F0] overflow-x-clip">
      
      {/* ================= FUNDO FIXO COM DEGRADÊ SUAVE E AURA AZUL SECTI ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-[#D6EAF8]/80 rounded-full mix-blend-multiply filter blur-[120px] lg:blur-[180px] opacity-70"></div>
        <div className="absolute top-[25%] right-[-10%] w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-[#A8DADC]/50 rounded-full mix-blend-multiply filter blur-[100px] lg:blur-[160px] opacity-60"></div>
        <div className="absolute -bottom-[20%] left-[15%] w-[500px] h-[500px] lg:w-[900px] lg:h-[900px] bg-[#BFDBFE]/40 rounded-full mix-blend-multiply filter blur-[140px] lg:blur-[200px] opacity-50"></div>
        
        {/* Linhas orbitais arquitetônicas sutis */}
        <div className="absolute top-[-5%] right-[-40%] lg:right-[-25%] w-[1200px] h-[1200px] lg:w-[1800px] lg:h-[1800px] border-[1.5px] rounded-[40%] border-[#457B9D]/10 rotate-[35deg]" />
        <div className="absolute top-[15%] right-[-30%] lg:right-[-15%] w-[1300px] h-[1300px] lg:w-[2000px] lg:h-[2000px] border-[1px] rounded-[35%] border-[#2563EB]/5 rotate-[60deg]" />
      </div>

      {/* ================= BRASÃO FIXO ================= */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 pointer-events-none opacity-100 drop-shadow-md transition-opacity duration-500">
        <img
          src="/img/brasao_preto.webp"
          alt="Governo do Estado da Bahia"
          className="h-6 sm:h-8 lg:h-20 object-contain invert brightness-0 opacity-70"
        />
      </div>

      {/* ================= SEÇÃO 1: HERO ================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-between px-6 lg:px-16 pb-20 z-10">
        
        {/* HEADER SUPERIOR */}
        <header className="absolute top-0 left-0 w-full px-6 lg:px-16 py-8 flex items-center justify-between z-50 animate-soft-fade">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5">
              <div className="w-[3px] h-2.5 bg-[#A8DADC] rounded-full" />
              <div className="w-[3px] h-4 bg-[#2563EB] rounded-full" />
              <div className="w-[3px] h-5 bg-[#1D3557] rounded-full" />
            </div>
            <span className="font-sans font-light text-lg tracking-[0.2em] text-[#1D3557]">
              Painel Territorial
            </span>
          </div>

          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 transform-gpu items-center gap-12 bg-white/70 backdrop-blur-md px-8 py-3 rounded-full border border-[#D6EAF8] shadow-[0_4px_20px_rgba(29,53,87,0.04)]">
            <Link to="/" className="text-xs font-bold tracking-widest text-[#1D3557] uppercase relative after:content-[''] after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:transform-gpu after:w-1.5 after:h-1.5 after:bg-[#2563EB] after:rounded-full transition-all">
              Início
            </Link>
            <button onClick={() => navigate('/territorios')} className="text-xs font-semibold tracking-widest text-[#457B9D] hover:text-[#1D3557] uppercase transition-colors duration-300 cursor-pointer">
              Dashboard
            </button>
            <a href="#introducao" onClick={scrollToIntro} className="text-xs font-semibold tracking-widest text-[#457B9D] hover:text-[#1D3557] uppercase transition-colors duration-300">
              Sobre
            </a>
            <Link to="/relatorio" className="text-xs font-semibold tracking-widest text-[#457B9D] hover:text-[#1D3557] uppercase transition-colors duration-300">
              Relatório
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm font-semibold tracking-wide text-[#457B9D]">
              SECTI Bahia
            </span>
            <button className="w-10 h-10 rounded-full border border-[#D6EAF8] bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white hover:border-[#2563EB] transition-all duration-300 group shadow-sm">
              <User size={18} className="text-[#457B9D] group-hover:text-[#1D3557] transition-colors" />
            </button>
          </div>
        </header>

        {/* HERO TITLE & CALL TO ACTION */}
        <div className="w-full relative z-10 flex flex-col justify-center mt-32 lg:mt-60 mb-12">
          <div className="max-w-[820px] animate-soft-fade">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#D6EAF8] text-xs font-extrabold uppercase tracking-widest text-[#2563EB] mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
              Plataforma de Inteligência Territorial
            </div>

            <h1 className="font-sans font-black text-5xl sm:text-6xl lg:text-[76px] leading-[1.08] mb-6 text-[#1D3557] tracking-tight">
              Ciência, Tecnologia <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1D3557] via-[#2563EB] to-[#0284C7]">
                & Inovação
              </span>
            </h1>
            
            {/* Texto com Efeito de Digitação */}
            <p className="font-sans font-medium text-base sm:text-lg lg:text-xl leading-relaxed max-w-[700px] mb-10 text-[#457B9D] min-h-[100px] lg:min-h-[80px]">
              {typedText}
              <span className="inline-block w-1.5 h-4 lg:h-5 ml-1 bg-[#2563EB] animate-pulse align-middle" />
            </p>

            <button 
              onClick={() => navigate('/territorios')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1D3557] via-[#1E40AF] to-[#2563EB] flex items-center gap-3 shadow-[0_8px_28px_rgba(29,53,87,0.22)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-white w-fit cursor-pointer group"
            >
              <span className="font-sans font-bold text-base lg:text-lg tracking-wide">
                Explorar o Painel
              </span>
              <ArrowUpRight size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform transform-gpu" />
            </button>
          </div>
        </div>

        {/* CARDS DE INDICADORES (KPIS) EM VIDRO BRANCO */}
        <div className="w-full relative z-30 transform translate-y-3/4">
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 animate-soft-fade">
            {kpis.map((kpi, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-[24px] bg-white/90 border border-[#D6EAF8] backdrop-blur-2xl shadow-[0_4px_24px_rgba(29,53,87,0.06)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.12)] flex flex-col justify-center min-h-[120px] lg:min-h-[150px] hover:bg-white hover:-translate-y-1 hover:border-[#2563EB]/40 transition-all duration-300 group cursor-default transform-gpu"
              >
                <h3 className="text-4xl lg:text-6xl font-black text-[#1D3557] mb-1 flex items-center font-sans tracking-tight">
                  {kpi.prefix && <span className="text-[#2563EB] font-bold text-2xl lg:text-4xl mr-1">{kpi.prefix}</span>}
                  <AnimatedCounter value={kpi.number} duration={2500} />
                </h3>
                <span className="text-[11px] lg:text-[13px] font-bold tracking-[0.1em] text-[#457B9D] uppercase">
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO 2: INTRODUÇÃO ================= */}
      <section id="introducao" ref={introRef} className="w-full relative z-20 px-6 lg:px-16 pt-44 pb-32 flex flex-col items-center min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-[#F0F7FD] z-[-1] pointer-events-none" />

        <div className="max-w-7xl w-full z-10 flex flex-col justify-start">
          
          <div className={`text-center flex flex-col items-center mb-24 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="px-4 py-1.5 rounded-full border border-[#D6EAF8] text-xs font-extrabold tracking-widest uppercase flex items-center gap-2 bg-white text-[#457B9D] shadow-sm mb-6">
              <Info size={14} className="text-[#2563EB]" /> Documentação
            </div>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-[#1D3557] max-w-4xl leading-tight">
              O que é o <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1D3557] via-[#2563EB] to-[#0284C7]">Painel Territorial</span>?
            </h2>
            <p className="text-lg lg:text-xl max-w-2xl leading-relaxed mt-6 text-[#457B9D] font-medium">
              Uma plataforma digital interativa desenvolvida para consolidar, analisar e dar transparência aos principais dados do ecossistema de inovação nos 27 Territórios de Identidade da Bahia.
            </p>
          </div>

          <div className="space-y-32 pb-20">

            {/* BLOCO 1: Nossos Objetivos */}
            <div className={`flex flex-col lg:flex-row items-start gap-12 lg:gap-20 transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="lg:w-1/3 lg:sticky lg:top-32 flex flex-col gap-4 self-start">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#D6EAF8] text-[#2563EB] shadow-sm mb-2">
                  <Target size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-[#1D3557]">Nossos Objetivos</h3>
                <p className="text-[#457B9D] leading-relaxed text-base lg:text-lg font-medium">
                  Criamos esta plataforma com metas claras para integrar e potencializar o ecossistema baiano.
                </p>
              </div>
              
              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { t: 'Apoiar Decisões', d: 'Dados qualificados para formular e calibrar políticas públicas regionais.', i: <MapIcon /> },
                  { t: 'Transparência', d: 'Visualização aberta de investimentos, cadeias produtivas e indicadores.', i: <Eye /> },
                  { t: 'Articulação', d: 'Sinergias entre governo, setor produtivo, academia e sociedade civil.', i: <Users /> },
                  { t: 'Democratização', d: 'Fonte confiável para pesquisadores, gestores públicos e investidores.', i: <Lightbulb /> },
                ].map((item, idx) => (
                  <div key={idx} className="p-8 rounded-[28px] flex flex-col gap-4 transition-all hover:-translate-y-1.5 duration-300 bg-white border border-[#D6EAF8] shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] hover:border-[#2563EB]/40 group cursor-default transform-gpu">
                    <div className="text-[#2563EB] p-3 rounded-2xl bg-[#D6EAF8] w-fit group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                      {React.cloneElement(item.i, { size: 26, strokeWidth: 2.2 })}
                    </div>
                    <div>
                      <strong className="block text-xl font-extrabold mb-2 text-[#1D3557]">{item.t}</strong>
                      <span className="text-sm leading-relaxed text-[#457B9D] font-medium">{item.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOCO 2: Definições e KPIs */}
            <div className={`flex flex-col lg:flex-row-reverse items-start gap-12 lg:gap-20 transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="lg:w-1/3 lg:sticky lg:top-32 flex flex-col gap-4 self-start">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#D6EAF8] text-[#2563EB] shadow-sm mb-2">
                  <Zap size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-[#1D3557]">Indicadores Chave</h3>
                <p className="text-[#457B9D] leading-relaxed text-base lg:text-lg font-medium">
                  Nossas métricas mapeiam as estruturas fundamentais que impulsionam o desenvolvimento regional.
                </p>
              </div>
              
              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { t: 'Capacidade em CT&I', d: 'Universidades, IFs, ICTs, Parques Tecnológicos e Incubadoras.', i: <Building2 /> },
                  { t: 'Desenvolvimento', d: 'Índice FIRJAN (IFDM), média sócio-econômica dos municípios.', i: <TrendingUp /> },
                  { t: 'Cursos Superiores', d: 'Capacidade local de formação de novos talentos e pesquisadores.', i: <GraduationCap /> },
                  { t: 'APLs e IGs', d: 'Arranjos Produtivos e certificações de Indicações Geográficas.', i: <Milestone /> }
                ].map((item, idx) => (
                  <div key={idx} className="p-8 rounded-[28px] transition-all duration-300 bg-white border border-[#D6EAF8] shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] hover:border-[#2563EB]/40 hover:-translate-y-1.5 group cursor-default transform-gpu">
                    <div className="w-12 h-12 mb-6 rounded-2xl flex items-center justify-center bg-[#D6EAF8] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                      {React.cloneElement(item.i, { size: 24, strokeWidth: 2.2 })}
                    </div>
                    <strong className="block font-extrabold mb-2 text-xl text-[#1D3557]">{item.t}</strong>
                    <span className="text-sm leading-relaxed text-[#457B9D] font-medium">{item.d}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}