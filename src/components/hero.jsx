import React from 'react';
import { ArrowUpRight, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function LandingHero() {
  // Hook do React Router para fazer as transições de página sem recarregar o navegador
  const navigate = useNavigate();

  return (
    // min-h-screen garante que a aba inicial ocupe 100% da tela do usuário
    <div className="relative w-full min-h-screen flex flex-col justify-center px-6 lg:px-16 overflow-hidden bg-[#1c1c1c]">
      
      {/* ================= NAVBAR ELEGANTE (FLUTUANTE) ================= */}
      <header className="absolute top-0 left-0 w-full px-6 lg:px-16 py-8 flex items-center justify-between z-50 animate-soft-fade">
        
        {/* Logo Refinada */}
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-1 h-5">
            {/* Barras do logo levemente arredondadas para maior sofisticação */}
            <div className="w-[3px] h-2.5 bg-[#C8A1FC] rounded-full" />
            <div className="w-[3px] h-4 bg-[#9170FA] rounded-full" />
            <div className="w-[3px] h-5 bg-[#593FF7] rounded-full" />
          </div>
          <span className="font-sans font-bold text-lg tracking-[0.2em] text-white uppercase">
            Territórios
          </span>
        </div>

        {/* Links Centrais (Minimalistas) */}
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-12">
          {/* Usamos <Link> do react-router-dom para navegação suave */}
          <Link to="/" className="text-xs font-semibold tracking-widest text-white uppercase relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full transition-all">
            Início
          </Link>
          <button onClick={() => navigate('/territorios')} className="text-xs font-semibold tracking-widest text-white/50 hover:text-white uppercase transition-colors duration-300">
            Dashboard
          </button>
          <Link to="/sobre" className="text-xs font-semibold tracking-widest text-white/50 hover:text-white uppercase transition-colors duration-300">
            Sobre
          </Link>
        </nav>

        {/* Lado Direito: Usuário com Efeito Glassmorphism */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm font-light tracking-wide text-white/70">
            Olá, Gestor
          </span>
          <button className="w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <User size={18} className="text-white/80" />
          </button>
        </div>
      </header>

      {/* A GRANDE CURVA (Vector 6) - Fixa com borda branca sutil */}
      <div className="absolute top-[-10%] right-[-40%] lg:right-[-20%] w-[800px] h-[800px] lg:w-[1200px] lg:h-[1200px] border-[2px] rounded-full pointer-events-none border-white/10" />

      {/* ================= CONTEÚDO DA HERO ================= */}
      <div className="max-w-[800px] relative z-10 animate-soft-fade mt-16">
        
        {/* Subtítulo */}
        <p className="font-mono font-light text-sm sm:text-lg lg:text-xl tracking-[0.4em] uppercase mb-4 text-gray-300">
          Painel Territorial
        </p>

        {/* Título Principal */}
        <h1 className="font-sans font-light text-5xl sm:text-6xl lg:text-[80px] leading-[1.1] mb-6 text-white tracking-tight">
          Ciência, Tecnologia <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9170FA] via-[#C8A1FC] to-[#FFD2FF]">
            & Inovação
          </span>
        </h1>

        {/* Parágrafo Descritivo */}
        <p className="font-mono font-light text-sm sm:text-base lg:text-lg leading-relaxed max-w-[700px] mb-12 text-gray-400">
          Uma plataforma interativa desenvolvida pela SECTI para a visualização das características inerentes à ciência, tecnologia e inovação nos territórios de identidade do Estado da Bahia.
        </p>

        {/* Botão Call to Action */}
        <button 
          onClick={() => navigate('/territorios')}
          className="px-6 lg:px-8 py-3 lg:py-4 rounded bg-gradient-to-r from-[#311f9c] to-[#6c48e8] flex items-center gap-3 hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-purple-900/40 text-white w-fit"
        >
          <span className="font-sans font-medium text-base lg:text-lg tracking-wide">
            Explorar o painel
          </span>
          <ArrowUpRight size={20} strokeWidth={2.5} />
        </button>

      </div>

      {/* ================= RODAPÉ DA HERO ================= */}
      <div className="absolute bottom-8 right-6 lg:bottom-12 lg:right-16 z-20 animate-soft-fade pointer-events-none">
        <img
          src="/img/Brasao-Horizontal_Branco.webp"
          alt="Governo do Estado da Bahia"
          className="h-8 sm:h-10 lg:h-20 object-contain opacity-80"
        />
      </div>

    </div>
  );
}