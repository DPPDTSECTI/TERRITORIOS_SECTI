import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { DataContext } from '../context/DataContext';

// ================= COMPONENTE DE ANIMAÇÃO DOS NÚMEROS =================
const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const target = parseInt(value, 10);

    if (isNaN(target)) {
      setCount(value);
      return;
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count}</>;
};

// ================= DADOS DOS MÓDULOS DA PLATAFORMA =================
const modulosPlataforma = [
  {
    id: 'visao-geral',
    tag: 'Painel Central',
    title: 'Visão Geral & Dashboard Integrado',
    btnLabel: 'Acessar Visão Geral & Dashboard',
    rota: '/territorios',
    descricao: 'Centro de comando executivo com mapa dinâmico da Bahia e cards analíticos de inteligência territorial.',
    destaques: [
      'KPIs consolidados com atualização em tempo real ao selecionar territórios.',
      'Mapa interativo com recorte por Território de Identidade e município.',
      'Distribuição de cursos de CT&I por grandes áreas de conhecimento e principais IES.',
      'Ranking IFDM entre os municípios do território selecionado.',
      'Proporção de conectividade RNP nas tipologias de ensino e pesquisa.'
    ]
  },
  {
    id: 'ativos',
    tag: 'Infraestrutura',
    title: 'Ativos de Ciência, Tecnologia & Inovação',
    btnLabel: 'Acessar Ativos de Ciência, Tecnologia & Inovação',
    rota: '/ativos',
    descricao: 'Catálogo espacializado e georreferenciado de toda a rede física e institucional de pesquisa e inovação da Bahia.',
    destaques: [
      'Mapeamento de 10+ tipologias: Universidades, IFs, Parques Tecnológicos, ICTs e Hubs.',
      'Rede de Espaços Dinamizadores Colaborar interiorizando a cultura maker e inovadora.',
      'Filtros combinados simultâneos por Território, Município, Tipologia e Conexão RNP.',
      'Alternância ágil entre visualização no mapa interativo e tabela cadastral com busca.'
    ]
  },
  {
    id: 'cursos',
    tag: 'Capital Humano em CT&I',
    title: 'Ensino Superior em CT&I (Cursos Presenciais)',
    btnLabel: 'Acessar Ensino Superior em CT&I',
    rota: '/cursos',
    descricao: 'Diagnóstico da oferta formativa presencial de graduação e pós-graduação voltada a Ciência, Tecnologia e Inovação (CT&I).',
    destaques: [
      'Mapeamento de cursos de CT&I: Engenharias, Computação/TIC, Ciências Agrárias, Biotecnologia e Exatas.',
      'Identificação territorial de campi universitários públicos e privados credenciados com oferta em CT&I.',
      'Mapeamento da densidade de oferta formativa de CT&I por território e identificação de vocações locais.',
      'Subsídio para editais e políticas estaduais de atração e fixação de talentos científicos.'
    ]
  },
  {
    id: 'cadeias',
    tag: 'Economia Regional',
    title: 'Cadeias Produtivas, APLs & IGs',
    btnLabel: 'Acessar Cadeias Produtivas, APLs & IGs',
    rota: '/cadeia',
    descricao: 'Mapeamento das matrizes produtivas e ativos de propriedade intelectual que geram valor econômico no interior baiano.',
    destaques: [
      'Arranjos Produtivos Locais (APLs) estruturados e em consolidação em setores agropecuários e industriais.',
      'Indicações Geográficas (IGs) certificadas pelo INPI agregando notoriedade aos produtos baianos.',
      'Cruzamento direto entre a vocação econômica regional e a infraestrutura científica instalada.',
      'Identificação de oportunidades concretas de transferência de tecnologia e pesquisa aplicada.'
    ]
  },
  {
    id: 'relatorios',
    tag: 'Exportação & BI',
    title: 'Central de Relatórios & Impressão PDF',
    btnLabel: 'Acessar Central de Relatórios',
    rota: '/relatorio',
    descricao: 'Gerador sob demanda de relatórios executivos em alta definição (padrões paisagem e A4) para impressão.',
    destaques: [
      'Modelos oficiais diagramados: Síntese Territorial, Relatório de Ativos de CT&I e Relatório de Ensino.',
      'Padronização visual governamental de alto padrão para apresentações e audiências públicas.',
      'Exportação instantânea com suporte a vetores nítidos e paginação inteligente.'
    ]
  }
];

// ================= DADOS DOS INDICADORES ESTRATÉGICOS =================
const indicadoresEstrategicos = [
  {
    titulo: 'Conectividade Avançada RNP',
    tag: 'Infraestrutura Digital & Redes',
    descricao: 'Monitoramento da presença de rede óptica de altíssima capacidade operada pela RNP nas 5 tipologias prioritárias de ensino e pesquisa (Universidades Federais, Estaduais, IFs, IES Privadas e ICTs).'
  },
  {
    titulo: 'Índice IFDM (FIRJAN)',
    tag: 'Desenvolvimento Territorial',
    descricao: 'Índice FIRJAN de Desenvolvimento Municipal (2023), medido a partir de estatísticas oficiais de Emprego & Renda, Educação e Saúde, permitindo rankings internos municipais.'
  },
  {
    titulo: 'Densidade de Ativos CT&I',
    tag: 'Capacidade Instalada',
    descricao: 'Mapeamento consolidado das estruturas de pesquisa e inovação: Universidades Públicas, IFs, Faculdades Privadas, Parques Tecnológicos, ICTs, Incubadoras e Espaços Colaborar.'
  },
  {
    titulo: 'Cursos Superiores de CT&I',
    tag: 'Formação em CT&I',
    descricao: 'Mapeamento da oferta presencial de ensino superior nas áreas de Ciência, Tecnologia e Inovação (Engenharias, Computação, Exatas, Biotecnologia e Agrárias).'
  },
  {
    titulo: 'Cadeias Produtivas & APLs',
    tag: 'Economia Regional',
    descricao: 'Aglomerações territoriais de micro, pequenas e médias empresas com especialização produtiva comum, fomentadas pelo Estado para gerar agregação de valor tecnológico.'
  },
  {
    titulo: 'Indicações Geográficas (IGs)',
    tag: 'Propriedade Intelectual',
    descricao: 'Reconhecimento oficial de produtos cuja notoriedade e qualidades se devem exclusivamente à origem geográfica baiana (cacau, café, cachaça, farinha, etc.), incluindo IGs registradas e potenciais.'
  },
  {
    titulo: 'Segmentos Econômicos',
    tag: 'Matrizes Produtivas',
    descricao: '41 segmentos econômicos catalogados detalhando a vocação produtiva, polos industriais e oportunidades de desenvolvimento socioeconômico em todo o território baiano.'
  },
  {
    titulo: 'Recorte do Semiárido Baiano',
    tag: 'Equidade Territorial',
    descricao: 'Indicador transversal que computa o percentual de municípios, ativos e cursos inseridos na delimitação oficial do Semiárido (definido pela SUDENE), orientando investimentos compensatórios.'
  }
];

// ================= COMPONENTE PRINCIPAL (LANDING HERO) =================
export default function LandingHero() {
  const navigate = useNavigate();
  const introRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const {
    territoriosData = [],
    ativosData = [],
    cursosData = [],
    listaCadeias = [],
    distribuicaoCadeias = []
  } = useContext(DataContext);

  const qtdCadeias = (distribuicaoCadeias && distribuicaoCadeias.length > 0)
    ? 88
    : (listaCadeias?.length || 88);

  const qtdSegmentos = 41;

  // Controle do Efeito de Digitação
  const subtitleText = "Uma plataforma interativa desenvolvida pela SECTI para consolidar, analisar e dar transparência aos dados de Ciência, Tecnologia e Inovação nos 27 Territórios de Identidade da Bahia.";
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
    }, 20);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });

    if (introRef.current) observer.observe(introRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="w-full min-h-screen font-sans relative text-neutral-900 scroll-smooth bg-slate-50 overflow-x-hidden">

      {/* ================= FUNDO SUTIL E LIMPO (SEM BLOBS QUE PREJUDIQUEM A LEITURA) ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-primary-100/50 rounded-full filter blur-[140px] opacity-40"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-primary-100/40 rounded-full filter blur-[140px] opacity-30"></div>
        <div className="absolute -bottom-[20%] left-[15%] w-[500px] h-[500px] lg:w-[900px] lg:h-[900px] bg-blue-50/50 rounded-full filter blur-[160px] opacity-30"></div>

        {/* Linhas orbitais arquitetônicas sutis */}
        <div className="absolute top-[-5%] right-[-40%] lg:right-[-25%] w-[1200px] h-[1200px] lg:w-[1800px] lg:h-[1800px] border border-primary-900/[0.04] rounded-[40%] rotate-[35deg]" />
        <div className="absolute top-[15%] right-[-30%] lg:right-[-15%] w-[1300px] h-[1300px] lg:w-[2000px] lg:h-[2000px] border border-primary-900/[0.03] rounded-[35%] rotate-[60deg]" />

        {/* Marca d'água Territorial (Bahia Silhouette) */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[50%] sm:translate-x-[45%] md:translate-x-[40%] lg:translate-x-[40%] xl:translate-x-[40%] w-[800px] sm:w-[900px] lg:w-[1100px] xl:w-[1250px] pointer-events-none mix-blend-multiply flex items-center justify-center">
          <style>{`
            @keyframes drawSilhouette {
              0% { stroke-dashoffset: 100; opacity: 0; }
              100% { stroke-dashoffset: 0; opacity: 0.10; }
            }
            @keyframes breatheSilhouette {
              0%, 100% { opacity: 0.10; }
              50% { opacity: 0.05; }
            }
            .bahia-silhouette {
              stroke-dasharray: 100;
              stroke-dashoffset: 100;
              animation: drawSilhouette 3s ease-out forwards, breatheSilhouette 10s ease-in-out infinite 3s;
            }
          `}</style>
          <svg viewBox="0 0 800 845" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-auto text-primary-900">
            <path className="bahia-silhouette" pathLength="100" strokeLinecap="round" strokeLinejoin="round" d="M 46.49 267.04 45.18 265.89 42.63 265.24 40.35 265.52 39.7 264.87 37.9 265.44 35.62 264.54 34.53 262.4 31.72 261.17 30.76 261.25 27.03 259.69 24.23 260.14 23 259.36 20.24 259.28 18.09 259.69 16.21 257.8 12.88 257.76 9.24 254.88 8.67 253.36 8.54 249.62 6.78 248.43 6.87 246.54 6.3 245.76 3.54 244.81 2.05 242.63 1.92 240.95 1 239.26 2.4 236.1 1.53 235.28 3.94 234.5 7.09 232.77 10.95 231.09 12 230.92 13.84 229.03 14.98 226.73 15.51 221.22 17.7 216.37 19.23 214.48 19.67 212.8 21.47 211.65 23.44 209.64 25.23 208.65 27.25 206.64 29.35 205.57 29.62 204.46 28.57 202.61 28.52 201.33 29.97 198.21 33.87 196.48 34.44 195.13 34.18 193.03 32.51 192.17 36.15 189.75 37.42 189.17 37.9 186.33 36.28 184.36 35.84 183.13 37.86 181.16 39.61 180.54 40.53 181.44 44.34 180.46 45.79 179.27 48.02 179.31 48.9 178.28 49.12 176.43 51.62 176.02 51.84 173.92 52.8 173.31 54.47 173.39 56.7 172.36 57.27 171.09 62.05 168.01 62.53 166.9 65.2 165.13 68.8 164.76 69.5 162.71 68.53 161.14 68.84 158.92 71.43 157.57 75.41 157.53 76.51 156.71 77.74 154.53 78.09 152.8 80.02 149.93 79.97 145.77 79.31 143.23 79.88 141.58 78.44 141.58 78.39 140.35 80.67 140.6 82.43 139.73 84.22 138.21 85.06 138.09 88.12 136.53 90.18 137.72 91.23 139.24 91.41 141.01 90.84 142.82 91.23 144.58 92.64 146.35 94.78 147.62 95.09 151.03 95.79 152.19 97.81 153.13 99.3 154.36 100.74 156.38 103.02 158.19 103.42 159.54 103.15 162.83 104.03 164.43 105.96 165.54 105.61 167.06 102.94 169.24 101.53 171.05 102.32 172.44 101.66 175.61 102.45 176.88 102.41 180.21 102.85 181.49 103.99 182.64 106.88 183.29 108.28 185.76 109.2 190.24 111.66 192.25 114.68 192.99 116.92 194.02 117.88 197.1 118.8 198.01 121.17 197.55 122.39 198.91 125.33 199.07 126.29 199.44 130.02 199.57 130.98 200.1 133.74 199.53 135.76 200.55 138.17 202.53 138.61 203.35 140.45 203.27 142.29 203.96 142.77 204.7 145.97 207.13 148.86 204.91 150 204.87 152.11 203.22 153.16 204.74 154.56 203.22 156.53 201.74 156.36 200.06 158.29 196.81 160.78 196.48 160.87 195.09 161.88 194.14 164.6 192.79 167.53 193.32 168.63 192.62 169.2 190.28 168.45 187.61 168.76 185.88 172 185.39 173.32 184.65 175.33 181.65 176.34 181.16 179.02 181.44 180.46 182.72 183 183.13 185.37 181.9 186.2 180.17 187.21 179.43 189.23 179.92 191.2 179.68 192.34 178.94 195.67 175.12 197.42 174.46 199 175.2 200.09 176.47 201.1 178.57 203.12 180.87 205.66 181.16 208.11 180.17 209.47 181.32 210.74 181.61 211.84 182.55 214.07 182.31 215.26 181.24 216.57 178.61 219.82 177.21 220.69 174.66 221.7 170.8 223.85 168.13 223.01 165.5 223.67 162.71 224.5 162.09 226.74 162.62 228.8 163.77 232.92 163.94 233.45 163.12 233.4 160.28 234.54 159.17 235.99 156.83 237.13 155.68 239.19 154.45 240.11 153.25 240.37 151.12 240.06 148.73 242.52 146.31 244.58 143.72 245.85 140.27 246.24 138.21 245.58 135.75 246.81 133.65 250.19 133.45 251.98 133.94 252.68 133.49 252.51 131.76 254.52 129.87 255.14 128.06 254.83 126.42 252.16 125.02 251.68 123.87 252.73 122.23 252.51 120.83 251.11 119.76 252.33 117.87 253.82 117.46 254.88 114.83 255.97 113.76 254.92 112.08 252.11 110.39 246.59 108.13 244.58 106.78 243.48 103.82 243.74 101.85 243.31 100.78 240.85 96.91 239.67 96.05 240.37 94.37 239.62 93.91 239.71 91.61 238.75 89.56 239.01 88.37 241.9 83.52 243.35 82.45 244.49 80.56 245.89 79.24 247.47 78.54 252.82 77.31 258.64 73.16 260.27 71.02 262.85 68.39 265.35 67.74 266.4 67.37 269.29 64.65 271.75 63.63 274.42 64.08 275.74 65.07 278.1 68.23 279.72 71.23 281.7 72.96 283.19 72.91 285.03 74.68 286.34 75.13 287.88 77.64 289.19 76.65 291.25 76.65 293.66 75.59 295.46 77.39 297.17 76.57 298.22 73.82 299.44 73.57 300.89 74.35 301.64 73.28 303.04 74.39 306.37 75.09 307.11 76.9 308.65 76.86 313.21 75.75 314.65 76.45 315.88 78.96 315.35 81.63 316.97 85.98 318.29 86.56 320.39 86.52 322.72 89.52 326.13 88.53 326.92 89.43 326.7 90.75 327.45 92.72 327.54 94.49 329.33 94.78 331.92 94.49 332.71 93.63 332.97 91.9 334.5 91.04 336.52 88.61 336.04 87.42 337.18 86.97 338.67 88.12 340.73 88.37 341.65 87.83 344.5 87.79 347.34 84.09 349.01 84.34 350.41 83.89 353.87 84.38 355.72 83.76 356.33 82.82 356.07 81.01 360.05 80.56 361.32 79.04 362.16 76.41 363.82 75.38 366.76 74.07 367.46 73.2 367.59 71.31 370.13 69.87 370.92 68.48 373.2 67.82 375 67.9 377.19 66.05 378.72 65.56 380.39 66.38 382.71 65.72 386.57 65.93 389.59 65.35 392.44 63.22 395.33 63.18 396.56 62.76 398.18 64.08 400.55 62.6 401.99 63.87 402.87 63.87 404.89 65.19 406.33 63.55 408.04 63.01 409.31 61.61 410.23 61.65 412.12 62.02 413.65 57.46 415.36 55.41 415.36 53.93 417.42 52 420.75 49.66 421.28 47.19 421.15 45.14 421.93 42.34 424.91 42.38 426.27 41.85 426.58 40.33 429.69 40 432.06 37.53 435.17 37.33 435.39 38.56 437.36 37.78 437.27 36.18 438.5 34.98 439.2 32.89 440.52 31.94 440.25 30.55 441.57 29.35 442.22 27.75 443.58 27.71 444.9 25.78 446.78 23.93 447.7 24.22 449.76 19.37 450.29 17.48 451.38 16 453.36 16.04 455.42 17.77 457.96 17.73 459.97 18.51 461.38 17.44 463.74 16.99 464.75 15.79 469.35 16 469.92 16.25 474.48 15.71 473.6 16.99 473.08 19.12 474.48 20.52 475.44 22.45 481.05 22.78 482.06 24.67 481.49 27.01 482.5 27.79 484.16 26.48 486.01 25.99 487.54 26.64 488.81 27.88 490.96 27.05 493.11 30.09 493.24 31.66 494.42 33.92 495.69 34.62 496.13 36.71 496.96 37.12 496.92 39.59 498.45 42.09 499.24 44.48 499.59 48.05 501.04 49.66 503.36 49.86 505.03 51.42 507.22 51.87 509.14 53.31 511.29 53.03 512.83 54.87 512.61 57.22 511.64 59.44 510.46 61.29 511.73 63.5 511.12 65.15 509.36 65.76 508.27 67.53 506.6 66.71 505.16 68.31 506.78 70.16 506.73 71.76 505.99 73.12 506.3 75.87 504.41 76.74 504.89 78.09 503.4 80.31 505.73 79.37 508.84 79.98 511.6 81.38 516.6 82.74 518.65 81.59 520.85 81.38 522.42 80.6 523.61 77.85 524.48 76.9 526.28 76.24 527.46 76.37 529.44 77.39 531.19 75.91 532.72 72.34 534.26 71.48 536.58 73.2 538.29 73.78 539.56 73.61 541.53 71.35 541.27 69.55 542.8 65.93 543.77 64.53 544.38 61.08 545.61 57.18 544.95 54.3 546.35 49.12 547.49 47.31 549.68 45.87 551 46.08 553.32 47.4 556.48 50.48 559.06 50.68 563.57 47.93 564.58 46.61 566.6 46.33 570.5 46.45 572.03 45.92 573.83 45.38 577.42 41.07 578.87 38.85 579.79 38.27 581.1 35.52 580.62 32.77 578.74 29.52 578.78 27.59 579.97 26.15 584.83 25.2 588.42 25.62 591.93 23.48 596.49 23.93 598.24 22.86 597.93 20.27 598.28 19.29 596.66 13.7 597.01 12.01 600.12 11.97 605.08 11.19 607.36 9.92 608.36 8.77 610.99 7.86 611.65 7.12 615.29 6.18 616.56 5.23 617.39 3.63 618.79 3.63 620.46 1.82 623.61 1 625.54 2.23 626.59 3.22 629.4 3.18 631.63 3.67 632.6 4.78 632.82 6.47 633.61 8.07 634.96 8.93 635.14 14.03 636.1 15.83 639 16.33 640.71 15.92 641.76 14.64 643.91 16.45 647.5 17.11 650.7 18.1 653.37 18.51 657.23 21.55 658.24 23.4 660.25 24.3 662.49 23.64 666.21 23.11 667.61 22.62 672.08 22.78 673.75 23.44 678.66 27.83 681.51 29.35 682.65 32.85 682.95 36.51 684.57 39.01 687.64 40.04 688.61 39.46 689.88 37.33 690.05 32.03 691.54 28.86 693.25 26.6 694.83 25.94 698.86 26.93 701.01 28.29 701.88 30.42 701.05 32.72 699.12 34.04 697.63 35.97 698.07 37.78 698.99 39.59 700.66 41.27 703.68 43.45 706.49 44.48 707.58 44.4 709.12 43.33 711.13 41.27 713.02 40.37 714.46 40.33 716.26 42.38 717.4 44.31 717.35 45.26 716.17 46.49 714.68 47.23 714.24 48.18 716 49.94 714.68 51.26 714.9 53.31 717.49 55.98 718.23 58.49 717.57 59.89 720.77 66.18 721.69 69.34 724.28 72.05 725.59 74.31 724.72 77.23 727.04 77.8 729.06 79.37 730.11 78.87 732.17 79.24 734.01 78.79 735.94 79.37 736.64 80.6 738.61 81.5 740.41 81.63 742.51 84.13 741.94 85.82 740.45 87.75 740.76 88.74 738.96 91.41 738.83 93.05 739.44 94.12 741.5 95.85 743.17 96.42 740.41 98.56 738.52 101.27 739.05 105.67 739.88 107.97 742.51 110.31 744.35 111.21 744.57 114.79 743.82 115.94 743.52 117.75 742.51 119.56 743.3 120.42 745.14 124.16 746.5 124.78 748.56 124.28 749.57 125.15 753.03 125.39 756.67 127.08 757.37 128.1 757.72 132.17 759.21 135.83 761.14 138.25 761.71 139.69 761.18 141.25 761.22 143.39 762.45 144.13 764.55 154.57 765.12 155.88 762.76 156.87 760.92 157.03 760.57 157.73 757.45 159.54 756.01 160.77 756.14 161.92 754.47 164.31 757.72 168.95 758.11 171.99 757.8 173.68 756.58 175.32 758.33 186.7 744.66 192.17 742.33 192.99 740.32 192.95 739.79 190.61 738.08 188.43 737.3 188.23 735.45 188.51 734.36 187.65 733.44 188.43 732.17 188.23 731.55 189.09 730.2 189.05 727.48 188.39 726.86 187.69 724.81 188.14 723.58 189.42 723.97 192.33 723.27 194.31 721.91 195.38 721.17 198.01 722.31 199.61 721.52 201.29 721.69 203.27 722.57 206.06 723.49 207.01 726.47 208.32 726.03 210.09 727.17 212.02 729.63 213.21 730.81 214.65 731.64 213.66 733.04 214.24 733.22 216.7 734.27 217.53 735.45 219.7 734.05 221.63 734.88 223.24 736.02 223.36 735.98 225.37 736.9 227.35 738.17 228.54 739.88 228.42 742.12 230.18 743.61 230.1 744.22 232.4 743.08 232.98 743.65 234.58 742.69 235.65 743.39 236.72 742.03 238.2 744.44 245.22 746.37 247.32 746.24 248.55 747.77 249.62 748.43 247.98 750.4 248.55 750.92 250.93 752.59 250.56 753.69 251.35 753.99 253.24 755.83 254.1 757.41 255.58 758.59 257.76 759.51 258.13 763.02 258.45 763.81 259.48 765.52 259.56 765.61 260.67 770.21 262.19 771.39 260.06 771.35 258.99 772.27 257.88 773.49 257.84 774.98 259.44 776.43 259.77 777.75 258.7 778.53 260.76 779.37 259.73 782.35 260.55 784.93 258.41 788.44 258.33 790.8 257.47 793.87 255.17 796.46 252.17 799 251.35 798.56 253.03 794.97 256.65 792.03 261.5 786.82 271.85 784.49 276.66 784.01 277.11 783.88 277.85 780.24 285.62 775.95 295.19 775.03 296.92 774.81 298.93 769.33 307.19 768.94 308.59 767.05 311.67 764.29 315.49 762.63 318.16 760.22 322.23 757.85 324.86 752.77 332.51 751.19 334.03 751.19 334.48 746.1 341.42 744.57 343.81 743.61 346.23 741.94 348.99 739.49 350.55 738.48 351.99 738.04 353.96 735.63 355.81 733.35 358.23 726.12 366.66 725.33 367.19 723.32 370.11 720.99 372.78 718.32 374.75 716.87 376.4 713.54 380.34 711.57 381.49 709.64 381.12 707.67 382.03 701.67 386.42 696.45 386.01 692.16 385.31 694.17 381.41 693.95 378.45 689.31 379.44 690.18 381.82 689.26 384 687.86 384.98 685.67 388.23 684.36 388.56 682.21 390.12 680.85 390.53 678.92 392.96 677.74 393.49 676.64 395.55 673.57 397.07 673 397.97 671.65 398.22 668.89 399.7 667.61 401.3 662.97 403.6 662.09 404.09 660.51 406.44 659.46 409.02 658.89 413.09 659.64 416.96 660.65 418.56 661.17 419.38 663.36 417.41 664.55 418.43 664.5 421.15 665.91 423.94 665.16 425.79 663.45 427.19 663.85 428.46 662.57 429.2 661.92 431.71 661.83 433.56 662.53 434.91 664.68 436.84 664.28 438.49 665.82 439.06 665.64 441.82 663.36 443.17 662.88 441.9 661.7 441.73 659.24 443.63 659.24 444.49 657.27 446.87 656.44 449.42 656.26 452.75 657.62 456.32 658.89 457.88 660.43 460.39 661.74 461.5 662.44 463.39 662.49 466.19 661.52 469.35 660.08 477.98 658.19 483.69 657.97 486.03 657.36 486.94 657.05 490.23 656.48 493.47 657.53 495.12 657.45 497.66 656.18 500.66 656 502.8 654.86 507.57 653.98 512.54 653.2 514.55 653.11 517.27 651.71 521.75 650.87 525.11 650.57 531.32 650.87 535.51 651.27 537.24 652.41 538.84 653.46 538.88 653.37 541.22 654.03 542.87 654.51 550.55 655.3 552.32 656.4 556.26 656.57 558.73 656.48 565.51 656.57 568.06 656.53 576.85 657.01 582.44 657.4 583.55 658.5 590.66 660.21 596.95 661.3 603.32 661.22 608.33 661.7 613.96 662.92 618.52 663.63 618.85 664.85 623.25 665.29 623.58 667.48 628.3 668.23 629.08 667.96 632.21 665.95 636.4 664.02 641.66 663.45 643.92 662 647.12 660.69 651.4 659.9 654.23 660.65 656.9 658.41 660.97 654.82 665.12 654.25 669.6 654.51 671.29 655.74 672.73 655.21 674.16 655.47 675.85 654.07 676.22 652.89 677.41 650.96 681.11 651 684.23 649.12 689.57 648.9 692.94 648.16 695.82 648.46 697.5 647.37 700.92 647.32 703.67 645.4 706.42 645.22 707.82 644.12 708.6 643.77 713.04 644.08 718.3 645.18 719.7 646.62 720.52 645.57 721.22 643.16 724.54 642.85 727.79 641.36 730.79 641.45 732.76 640.79 736.54 640.57 739.34 639.22 740.57 637.99 743.49 637.81 747.85 638.03 750.06 637.2 754.09 637.59 758.49 638.6 762.8 638.69 764.37 639.83 767.98 639.74 775.75 640.05 777.84 639.52 779.36 639.83 781.13 641.63 784.67 644.47 788.45 643.12 790.42 640.36 792.68 640.75 793.99 633.87 800.98 633.34 802.09 632.95 804.51 628.92 806.12 626.99 806.45 622.39 808.25 618.14 810.8 615.77 813.1 613.89 815.36 611.43 819.06 608.67 824.61 605.87 828.1 601.53 835.79 601.4 837.02 600.08 840.35 599.25 844.13 597.01 843.14 577.82 830.94 561.43 820.54 551.13 813.88 550.73 811.95 547.89 810.39 547.54 808.83 552.01 806.53 555.25 802.79 554.59 801.43 553.5 800.82 552.53 798.56 551.48 797.98 551.83 794.24 550.95 792.68 549.55 792.76 548.24 791.41 546.79 792.1 544.82 789.68 544.51 787.54 542.45 786.39 542.41 784.62 541.36 783.35 539.12 784.3 538.24 782.2 536.1 783.35 534.26 781.05 534.65 778.91 533.38 778.25 531.93 779.32 530.62 778.42 529.13 775.26 528.16 774.23 528.69 771.56 527.59 771.39 525.4 768.76 525.45 767.78 522.34 766.79 520.54 765.1 518.83 765.72 516.68 764.2 518.65 763.21 518.7 760.87 517.82 757.63 519.05 757.34 521.02 754.87 523.12 753.93 521.9 752.94 521.07 751.26 522.2 749.37 521.85 748.26 522.69 746.65 522.25 745.5 520.98 745.22 520.41 742.26 521.85 740.12 522.34 737.2 521.15 736.42 521.07 735.19 522.07 733.09 522.42 730.67 523.48 728.04 525.84 726.31 526.72 723.56 527.46 722.41 527.86 719.82 528.91 718.92 530.71 719.08 531.41 720.15 532.85 719.82 535.18 720.76 535.66 720.11 537.72 719.74 538.86 718.71 541.71 721.59 544.82 721.22 546.48 720.31 546.83 718.34 548.54 717.48 548.63 714.97 548.06 712.87 547.01 711.89 545.61 712.59 544.86 712.01 542.41 712.42 541.36 711.31 541.62 709.67 543.59 706.55 544.12 704.74 543.81 703.42 543.28 701.57 544.56 699.6 545.48 695.16 546.53 692.82 547.84 692.9 550.47 691.79 552.01 692.78 554.24 692.74 554.94 693.4 556.39 692.7 556.43 691.55 555.51 688.59 558.18 686.12 560.29 683.53 561.34 681.07 563.4 683.41 564.58 682.83 564.89 680.57 566.29 679.79 567.43 677.2 568 674.99 569.27 672.73 570.63 671.94 571.07 670.34 572.08 670.26 573.65 671.16 574.36 669.11 576.02 667.88 577.38 667.88 577.12 666.15 575.76 664.47 578.83 660.93 580.27 660.23 580.32 657.56 579.92 656.45 582.2 654.19 582.55 653.25 581.02 651.56 580.23 649.14 576.94 645.93 575.76 645.52 577.55 643.47 576.81 643.06 573.87 642.77 573.39 643.84 571.95 643.96 571.2 643.22 569.84 643.63 569.05 642.11 567.83 642.23 566.29 640.22 564.5 639.97 564.54 638.29 563.79 636.6 561.87 635.58 560.77 635.95 559.1 635.58 556.48 635.62 555.25 632.33 552.44 630.93 551.44 628.55 549.95 626.58 547.62 627.03 546.57 627.77 540.74 627.77 539.56 627.4 537.72 627.85 533.64 626.74 533.03 624.44 531.36 622.8 530.66 622.26 528.56 624.19 526.67 623.41 525.58 624.6 525.67 626.04 523.61 625.84 521.94 626.58 520.45 623.91 519.27 623.12 518.04 620.82 516.38 619.22 514.58 619.96 513.35 618.28 511.69 617.66 510.33 615.23 509.63 614.78 507.22 615.48 506.25 616.3 506.43 618.07 504.19 618.85 502.62 617 503.1 615.97 499.77 613.06 498.63 613.71 498.76 614.95 496.65 616.55 494.38 617.21 492.58 616.96 491.57 614.29 488.55 613.88 487.36 613.22 485.44 617.08 483.68 618.85 481.05 618.85 480.05 619.71 477.42 619.38 475.75 621.19 473.73 621.36 471.94 623.86 466.99 621.89 466.15 621.03 464.14 620.82 462.38 621.69 460.81 621.81 459.01 621.03 455.68 621.48 453.53 600.48 453.01 599.99 446.3 594.03 444.28 592.02 441.22 589.51 415.32 566.13 411.2 567.48 409.14 567.44 408.83 568.67 406.99 570.48 404.32 571.47 403.97 572.46 402.17 572.54 398.62 571.1 395.46 571.76 391.87 572.54 390.86 573.48 387.4 569.04 385.12 567.61 384.77 565.84 383.24 564.81 382.4 566 379.56 566.54 378.94 566 376.88 566.83 375.61 568.14 373.73 567.52 373.25 566.95 370.31 565.47 369.3 564.2 367.64 565.88 366.15 563.78 363.65 564.07 359.92 562.22 360.01 559.22 357.21 558.89 355.5 557 352.43 555.48 352.25 554.7 349.19 553.47 347.83 551.99 346.29 550.96 344.36 552.69 342.35 551.42 339.68 549.11 338.54 549.03 337.35 547.22 335.91 547.59 333.85 546.07 333.19 544.22 330.08 543.61 327.58 542 325.7 539.87 323.11 538.1 323.11 537.2 322.36 537.57 320.22 536.87 319.78 535.55 316.19 532.35 314.08 531.48 310.97 531.65 308.82 530.13 307.33 530.83 306.54 529.96 304.92 531.44 303.43 529.51 302.56 529.8 301.15 528.65 299.09 528.73 296.95 527.38 295.33 527.33 294.27 528.03 291.03 527.87 287.96 528.69 286.47 529.55 285.33 529.02 282.31 531.28 280.03 531.53 277.8 532.51 276.26 533.7 275.52 533.33 272.45 535.59 270.83 537.85 271.7 539.13 268.15 539.95 266.4 541.55 265.7 540.48 265.52 538.43 262.76 537.24 261.67 535.92 259.21 536.79 257.9 535.96 255.58 535.55 250.84 532.92 249.62 531.48 247.12 531.69 244.53 530.38 243.39 530.54 240.54 529.47 238.18 529.43 236.12 527.58 237.17 524.83 236.86 522.57 235.77 521.75 236.51 520.22 236.86 516.53 240.54 509.5 241.6 504.9 244.75 500.58 242.69 500.01 241.42 498.24 239.58 498.69 235.24 497.34 233.36 496.97 232.31 497.62 230.68 496.35 226.87 494.83 226.3 494.21 223.85 495.2 223.28 496.18 221.83 495.9 219.77 495.61 219.33 494.66 217.76 494.95 216.22 493.76 215.39 495.03 214.25 494.13 212.32 493.55 211.4 494.5 210.35 493.6 208.77 493.31 207.46 492.2 206.23 492.32 204.56 493.64 202.29 493.1 200.05 493.18 198.87 492.08 196.76 492.86 194.97 494.87 193.17 495.4 190.63 495.65 189.18 496.06 188.26 497.46 187.03 498.24 185.19 498.44 184.14 499.68 182.74 499.14 180.55 499.64 176.82 501.12 174.68 503.05 172.27 503.75 170.51 505.64 169.37 505.43 169.46 507.2 168.06 507.9 167.01 507.24 163.63 510.77 160.96 512.54 159.86 512.46 156.31 514.68 154.25 515.01 154.65 517.31 153.11 518.46 153.2 519.4 150.7 522.98 149.48 522.81 147.2 524.7 141.68 526.92 140.41 528.85 137.29 529.55 135.94 530.79 134.4 534.32 132.91 535.8 131.82 536.17 128.31 535.72 125.72 534.65 123.58 535.88 122.35 535.47 120.11 538.06 117.79 539.33 116.43 541.22 114.02 542.7 112.8 544.63 110.34 545.74 106.75 549.4 104.73 550.84 102.63 550.76 100.88 553.06 99.61 553.14 97.9 554.05 97.15 552.81 95.79 553.47 93.91 552.11 91.19 552.77 91.23 553.68 88.91 555.57 87.03 558.61 86.28 559.26 84.09 559.47 83.21 560.74 83.61 561.61 81.99 564.28 80.06 565.43 78.88 565.47 76.77 567.69 75.41 567.98 72.61 567.28 70.55 567.32 68.4 568.1 67.39 569.95 66.12 569.87 65.07 571.1 61.21 569.17 59.24 569.09 56.79 570.32 55.34 574.3 52.67 574.35 51.44 574.8 50.7 576.93 49.21 578.99 48.99 580.06 47.37 580.22 47.15 579.07 45.66 578.33 45.48 576.07 43.99 575.04 47.23 572.54 48.68 572.54 49.91 571.51 50.26 569.74 49.65 568.88 51.09 567.52 52.98 563.66 55.91 560.99 56.18 557.83 56.92 554.46 56.44 553.06 53.28 550.59 53.68 549.03 52.19 547.43 50.78 546.65 51.18 545.09 49.73 542.83 52.01 541.76 52.27 541.18 53.37 539.21 53.24 534.98 53.85 533.37 53.46 531.77 51.44 530.21 52.93 528.36 54.73 528.24 54.47 526.22 55.12 524.42 53.9 523.14 55.25 520.76 54.95 518.75 55.96 517.76 55.47 516.9 53.63 515.79 54.51 514.47 54.25 513.32 52.58 511.8 53.85 509.99 54.29 508.39 56.35 508.55 58.32 507.24 60.38 506.38 60.34 504.61 61.57 503.66 62 502.18 61.21 501.28 60.03 501.57 58.76 500.75 57.97 499.39 57.4 496.51 56.04 495.28 54.6 495.49 54.68 494.01 53.37 493.43 51.79 493.6 51.49 492.57 50 492.45 48.77 491.42 49.43 489.49 48.55 488.05 46.14 489.08 43.99 487.55 43.82 485.21 42.5 484.6 40.97 485.21 38.03 484.47 37.02 483.73 36.98 482.29 33.65 480.61 31.81 480.32 34.61 477.4 34.04 475.51 35.62 473.62 35.93 472.51 35.18 471.61 35.36 469.68 32.07 467.21 31.06 466.76 31.46 463.02 33.61 459.32 33.91 458.13 32.86 457.02 30.8 456.65 31.37 455.21 29.71 453.9 31.06 452.83 34.44 451.97 33.61 449.46 31.85 449.71 31.24 448.43 33.34 447.12 33.47 445.64 31.98 445.06 33.12 442.02 35.67 439.56 37.86 438.53 40.05 436.19 38.12 434.17 35.53 434.58 34.35 434.3 33.47 433.06 33.82 431.91 33.43 430.23 35.18 428.42 34.57 426.41 36.23 425.42 34.88 423.94 34.83 423.16 33.17 422.22 35.23 420.69 35.53 419.83 39.35 418.39 42.46 417.65 44.34 416.22 45.83 413.96 46.84 413.79 49.82 411.94 50.35 408.82 48.51 407.83 46.27 408.65 44.3 409.8 43.42 409.64 39.17 412.23 36.37 412.93 35.23 412.64 33.56 414.28 31.2 415.31 29.97 415.27 29.18 412.43 26.86 411.57 28.26 409.6 28.3 407.17 25.59 407.09 27.82 403.02 28.04 401.22 27.47 398.71 28.74 398.38 28.83 397.15 27.47 396.08 26.24 393.94 28.04 391.89 28.87 390 29.84 389.09 30.49 386.63 33.78 384.94 35.05 385.72 40.49 383.38 43.16 382.03 44.12 379.93 44.17 378.29 42.02 377.55 38.12 378.82 36.94 378.94 35.67 379.97 34.18 380.26 31.37 379.52 28.13 381.04 28.83 378.45 28.39 377.38 29.35 376.35 29.53 374.92 28.83 373.27 31.33 371.14 30.54 369.16 29.84 368.67 29.62 366.74 30.36 366 29.97 363.78 31.11 362.55 31.2 360.98 28.83 358.68 29.97 357.37 31.9 356.05 31.5 354.94 29 353.79 30.49 350.42 30.01 349.48 31.06 348.57 31.94 346.4 36.63 344.92 40.18 344.79 40.92 343.52 40.05 341.96 40.27 340.15 38.6 340.23 33.91 342.25 32.29 342 32.2 338.92 32.55 336.66 31.2 334.81 28.08 335.1 28.52 333.53 28.52 330.95 25.72 329.67 24.97 328.44 23.66 328.36 24.23 326.42 26.02 325.85 25.67 324.95 21.95 324.33 22.43 321.99 21.25 320.92 22.47 320.1 23 318.82 22.3 316.52 20.37 315.99 21.16 314.43 22.17 310.89 22.34 307.77 20.94 307.4 20.59 305.55 21.16 303.86 19.76 302.8 19.98 301.56 21.86 300.66 21.86 299.67 23.35 297.74 26.37 295.52 29.97 294.78 32.64 294.78 36.41 293.18 37.42 293.26 39.26 290.8 38.43 289.44 36.67 289.69 35.93 290.47 33.52 290.92 29.49 289.48 27.73 290.34 25.89 290.43 21.77 288 21.82 285.74 23.44 285.74 23.79 284.02 25.41 282.74 25.1 279.37 24.1 278.14 27.43 273.87 28.7 272.88 28.04 270.21 26.9 268.73 27.21 267.25 28.92 267.37 31.94 266.71 34.92 268.73 38.08 269.71 40.75 269.8 43.77 268.65 46.53 268.56 46.49 267.04 Z" />
          </svg>
        </div>
      </div>

      {/* ================= SEÇÃO 1: HERO ================= */}
      <section className="relative w-full min-h-[calc(100vh-22px)] flex flex-col justify-between px-6 sm:px-10 lg:px-12 pt-6 sm:pt-8 pb-12 sm:pb-16 z-10 max-w-[1600px] mx-auto">

        {/* HEADER SUPERIOR */}
        <header className="w-full flex items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <img
                src="/img/favicon-96x96.webp"
                alt="Favicon Painel Territorial CT&I"
                className="h-6 sm:h-7 w-auto object-contain shrink-0"
              />
              <span className="font-sans font-bold text-sm sm:text-base tracking-wider uppercase text-neutral-900">
                Painel Territorial CT&I
              </span>
            </div>

            <span className="text-neutral-300 font-light text-xl select-none">|</span>

            <img
              src="/img/brasao_preto.webp"
              alt="Governo do Estado da Bahia"
              className="h-10 sm:h-12 w-auto object-contain shrink-0"
            />
          </div>

          <nav className="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-semibold text-neutral-700">
            <Link to="/" className="text-primary-700 font-bold transition-colors">
              Início
            </Link>
            <Link to="/territorios" className="hover:text-neutral-900 transition-colors">
              Dashboard
            </Link>
            <Link to="/sobre" className="hover:text-neutral-900 transition-colors">
              Sobre
            </Link>
            <Link to="/relatorio" className="hover:text-neutral-900 transition-colors">
              Relatório
            </Link>
          </nav>
        </header>

        {/* HERO TITLE & CALL TO ACTION (CENTRALIZADO VERTICALMENTE, TEXTO À ESQUERDA) */}
        <div className="w-full flex-1 flex flex-col justify-center my-auto py-8 sm:py-14">
          <div className="max-w-4xl lg:max-w-5xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-primary-200 text-xs font-bold uppercase text-primary-700 mb-4 sm:mb-6 shadow-xs justify-center leading-none">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
              Plataforma de Inteligência Territorial · SECTI
            </div>

            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl lg:text-[68px] leading-[1.08] mb-4 sm:mb-6 text-neutral-900 tracking-tight text-left">
              Ciência, Tecnologia <br />
              <span className="text-primary-700">
                & Inovação
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-neutral-800 font-medium leading-relaxed mb-6 sm:mb-8 min-h-[50px] max-w-3xl text-left">
              {typedText}
              <span className="inline-block w-1.5 h-4 ml-1 bg-primary-600 animate-pulse align-middle" />
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate('/territorios')}
                className="px-7 py-3.5 rounded-xl bg-primary-700 hover:bg-primary-800 flex items-center gap-3 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-white w-fit cursor-pointer group"
              >
                <span className="font-sans font-bold text-sm sm:text-base">
                  Explorar o Painel
                </span>
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              <a
                href="#modulos"
                className="px-5 py-3.5 rounded-xl bg-white border border-neutral-300 text-neutral-800 font-semibold text-sm hover:bg-neutral-50 hover:border-neutral-400 transition-all inline-flex items-center gap-2 shadow-xs"
              >
                <span>Conhecer os Módulos</span>
                <ArrowDown size={15} />
              </a>

              <Link
                to="/sobre"
                className="px-4 py-3.5 text-neutral-700 hover:text-neutral-950 font-semibold text-sm transition-colors"
              >
                Documentação Completa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO 2: O PROJETO & OBJETIVOS ================= */}
      <section id="introducao" ref={introRef} className="w-full px-6 sm:px-10 lg:px-12 pt-16 sm:pt-24 pb-20 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-10">

          <div className="flex flex-col gap-2 max-w-4xl lg:max-w-5xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
              O que é o Painel Territorial?
            </h2>

            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 mt-1">
              Sobre a Iniciativa · SECTI Bahia
            </span>

            <p className="text-sm sm:text-base text-neutral-900 font-normal leading-relaxed mt-2">
              O <strong>Painel Territorial de CT&I da Bahia</strong> é uma plataforma digital interativa, desenvolvida pela <strong>Secretaria de Ciência, Tecnologia e Inovação (SECTI)</strong>, para consolidar, analisar e dar transparência aos principais dados do ecossistema de CT&I nos <strong>27 Territórios de Identidade</strong> do estado.
            </p>
            <p className="text-xs sm:text-sm text-neutral-800 font-normal leading-relaxed">
              A ferramenta foi concebida como um instrumento estratégico para mapear as capacidades, vocações e desafios de cada região, oferecendo uma visão integrada e georreferenciada de ativos cruciais para o desenvolvimento socioeconômico.
            </p>
          </div>

          {/* NOSSOS OBJETIVOS (4 CARDS MINIMALISTAS) */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 block mb-3">
              Nossos Objetivos Estratégicos
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  t: 'Apoiar a Tomada de Decisão',
                  d: 'Fornecer dados qualificados para subsidiar o planejamento e a formulação de políticas públicas.'
                },
                {
                  t: 'Promover a Transparência',
                  d: 'Disponibilizar de forma aberta informações sobre investimentos, infraestrutura e indicadores de CT&I.'
                },
                {
                  t: 'Fomentar a Articulação',
                  d: 'Facilitar a identificação de sinergias entre governo, setor produtivo, academia e sociedade civil.'
                },
                {
                  t: 'Democratizar a Informação',
                  d: 'Servir como fonte de consulta para pesquisadores, estudantes, gestores e investidores.'
                }
              ].map((obj, idx) => (
                <div key={idx} className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200/80 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs">
                  <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-1.5">
                    {obj.t}
                  </h3>
                  <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                    {obj.d}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ================= SEÇÃO 3: MÓDULOS DA PLATAFORMA & O QUE OS COMPÕE ================= */}
      <section id="modulos" className="w-full px-6 sm:px-10 lg:px-12 py-16 max-w-[1600px] mx-auto border-t border-neutral-200/70">
        <div className="flex flex-col gap-8">

          <div className="flex flex-col gap-1.5 max-w-4xl lg:max-w-5xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Arquitetura & Navegação
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Módulos da Plataforma
            </h2>
            <p className="text-sm text-neutral-800 font-normal leading-relaxed">
              Conheça as ferramentas analíticas disponíveis em cada módulo do Painel SECTI e o que compõe cada área da plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 sm:gap-6">
            {modulosPlataforma.map((modulo, idx) => {
              const colSpan = idx < 3 ? 'lg:col-span-2' : 'md:col-span-1 lg:col-span-3';
              return (
                <div
                  key={modulo.id}
                  className={`bg-white rounded-xl border border-neutral-200/80 p-5 sm:p-6 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs ${colSpan}`}
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-700 block mb-1">
                      {modulo.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-snug mb-2">
                      {modulo.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-800 font-normal leading-relaxed mb-4">
                      {modulo.descricao}
                    </p>

                    <div className="space-y-1.5 border-t border-neutral-100 pt-3.5 mb-5">
                      <span className="text-[11px] font-semibold text-neutral-900 block mb-1">
                        O que compõe:
                      </span>
                      {modulo.destaques.map((item, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 text-xs text-neutral-800 leading-relaxed">
                          <span className="text-primary-600 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={modulo.rota}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors pt-3 border-t border-neutral-100"
                  >
                    <span>{modulo.btnLabel}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= SEÇÃO 4: INDICADORES ESTRATÉGICOS & NOVAS MÉTRICAS ================= */}
      <section id="indicadores" className="w-full px-6 sm:px-10 lg:px-12 pt-16 pb-24 max-w-[1600px] mx-auto border-t border-neutral-200/70">
        <div className="flex flex-col gap-8">

          <div className="flex flex-col gap-1.5 max-w-4xl lg:max-w-5xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Métricas & Dados Territoriais
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Indicadores Estratégicos
            </h2>
            <p className="text-sm text-neutral-800 font-normal leading-relaxed">
              Definições e conceitos das métricas processadas pela plataforma para diagnósticos regionais e subsidiar políticas públicas de CT&I.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {indicadoresEstrategicos.map((ind, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-neutral-200/80 p-5 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-700 block mb-1">
                    {ind.tag}
                  </span>
                  <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-2">
                    {ind.titulo}
                  </h3>
                  <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                    {ind.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </main>
  );
}