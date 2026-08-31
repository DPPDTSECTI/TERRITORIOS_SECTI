import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  skipProps,
  isLastStep,
  size,
}) => {
  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="bg-white border border-white/40 shadow-[0_16px_40px_-12px_rgba(29,53,87,0.15)] rounded-2xl p-5 w-[320px] sm:w-[380px] relative z-50 flex flex-col font-sans transform-gpu"
    >
      <div className="flex justify-between items-center mb-3">
        {step.title ? (
          <h3 className="text-[16px] font-extrabold text-[#1D3557] tracking-tight">{step.title}</h3>
        ) : (
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-[#D6EAF8] flex items-center justify-center text-[#457B9D]">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
             </div>
             <span className="text-[11px] font-bold text-[#457B9D] uppercase tracking-wider">Passo {index + 1} de {size}</span>
          </div>
        )}
        
        <button {...closeProps} title="Fechar Tutorial" className="text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 p-1.5 rounded-full transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="text-[14px] text-[#1D3557]/80 leading-relaxed font-medium mb-5">
        {step.content}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#D6EAF8]/50">
        
        {/* Indicadores de bolinhas */}
        <div className="flex gap-1.5">
           {[...Array(size)].map((_, i) => (
             <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-[#457B9D] w-4' : 'bg-[#D6EAF8] w-1.5'}`} />
           ))}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3">
          {!isLastStep && (
            <button {...skipProps} className="text-[12px] font-bold text-[#94A3B8] hover:text-[#1D3557] transition-colors">
              Pular
            </button>
          )}
          {index > 0 && (
            <button {...backProps} className="text-[12px] font-extrabold text-[#457B9D] hover:text-[#1D3557] transition-colors">
              Voltar
            </button>
          )}
          {continuous && !isLastStep && (
            <button {...primaryProps} className="px-4 py-2 text-[13px] font-extrabold tracking-wide bg-[#457B9D] text-white rounded-full shadow-md shadow-[#457B9D]/30 hover:bg-[#1D3557] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              Próximo
            </button>
          )}
          {(!continuous || isLastStep) && (
            <button {...primaryProps} className="px-4 py-2 text-[13px] font-extrabold tracking-wide bg-[#1D3557] text-white rounded-full shadow-md shadow-[#1D3557]/30 hover:bg-[#2563EB] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              Concluir
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function TourGuide() {
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboardSteps = [
    {
      target: 'body',
      title: 'Bem-vindo(a)! 👋',
      content: 'Bem-vindo ao Painel Territorial CT&I! Vamos fazer um tour rápido para você conhecer as principais funcionalidades.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-sidebar',
      title: 'Navegação Principal',
      content: 'Aqui você encontra os menus para acessar os relatórios completos, gestão de ativos e outras páginas do sistema.',
      placement: 'right',
      spotlightPadding: 0,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-sobre',
      title: 'Entenda o Sistema 💡',
      content: 'Nós recomendamos fortemente visitar a aba "Sobre" para entender a metodologia, as fontes de dados e os conceitos usados neste painel!',
      placement: 'right',
      spotlightPadding: 4,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-visao',
      title: 'Visão Geral (Painel Integrado)',
      content: 'Reúne os totais do estado e apresenta métricas agregadas de todos os indicadores.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-ativos',
      title: 'Infraestrutura de Ativos',
      content: 'Acesse o mapeamento de laboratórios, parques tecnológicos e a distribuição de conectividade avançada.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-cadeias',
      title: 'Cadeias Produtivas',
      content: 'Explore as vocações econômicas e a teia de conexões territoriais interativa dos setores estratégicos.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-nav-cursos',
      title: 'Oferta de Cursos',
      content: 'Consulte a distribuição educacional superior (graduação/pós) em CT&I por modalidade e instituição.',
      placement: 'right',
      spotlightPadding: 2,
      blockTargetInteraction: true,
    },
    {
      target: '.tour-kpis',
      content: 'Aqui estão os indicadores principais (KPIs). Eles mostram um resumo dos dados de acordo com os filtros selecionados.',
      placement: 'bottom',
    },
    {
      target: '.tour-charts',
      content: 'Estes gráficos apresentam um resumo visual da distribuição de ativos e cursos no estado. Ah, você pode arrastá-los para reordenar a tela!',
      placement: 'left',
    },
    {
      target: '.tour-map',
      content: 'Este é o mapa interativo. Ele exibe a distribuição dos ativos tecnológicos e instituições por todo o estado da Bahia. Você pode clicar nos marcadores para mais detalhes.',
      placement: 'right',
    },
    {
      target: '.tour-user-menu',
      title: 'Seu Perfil e Ajustes',
      content: 'Aqui você tem acesso rápido ao seu perfil, configurações de sistema e também a opção de sair (logout).',
      placement: 'bottom-end',
      spotlightPadding: 4,
    },
    {
      target: '.tour-help-button',
      title: 'Dúvidas?',
      content: 'Se precisar rever este tutorial, basta clicar neste botão de ajuda a qualquer momento no cabeçalho!',
      placement: 'bottom-end',
      spotlightPadding: 2,
    },
  ];

  const relatorioSteps = [
    {
      target: 'body',
      title: 'Módulo de Relatórios 📊',
      content: 'Aqui você pode consultar análises detalhadas, gerar relatórios executivos e exportar todos os dados do sistema.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-relatorio-tipo',
      title: 'Tipos de Relatório',
      content: 'Navegue entre as abas para alternar a visão dos dados (Síntese Geral, Ativos, Cursos, Cadeias Produtivas...).',
      placement: 'bottom',
    },
    {
      target: '.tour-relatorio-kpis',
      title: 'Resumo Dinâmico',
      content: 'Estes cartões mostram os totais e percentuais que se ajustam automaticamente ao relatório e território selecionados.',
      placement: 'bottom',
    },
    {
      target: '.tour-relatorio-export',
      title: 'Exportação de Dados',
      content: 'Precisa dos dados para planilhas ou sistemas? Exporte facilmente tudo em formatos CSV (Excel) ou JSON!',
      placement: 'left',
    },
    {
      target: '.tour-help-button',
      title: 'Dúvidas?',
      content: 'Sempre que precisar relembrar as funcionalidades desta tela, é só clicar aqui.',
      placement: 'bottom-end',
      spotlightPadding: 2,
    },
  ];

  const steps = location.pathname === '/relatorio' ? relatorioSteps : dashboardSteps;

  useEffect(() => {
    if (location.pathname === '/territorios') {
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      if (!hasSeenTour) {
        localStorage.setItem('hasSeenTour', 'true');
        setTourKey(prev => prev + 1);
        setTimeout(() => setRun(true), 1200);
      }
    } else if (location.pathname === '/relatorio') {
      const hasSeenRelatorioTour = localStorage.getItem('hasSeenRelatorioTour');
      if (!hasSeenRelatorioTour) {
        localStorage.setItem('hasSeenRelatorioTour', 'true');
        setTourKey(prev => prev + 1);
        setTimeout(() => setRun(true), 1200);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    // Escutar evento para reiniciar o tour
    const handleStartTour = () => {
      setTourKey(prev => prev + 1);
      if (location.pathname === '/territorios' || location.pathname === '/relatorio') {
        setRun(true);
      } else {
        navigate('/territorios');
        setTimeout(() => setRun(true), 1000);
      }
    };
    window.addEventListener('start-tour', handleStartTour);

    return () => {
      window.removeEventListener('start-tour', handleStartTour);
    };
  }, [location.pathname, navigate]);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;
    
    // Quando o tour for concluído ou pulado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || type === 'tour:end') {
      setRun(false);
      // Salvar no localStorage para não mostrar novamente automaticamente
      if (location.pathname === '/territorios') {
        localStorage.setItem('hasSeenTour', 'true');
      } else if (location.pathname === '/relatorio') {
        localStorage.setItem('hasSeenRelatorioTour', 'true');
      }
    }
  };

  return (
    <Joyride
      key={tourKey}
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      floatingOptions={{
        autoUpdate: {
          animationFrame: true,
        },
      }}
      floaterProps={{
        disableAnimation: true, // Desativa animação padrão para usar o Framer Motion
      }}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: '#ffffff', // A seta vai pegar a cor de fundo padrão
        },
        overlay: {
          backgroundColor: 'rgba(29, 53, 87, 0.4)', // Overlay mais escuro e elegante
        },
        spotlight: {
          borderRadius: '24px', // Deixa a luz arredondada combinando com os cards
        }
      }}
    />
  );
}
