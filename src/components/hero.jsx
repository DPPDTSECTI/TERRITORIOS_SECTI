import React from 'react';

const LandingHero = ({ onAccessDashboard }) => {
    return (
        // O fundo base agora é um cinza ultra claro (slate-50)
        <div className="relative w-full h-full min-h-[calc(100vh-4rem)] bg-slate-50 font-sans flex flex-col justify-between overflow-hidden">

            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gov-blueDark-500/20 blur-[120px] pointer-events-none z-0"></div>

            <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gov-cyan-500/25 blur-[120px] pointer-events-none z-0"></div>

            <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-gov-magenta-500/10 blur-[100px] pointer-events-none z-0"></div>


            {/* Conteúdo Principal */}
            <main className="flex-1 flex flex-col justify-center items-start max-w-4xl z-10 my-auto px-8 sm:px-12 lg:px-16">
                
                {/* Título com as cores oficiais e a fonte tecnológica (Righteous) */}
                <h2 className="text-xl sm:text-2xl tracking-wide uppercase font-display mb-2">
                    <span className="text-gov-blueDark-500">Painel </span>
                    <span className="text-gov-red-500">Territorial</span>
                </h2>
                
                {/* Título principal limpo e imponente usando a Roboto Flex (font-sans) */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-[1.15]">                    
                    Ciência, Tecnologia e <br />
                    Inovação
                </h1>

                {/* Descrição oficial mais fina e elegante (font-light) */}
                <p className="text-base sm:text-lg text-slate-600 font-light max-w-2xl mb-10 leading-relaxed">
                    Uma plataforma interativa desenvolvida pela SECTI para a visualização das 
                    características inerentes à ciência, tecnologia e inovação nos territórios de 
                    identidade do Estado da Bahia.
                </p>

                {/* Ações / Botões com tipografia mais robusta */}
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={onAccessDashboard}
                        className="w-full sm:w-auto px-12 py-4 rounded-xl bg-gov-blueDark-500 hover:bg-gov-blueDark-700 text-white font-black tracking-wider uppercase text-sm sm:text-base transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center"
                    >
                        Acessar
                    </button>

                    <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/60 hover:bg-white text-slate-700 font-bold text-base transition-all flex items-center justify-center shadow-sm border border-slate-200 backdrop-blur-sm">
                        Baixar relatório
                    </button>
                </div>
            </main>

            {/* Logo Institucional */}
            <div className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 max-w-[180px] sm:max-w-[240px] z-20">
                <img 
                    src="/img/Secti_Vertical-removebg-preview.png" 
                    alt="Governo do Estado da Bahia - Secretaria de Ciência, Tecnologia e Inovação" 
                    className="w-full h-auto object-contain object-right-bottom drop-shadow-md"
                />
            </div>
        </div>
    );
};

export default LandingHero;
