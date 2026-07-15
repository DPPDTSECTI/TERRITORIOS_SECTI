import React, { useState, useEffect } from 'react';
import ExcelExportButton from './ExcelExportButton';

const LandingHero = ({ onAccessDashboard, territoriosData, darkMode }) => {
    const images = [
        { src: "/img/hero/55177617481_a2f52dd9f0_o.jpg", credit: "Amanda Ercília/GOVBA" },
        { src: "/img/hero/55193881827_608169f0ec_o.jpg", credit: "Amanda Ercília/GOVBA" },
        { src: "/img/hero/55280502368_f86e6bea57_o.jpg", credit: "Thuane Maria/GOVBA" },
        { src: "/img/hero/55284715576_5c6c560a5c_o.jpg", credit: "Feijão Almeida/GOVBA" },
        { src: "/img/hero/55287787257_7b4ae60fbf_o.jpg", credit: "Feijão Almeida/GOVBA" },
        { src: "/img/hero/54208024118_e48b529bdd_o.jpg", credit: "Feijão Almeida/GOVBA" },
        { src: "/img/hero/54400089577_6b2f2c3fce_o.jpg", credit: "Feijão Almeida/GOVBA" },
        { src: "/img/hero/54446840370_c6fa9c1d3c_o.jpg", credit: "Matheus Landim/GOVBA" },
        { src: "/img/hero/54492136003_c06ca3e046_o.jpg", credit: "Thuane Maria/GOVBA" },
        { src: "/img/hero/54718163457_5a44dc81e3_o.jpg", credit: "Amanda Ercília/GOVBA" },
        { src: "/img/hero/54893586223_d842cb4664_o.jpg", credit: "Matheus Landim/GOVBA" }
    ];

    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className="relative w-full h-[90vh] font-sans flex flex-col lg:flex-row overflow-hidden touch-none pt-20 lg:pt-28 pb-6 bg-transparent">
            
            {/* CSS Animado para o Título */}
            <style>{`
                @keyframes textShimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-text-gradient {
                    background-size: 200% auto;
                    animation: textShimmer 4s ease-in-out infinite;
                }
            `}</style>

            {/* COLUNA ESQUERDA: Conteúdo Principal */}
            <main className="relative z-30 w-full lg:w-[55%] h-full flex flex-col justify-center items-start px-8 sm:px-12 lg:pl-24 lg:pr-8 py-4 lg:py-0">
                
                <h2 className="text-lg sm:text-xl tracking-widest uppercase font-black mb-3 drop-shadow-sm flex gap-2">
                    <span className={darkMode ? 'text-white' : 'text-white'}>Painel</span>
                    <span className={darkMode ? 'text-white' : 'text-white'}>Territorial</span>
                </h2>
                
                <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] font-black tracking-tighter mb-6 leading-[1.05] drop-shadow-sm bg-clip-text text-transparent animate-text-gradient ${
                    darkMode 
                        ? 'bg-gradient-to-r from-[#F26B5E] via-[#7FB77E] to-[#5B8FD9]'
                        : 'bg-gradient-to-r from-[#D62828] via-[#2E7D4F] to-[#1B4F9C]'
                }`}>
                    Ciência, Tecnologia <br /> e Inovação
                </h1>

                <p className={`text-sm sm:text-base font-medium max-w-lg mb-10 leading-relaxed antialiased ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Uma plataforma interativa desenvolvida pela SECTI para a visualização das 
                    características inerentes à ciência, tecnologia e inovação nos territórios de 
                    identidade do Estado da Bahia.
                </p>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <button
                        onClick={onAccessDashboard}
                        className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black tracking-wider uppercase text-xs sm:text-sm transition-all duration-300 transform-gpu hover:-translate-y-1 ${
                            darkMode 
                                ? 'bg-[#1B4F9C] hover:bg-[#5B8FD9] text-white shadow-[0_0_20px_rgba(27,79,156,0.4)] hover:shadow-[0_0_30px_rgba(91,143,217,0.6)]'
                                : 'bg-[#1B4F9C] hover:bg-[#0A2E5C] text-white shadow-xl hover:shadow-2xl'
                        }`}
                    >
                        Acessar o Painel
                    </button>

                    <ExcelExportButton 
                        territoriosData={territoriosData} 
                        variant={darkMode ? 'solid' : 'outline'} 
                        className="w-full sm:w-auto" 
                    />
                </div>

                <div className="flex gap-2.5 mt-12">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImage(index)}
                            aria-label={`Ir para a imagem ${index + 1}`}
                            className={`h-1.5 transition-all duration-500 rounded-full ${
                                index === currentImage 
                                    ? (darkMode ? 'w-10 bg-[#5B8FD9] shadow-[0_0_10px_rgba(91,143,217,0.8)]' : 'w-10 bg-[#1B4F9C] shadow-md')
                                    : (darkMode ? 'w-2.5 bg-slate-700 hover:bg-slate-500' : 'w-2.5 bg-slate-300 hover:bg-slate-400')
                            }`}
                        />
                    ))}
                </div>
            </main>

            {/* COLUNA DIREITA: Carrossel Vertical */}
            <aside className="relative z-10 hidden md:flex w-full lg:w-[45%] h-full items-center justify-center pr-8 lg:pr-24 perspective-1000">
                <div className="relative w-full max-w-sm xl:max-w-md h-full max-h-[70vh] aspect-[4/5] flex items-center justify-center">
                    {images.map((img, index) => {
                        const prevIndex = (currentImage - 1 + images.length) % images.length;
                        const nextIndex = (currentImage + 1) % images.length;
                        
                        let positionClasses = '';
                        const activeBorder = darkMode ? 'border-slate-800' : 'border-white';
                        const inactiveBorder = darkMode ? 'border-slate-800/50' : 'border-white/50';
                        
                        if (index === currentImage) {
                            positionClasses = `translate-x-0 scale-100 opacity-100 z-30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[3px] ${activeBorder} cursor-default`;
                        } else if (index === prevIndex) {
                            positionClasses = `-translate-x-[25%] xl:-translate-x-[30%] scale-90 opacity-20 z-20 border-[1px] ${inactiveBorder} cursor-pointer hover:opacity-50 hover:-translate-x-[28%]`;
                        } else if (index === nextIndex) {
                            positionClasses = `translate-x-[25%] xl:translate-x-[30%] scale-90 opacity-20 z-20 border-[1px] ${inactiveBorder} cursor-pointer hover:opacity-50 hover:translate-x-[28%]`;
                        } else {
                            positionClasses = 'translate-x-0 scale-75 opacity-0 z-10 pointer-events-none';
                        }

                        return (
                            <div
                                key={index}
                                /* A CORREÇÃO ESTÁ AQUI: bg-white ou bg-slate-800 impede o vazamento de sub-pixel da sombra */
                                className={`absolute w-full h-full transition-all duration-[900ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-center rounded-[1rem] overflow-hidden transform-gpu will-change-transform backface-hidden antialiased ${darkMode ? 'bg-slate-800' : 'bg-white'} ${positionClasses}`}
                                style={{ WebkitBackfaceVisibility: 'hidden' }}
                                onClick={() => {
                                    if (index === prevIndex) setCurrentImage(prevIndex);
                                    if (index === nextIndex) setCurrentImage(nextIndex);
                                }}
                            >
                                <img 
                                    src={img.src} 
                                    alt={`Paisagem da Bahia ${index + 1}`} 
                                    className="w-full h-full object-cover transform-gpu antialiased"
                                    style={{ imageRendering: 'high-quality' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                {img.credit && (
                                    <p className="absolute bottom-4 right-4 z-40 text-white text-[10px] font-light bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md opacity-60 hover:opacity-100 transition-opacity">
                                        Foto: {img.credit}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
};

export default LandingHero;