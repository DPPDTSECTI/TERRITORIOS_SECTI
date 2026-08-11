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

// ================= PÁGINA PRINCIPAL =================
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
    <main className="w-full min-h-screen font-sans relative text-white scroll-smooth bg-[#0a0a0f] overflow-x-clip">
      
      {/* ================= FUNDO FIXO ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-[#3117ea] rounded-full mix-blend-screen filter blur-[150px] lg:blur-[200px] opacity-30"></div>
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-[#9170FA] rounded-full mix-blend-screen filter blur-[120px] lg:blur-[180px] opacity-20"></div>
        <div className="absolute -bottom-[20%] left-[10%] w-[500px] h-[500px] lg:w-[900px] lg:h-[900px] bg-[#FFD2FF] rounded-full mix-blend-screen filter blur-[150px] lg:blur-[250px] opacity-10"></div>
        
        <div className="absolute top-[-5%] right-[-40%] lg:right-[-25%] w-[1200px] h-[1200px] lg:w-[1800px] lg:h-[1800px] border-[2px] rounded-[40%] border-[#9170FA]/10 rotate-[35deg] opacity-60" />
        <div className="absolute top-[15%] right-[-30%] lg:right-[-15%] w-[1300px] h-[1300px] lg:w-[2000px] lg:h-[2000px] border-[1px] rounded-[35%] border-white/5 rotate-[60deg] opacity-40" />
      </div>

      {/* ================= BRASÃO FIXO ================= */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 pointer-events-none opacity-50 mix-blend-screen drop-shadow-lg transition-opacity duration-500">
        <img
          src="/img/Brasao-Horizontal_Branco.webp"
          alt="Governo do Estado da Bahia"
          className="h-6 sm:h-8 lg:h-24 object-contain"
        />
      </div>

      {/* ================= SEÇÃO 1: HERO ================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-between px-6 lg:px-16 pb-20 z-10">
        
        <header className="absolute top-0 left-0 w-full px-6 lg:px-16 py-8 flex items-center justify-between z-50 animate-soft-fade">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5">
              <div className="w-[3px] h-2.5 bg-brand-5 rounded-full" />
              <div className="w-[3px] h-4 bg-brand-3 rounded-full" />
              <div className="w-[3px] h-5 bg-brand-1 rounded-full" />
            </div>
            <span className="font-sans font-extralight text-lg tracking-[0.2em] text-white drop-shadow-md">
              Painel Territorial
            </span>
          </div>

          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-12">
            <Link to="/" className="text-xs font-semibold tracking-widest text-white uppercase relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-brand-3 after:rounded-full transition-all">
              Início
            </Link>
            <button onClick={() => navigate('/territorios')} className="text-xs font-semibold tracking-widest text-white/60 hover:text-white uppercase transition-colors duration-300">
              Dashboard
            </button>
            <a href="#introducao" onClick={scrollToIntro} className="text-xs font-semibold tracking-widest text-white/60 hover:text-white uppercase transition-colors duration-300">
              Sobre
            </a>
            <Link to="/relatorio" className="text-xs font-semibold tracking-widest text-white/60 hover:text-white uppercase transition-colors duration-300">
              Relatório
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm font-light tracking-wide text-white/70">
              Olá, Username
            </span>
            <button className="w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/15 hover:border-brand-3/50 transition-all duration-300 group shadow-lg">
              <User size={18} className="text-white/90 group-hover:text-brand-4 transition-colors" />
            </button>
          </div>
        </header>

        <div className="w-full relative z-10 flex flex-col justify-center mt-32 lg:mt-64 mb-12">
          <div className="max-w-[800px] animate-soft-fade">
            <p className="font-mono font-medium text-sm sm:text-lg lg:text-xl tracking-[0.4em] uppercase mb-4 text-[#FFD2FF]/80 drop-shadow-sm">
              Painel Territorial
            </p>
            <h1 className="font-sans font-light text-5xl sm:text-6xl lg:text-[76px] leading-[1.1] mb-6 text-white tracking-tight drop-shadow-lg">
              Ciência, Tecnologia <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-3 via-brand-4 to-[#FFD2FF] font-normal">
                & Inovação
              </span>
            </h1>
            
            {/* Texto com Efeito de Digitação e Cursor */}
            <p className="font-mono font-light text-sm sm:text-base lg:text-lg leading-relaxed max-w-[700px] mb-10 text-gray-300 min-h-[100px] lg:min-h-[80px]">
              {typedText}
              <span className="inline-block w-1.5 h-4 lg:h-5 ml-1 bg-[#9170FA] animate-pulse align-middle" />
            </p>

            <button 
              onClick={() => navigate('/territorios')}
              className="px-6 lg:px-8 py-3.5 lg:py-4 rounded-xl bg-gradient-to-r from-brand-1 to-brand-3 flex items-center gap-3 hover:shadow-[0_0_30px_rgba(145,112,250,0.5)] hover:scale-[1.02] transition-all duration-300 text-white w-fit border border-white/10 backdrop-blur-md"
            >
              <span className="font-sans font-medium text-base lg:text-lg tracking-wide">
                Explorar o painel
              </span>
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="w-full relative z-30 transform translate-y-3/4">
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 animate-soft-fade">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="p-5 lg:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col justify-center min-h-[110px] lg:min-h-[150px] hover:bg-white/[0.06] hover:-translate-y-1 hover:border-[#9170FA]/40 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <h3 className="text-4xl lg:text-6xl font-light text-white mb-2 flex items-center font-sans tracking-tighter relative z-10 drop-shadow-md">
                  {kpi.prefix && <span className="text-[#FFD2FF] font-light text-2xl lg:text-4xl mr-1">{kpi.prefix}</span>}
                  
                  {/* Utilização do contador animado */}
                  <AnimatedCounter value={kpi.number} duration={2500} />
                  
                </h3>
                <span className="text-[10px] lg:text-[13px] font-mono tracking-[0.15em] text-gray-400 uppercase z-10 group-hover:text-white transition-colors">
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO 2: INTRODUÇÃO ================= */}
      <section id="introducao" ref={introRef} className="w-full relative z-20 px-6 lg:px-16 pt-40 pb-32 flex flex-col items-center min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030305]/90 to-[#000000] z-[-1] pointer-events-none" />

        <div className="max-w-7xl w-full z-10 flex flex-col justify-start">
          
          <div className={`text-center flex flex-col items-center mb-24 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase flex items-center gap-2 bg-white/5 border-white/10 backdrop-blur-md text-[#FFD2FF] mb-6">
              <Info size={14} /> Documentação
            </div>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg max-w-4xl leading-tight">
              O que é o <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9170FA] to-[#FFD2FF]">Painel Territorial</span>?
            </h2>
            <p className="text-lg lg:text-xl max-w-2xl leading-relaxed mt-6 text-gray-300 font-light">
              Uma plataforma digital interativa desenvolvida para consolidar, analisar e dar transparência aos principais dados do ecossistema de inovação nos 27 Territórios de Identidade da Bahia.
            </p>
          </div>

          <div className="space-y-32 pb-20">

            {/* BLOCO 1: Nossos Objetivos */}
            <div className={`flex flex-col lg:flex-row items-start gap-12 lg:gap-20 transition-all duration-1000 delay-200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="lg:w-1/3 lg:sticky lg:top-32 flex flex-col gap-4 self-start">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 text-[#9170FA] shadow-lg mb-2">
                  <Target size={24} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-white">Nossos Objetivos</h3>
                <p className="text-gray-400 leading-relaxed text-lg">
                  Criamos esta plataforma com metas claras para integrar e potencializar o ecossistema baiano.
                </p>
              </div>
              
              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { t: 'Apoiar Decisões', d: 'Dados qualificados para formular políticas públicas.', i: <MapIcon /> },
                  { t: 'Transparência', d: 'Visualização aberta de investimentos e indicadores.', i: <Eye /> },
                  { t: 'Articulação', d: 'Sinergias entre governo, setor produtivo e academia.', i: <Users /> },
                  { t: 'Democratização', d: 'Fonte confiável para pesquisadores e investidores.', i: <Lightbulb /> },
                ].map((item, idx) => (
                  <div key={idx} className="p-8 rounded-3xl flex flex-col gap-4 transition-transform hover:-translate-y-2 duration-300 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg group">
                    <div className="text-[#9170FA] p-3 rounded-xl bg-white/5 w-fit group-hover:bg-[#9170FA] group-hover:text-white transition-colors duration-300">
                      {React.cloneElement(item.i, { size: 28, strokeWidth: 1.5 })}
                    </div>
                    <div>
                      <strong className="block text-xl font-bold mb-2 text-white">{item.t}</strong>
                      <span className="text-sm leading-relaxed text-gray-400">{item.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOCO 2: Definições e KPIs */}
            <div className={`flex flex-col lg:flex-row-reverse items-start gap-12 lg:gap-20 transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="lg:w-1/3 lg:sticky lg:top-32 flex flex-col gap-4 self-start">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 text-[#FFD2FF] shadow-lg mb-2">
                  <Zap size={24} />
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-white">Indicadores Chave</h3>
                <p className="text-gray-400 leading-relaxed text-lg">
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
                  <div key={idx} className="p-8 rounded-3xl transition-all duration-300 bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl hover:bg-white/[0.06] shadow-lg group">
                    <div className="w-12 h-12 mb-6 rounded-xl flex items-center justify-center bg-white/10 border border-white/5 text-white group-hover:scale-110 transition-transform duration-300">
                      {React.cloneElement(item.i, { size: 24 })}
                    </div>
                    <strong className="block font-extrabold mb-2 text-xl text-white">{item.t}</strong>
                    <span className="text-sm leading-relaxed text-gray-400">{item.d}</span>
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