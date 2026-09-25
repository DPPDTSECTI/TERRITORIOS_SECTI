# Painel Territorial CT&I — Documentação do Sistema

Aplicação web da **SECTI (Secretaria de Ciência, Tecnologia e Inovação da Bahia)** que reúne, por **Território de Identidade** e por município, os ativos de CT&I, as cadeias produtivas, os cursos de ensino superior e indicadores de desenvolvimento (IFDM/FIRJAN) do estado da Bahia.

- Produção: `https://territorios-secti.vercel.app`
- Repositório: `DPPDTSECTI/TERRITORIOS_SECTI`
- Documento complementar: [INGESTAO-DE-DADOS.md](./INGESTAO-DE-DADOS.md)

> Este documento descreve o que existe **no código do repositório**. O esquema do banco (tabelas/colunas no Supabase) não está versionado aqui; os campos citados foram inferidos do que o código consome. Onde há incerteza, isso está indicado.

---

## 1. Visão geral da arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│ Navegador (SPA React + Vite)                                 │
│                                                              │
│  main.jsx → App.jsx → Providers:                             │
│    HelmetProvider → ThemeProvider → Router → DataProvider    │
│                                                              │
│  DataProvider ──(12 consultas em paralelo)──► Supabase       │
│       │              (REST/PostgREST, chave anônima)         │
│       └─ cache em localStorage (10 min)                      │
│                                                              │
│  Páginas/módulos ── useContext(DataContext) ──► gráficos,    │
│                      mapas (Leaflet), listas, relatórios     │
└──────────────────────────────────────────────────────────────┘
        ▲ estático (dist/)                    ▲
        │                                     │
┌───────┴───────────────────┐       ┌─────────┴────────────────┐
│ Vercel (hospedagem)       │       │ Supabase (Postgres)      │
│  • serve o build do Vite  │       │  tabelas/views listadas  │
│  • /api/keep-alive (Cron) │──────►│  na seção 5              │
└───────────────────────────┘       └──────────────────────────┘
```

Características importantes:

- **Sem backend próprio.** O front-end fala direto com o Supabase usando a chave *publishable/anon*. A única função server-side é `api/keep-alive.js` (ver seção 9).
- **Somente leitura.** O código do app só faz `select`. Não há `insert/update/upsert` no front-end (a tela `/admin` é uma maquete, ver seção 4.8).
- **Geografia estática.** O mapa usa o TopoJSON `public/BA_(1)9396399957704198.json` (417 municípios, fonte IBGE), carregado via `fetch` pelos componentes de mapa.

## 2. Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18, React Router 7, Tailwind CSS 3 (tokens via CSS variables), Framer Motion, lucide-react |
| Gráficos | Recharts 3 e componentes SVG próprios (`src/components/graph`) |
| Mapas | Leaflet + react-leaflet, supercluster, topojson-client |
| Dados | `@supabase/supabase-js` |
| Relatórios | html2canvas + jsPDF (cliente); Playwright (apenas em desenvolvimento local) |
| Ordenação de cards | @dnd-kit |
| Tour guiado | react-joyride |
| Planilhas | xlsx (scripts de ingestão e exportações) |
| Testes | Vitest |
| Hospedagem | Vercel (Analytics + Cron) |
| Build | Vite 6 (`vite-plugin-node-polyfills`) |

Fontes: **Roboto Flex** (texto) e **Righteous** (display), carregadas do Google Fonts em `index.html`.

## 3. Estrutura do repositório

```
├── api/keep-alive.js          Função serverless (Vercel Cron) — mantém o Supabase ativo
├── public/
│   ├── BA_(1)9396399957704198.json   TopoJSON dos municípios da Bahia
│   ├── bahia_outline.svg, favicon.svg, img/…   Ativos visuais (brasões, favicon)
│   └── robots.txt, sitemap.xml
├── scripts/                   Ingestão, captura de relatórios, otimização de mapa/imagens
├── scratch/                   Prints e script de apoio de desenvolvimento (não faz parte do app)
├── src/
│   ├── main.jsx               Entrada; ErrorBoundary; registro de service worker
│   ├── App.jsx                Rotas, layout, transição de páginas, rolagem global
│   ├── index.css              Tokens de cor (claro/escuro), utilitários, regras de impressão
│   ├── context/
│   │   ├── DataContext.jsx    Carga, cache e derivação de dados do Supabase
│   │   └── ThemeContext.jsx   Tema claro/escuro
│   ├── services/supabase.js   Cliente Supabase
│   ├── components/            Páginas e componentes (ver seção 4)
│   │   ├── graph/             Gráficos reutilizáveis
│   │   ├── maps/              PtiMap (mapa da Bahia) e SideMap (mapa dos módulos)
│   │   └── pdf/               Relatórios executivos 16:9 (Síntese, Ativos, Ensino, Cadeias)
│   ├── constants/             assetTypes.js, semiarido.js (278 municípios do Semiárido)
│   ├── data/                  municipiosDB, municipiosCoords, referenciasDB, municipios_bahia.json
│   ├── utils/                 normalization, reportAggregation, reportPrint, exportação
│   └── __tests__/utils/       Testes unitários (Vitest)
├── tailwind.config.js         Paleta semântica ligada às CSS variables
├── vercel.json                Cron, cabeçalhos de segurança/cache e rewrite de SPA
└── vite.config.js             Plugins, chunks e endpoint de exportação PDF (somente dev)
```

## 4. Módulos (rotas)

Definidas em `src/App.jsx`. Todas as páginas são carregadas sob demanda (`React.lazy`) e animadas com `AnimatePresence`.

| Rota | Componente | Função |
|---|---|---|
| `/` | `hero.jsx` | Página inicial: apresentação, números-chave e entrada para os módulos |
| `/sobre` | `SobrePage.jsx` | Contexto do projeto, metodologia e `FontesReferenciasSection` (catálogo de fontes) |
| `/territorios` | `DashboardPainel.jsx` | **Visão Geral**: KPIs, mapa dos territórios, cards reordenáveis (drag-and-drop) e filtro do Semiárido |
| `/ativos` | `AtivosPage.jsx` | Ativos de CT&I (parques, hubs, incubadoras, laboratórios etc.) por território/município |
| `/cadeia` | `CadeiaPage.jsx` | Cadeias produtivas e IGs potenciais, com referências |
| `/cursos` | `CursosPage.jsx` | Cursos de ensino superior (presenciais) por área, instituição e município |
| `/relatorio` | `RelatorioPage.jsx` | Montagem e exportação de relatórios (PDF/PNG/planilha) |
| `/relatorio/sintese`, `/relatorio/ativos`, `/relatorio/cursos`, `/relatorio/cadeias` | `pdf/Relatorio*.jsx` | Páginas 16:9 (1920×1080) usadas como fonte da exportação; sem sidebar |
| `/admin` | `AdminPage.jsx` | Maquete de cadastro de ativos (ver 4.8) |

### 4.1 Layout, navegação e tema

- **Sidebar** (`Sidebar.jsx`): recolhida (68 px) e expande ao passar o mouse (190 px). Grupos *Menu* (Início, Dashboard, Relatório, Sobre) e *Módulos* (Visão Geral, Ativos, Cadeia, Cursos CT&I). Em `/sobre` mostra só o menu.
- **Barra superior fixa** (`UserHeaderProfile.jsx`): brasão do Estado (troca entre versão preta/branca conforme o tema), botão de tema e botão de tutorial.
- **Tema**: `ThemeContext` alterna a classe `dark` em `<html>`; persiste em `localStorage['secti-theme']` e respeita `prefers-color-scheme` quando não há escolha salva. As cores vêm de CSS variables (`--color-*`) em `index.css`, expostas no Tailwind como `primary`, `neutral`, `surface`, `success`, `warning`, `danger`, `accent`, `chart-*` e `map-*`.
- **Navegação por scroll** (`PageScrollNavigator`): ao rolar a roda do mouse (|delta| ≥ 35) sobre áreas *sem* scroll interno, troca entre `/territorios → /ativos → /cadeia → /cursos`. Ignora mapa Leaflet, tabelas e contêineres com `overflow-*`. Há trava de 750 ms entre trocas.
- **Posição de scroll** (`GlobalScroll`): salva em `sessionStorage['scroll-<rota>']` ao descarregar a página e restaura ao entrar.
- **Tour guiado** (`TourGuide.jsx`): react-joyride; passos separados para o Dashboard e para a página de Relatório. Exibido uma vez por sessão (`sessionStorage`: `hasSeenTour`, `hasSeenRelatorioTour`); pode ser reaberto pelo botão de ajuda (evento `start-tour`).

### 4.2 Filtro do Semiárido

Estado global `filtroSemiarido` (em `DataContext`). Quando ativo, os módulos restringem dados aos **278 municípios** da lista oficial em `src/constants/semiarido.js` (comparação por nome normalizado). Os cards usam as classes `semiarido-card-warmth-*` e o fundo "sol do semiárido" (`animate-sun-*`).

### 4.3 Territórios selecionados

`selectedTerritory` (em `DataContext`) guarda o território escolhido no mapa e é compartilhado entre módulos e páginas de relatório. As páginas de relatório também aceitam `?territorio=<id|bahia>&modo=<normal|semiarido>` na URL.

### 4.4 Gráficos (`components/graph`)

`CardLista`, `CustomPieChart`, `DonutChart`, `ProportionBarChart`, `RankingBarChart`, `StackedBarChart`. Usam as cores `chart-*` e têm estados de carregamento (`animate-pulse`).

### 4.5 Mapas (`components/maps`)

- `PtiMap.jsx`: mapa da Bahia com pontos/legenda por território.
- `SideMap.jsx`: mapa usado nos módulos (busca, seleção de município/território, clusters, tooltips). Tiles em tons neutros (`.map-tiles-clean`); atribuição do Leaflet oculta via CSS.

### 4.6 Utilitários (`src/utils`)

| Arquivo | Conteúdo |
|---|---|
| `normalization.js` | `normalize` (remove acentos/símbolos), `safeKey`, `fixWeirdCapitalization`, `expandirNomeEntidade`, `sortAlpha`, `filterCursos`, `extractSigla`, `classificarInstituicao` |
| `reportAggregation.js` | Funções puras de agregação para relatórios (ranking de municípios, heatmap por área, cadeias por segmento, entidades por categoria, listas município × instituição). Sem dependência de DOM |
| `reportPrint.js` | CSS e rotinas de impressão dos relatórios |
| `exportReportClient.js`, `clientExport.js` | Exportação PDF/PNG no navegador (html2canvas + jsPDF) com correção para o erro `addColorStop non-finite` |

### 4.7 Relatórios e exportação

Cada relatório é uma página de 1920×1080 com raiz `#pdf-report`. Duas rotas de geração:

1. **Cliente (produção e padrão):** `html2canvas` + `jsPDF` capturam `#pdf-report` no navegador. Não depende de servidor.
2. **Playwright (somente `localhost`):** `ExportPdfButton`/`RelatorioPage` chamam `/api/export-pdf` e `/api/export-png`, endpoints criados como *middleware* no `vite.config.js` que usa `scripts/captureReports.mjs` (Chromium a 1920×1080 @3x). **Não existe em produção** — na Vercel, `api/` só contém `keep-alive.js`; se a chamada falhar, o app volta ao método de cliente.

Regras `@media print` em `index.css` fixam a página em 1920×1080 e ocultam elementos `print:hidden`.

### 4.8 Administração (`/admin`)

Maquete visual: a lista de ativos é um `useState` com 6 linhas fixas, os cartões mostram números e variações fixos (ex.: "+12.4%", "43 municípios") e a data do cabeçalho está fixa no código. **Não lê nem grava no Supabase e não tem autenticação.** A rota aparece na Sidebar como "Ativos de CTI" (definida em `adminItems`, mas esse array não é renderizado na versão atual).

## 5. Dados consumidos do Supabase

Carregados em `DataContext.jsx` (12 consultas em paralelo, `Promise.all`):

| Tabela / view | Uso no app | Limite de linhas na consulta |
|---|---|---|
| `stats_ti` | Estatísticas por território (KPIs, mapa): `id_territorio`, `media_ifdm`, `ativos_cti`, `qtd_cursos_cti`, `cadeias_produtivas`, `pct_semiarido` | padrão |
| `lista_ativos_cti` | Lista de ativos de CT&I | `range(0, 3000)` |
| `lista_cursos_cti` | Lista de cursos | `range(0, 3000)` |
| `distribuicao_cadeias` | Cadeias × município/território | `range(0, 4999)` |
| `lista_cadeia_produtiva` | Cadeias produtivas | `range(0, 1000)` |
| `lista_municipioxterritorio` | Relação município ↔ território | `range(0, 1000)` |
| `tipo_ativos` | Tipos de ativo (`id_tipo_ativo`, `nome_tipo`) | padrão |
| `tipo_cursos` | Tipos de curso | padrão |
| `tipo_cadeia` | Tipos de cadeia (id 3 = "potencial") | padrão |
| `cursos` | Só `id_curso, ead` — usada para marcar EAD | `range(0, 3000)` |
| `referencias` | `id_referencia, titulo_referencia, texto_referencia, url_referencia` | padrão |
| `firjan` | Indicadores IFDM/FIRJAN | `range(0, 1000)` |

### Tratamentos feitos no front-end

- **EAD × presencial:** cria um mapa `id_curso → ead` a partir da tabela `cursos`, marca cada curso de `lista_cursos_cti` e separa em `cursosData` (presenciais) e `cursosEadData`.
- **Contagem de cursos:** substitui `qtd_cursos_cti` de cada território pela contagem de cursos **presenciais** (a contagem da view incluía EAD).
- **IFDM:** trunca `media_ifdm` para 3 casas decimais.
- **Texto de referência (IG potencial):** para cadeias do tipo *potencial*, associa `texto_referencia` pela URL da fonte (tabela `referencias`), com *fallback* em `src/data/referenciasDB.js`.
- **Derivados:** `territoriesDynamicStats` (por território) e `kpisGlobais` (totais e média de IFDM).

### Cache

- Chave: `@SectiPainel_Data_v14_SUPABASE_PROD` em `localStorage`; validade **10 minutos**.
- O cache só é aceito se `distCadeias.length > 88` (proteção contra cache incompleto).
- Ao alterar a estrutura dos dados, **mude o número de versão da chave** para invalidar os caches dos usuários.
- Se o `localStorage` estiver cheio, o app funciona sem cache.

### Dados estáticos embutidos

| Arquivo | Conteúdo |
|---|---|
| `src/data/municipiosDB.js` | Município → território (id e nome) |
| `src/data/municipiosCoords.js` | Coordenadas dos municípios |
| `src/data/municipios_bahia.json` | Lista dos municípios |
| `src/data/referenciasDB.js` | Catálogo de fontes/referências (metadados: 48 referências, 4 categorias, 10 subcategorias) e textos por fonte |
| `src/constants/semiarido.js` | 278 municípios do Semiárido; total do estado: 417 |
| `src/constants/assetTypes.js` | Tipos de ativo |

## 6. Variáveis de ambiente

| Variável | Onde | Obrigatória? |
|---|---|---|
| `VITE_SUPABASE_URL` | Cliente (build) | Não: há valor padrão em `src/services/supabase.js` |
| `VITE_SUPABASE_ANON_KEY` | Cliente (build) | Não: há valor padrão em `src/services/supabase.js` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `api/keep-alive.js` | Não: a função usa as `VITE_*` e, por fim, os mesmos padrões |
| `CRON_SECRET` | `api/keep-alive.js` | Opcional: se definida, o endpoint só aceita chamadas da Vercel |

A chave usada é *publishable* (pública por natureza). A segurança dos dados depende das **políticas RLS** do Supabase — confirme que só há permissão de leitura para a chave anônima.

> O README antigo cita `VITE_OPENROUTER_API_KEY`; nenhum código atual a utiliza.

## 7. Como rodar

```bash
npm ci                 # instala dependências (Node 18+)
cp .env.example .env   # opcional; valores padrão já funcionam
npm run dev            # http://localhost:5173
npm run build          # gera dist/
npm run preview        # serve o build
npm test               # Vitest (uma execução)
npm run test:watch
```

Outros scripts (`package.json`): `generate-json`, `simplify-map` (reduz o TopoJSON com mapshaper), `optimize-images` (sharp). Ver [INGESTAO-DE-DADOS.md](./INGESTAO-DE-DADOS.md).

Testes existentes (`src/__tests__/utils`): `normalization`, `filtering`, `reportAggregation`, `exportReportClient`.

## 8. Deploy (Vercel)

- Deploy automático a cada `push` na branch `main`.
- `vercel.json`:
  - `crons`: `/api/keep-alive` diariamente às 12:00 UTC.
  - Cabeçalhos: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`; cache imutável para `/assets`, `.js` e `.css`; `.json` com 1 h + `stale-while-revalidate`; `index.html` e `/api/*` sem cache.
  - `rewrites`: qualquer rota que não comece com `api/` cai em `/index.html` (SPA).
- Cron só roda em **Production** e, no plano Hobby, no máximo 1×/dia com janela de até 59 min.

## 9. Manter o Supabase ativo (`api/keep-alive.js`)

O plano gratuito do Supabase pausa o projeto após ~7 dias sem requisições e **não reativa sozinho** (é preciso *Restore project* no painel). A função faz `GET /rest/v1/tipo_ativos?select=*&limit=1` e responde `{ ok, status, at }` (200 se o Supabase respondeu OK, 502 caso contrário, 401 se `CRON_SECRET` estiver definido e o cabeçalho não bater). Para testar manualmente: abrir `/api/keep-alive` (ou **Settings → Cron Jobs → Run** na Vercel).

## 10. Convenções de interface

- **Somente desktop.** O painel não tem suporte a mobile (a sidebar fixa e os layouts em duas colunas foram pensados para telas largas); validar layouts em 1280 px ou mais, com a sidebar recolhida e expandida.
- Espaçamento e cores sempre via tokens do Tailwind (`bg-surface`, `text-text-primary`, `border-border`…), para funcionar nos dois temas. Os aliases `text-*` e `border-*` são registrados em `colors` no `tailwind.config.js`; **não defina `textColor.primary` como string** (isso apaga a escala `text-primary-50…950`).
- No tema escuro a escala `primary-50…200` é escura (serve de fundo). Para texto claro use `dark:text-primary-300` ou `dark:text-neutral-900` (no escuro, `neutral-*` é invertido).
- Colunas `flex-1` ao lado do mapa precisam de `min-w-0`, senão estouram e perdem a margem direita quando a sidebar expande.
- Utilitários próprios em `index.css`: `hide-scroll`, `animate-in` (+ `zoom-in-95`, `slide-in-from-right-4`, `slide-in-from-top-2`), `animate-soft-fade`, `animate-sun-*`, `bg-carto-grid/dots`, `carto-node`. Animações respeitam `prefers-reduced-motion`.
- Sombras: `shadow-xs`, `shadow-card`, `shadow-card-soft`, `shadow-card-hover`, `shadow-card-elevated`, `shadow-glass`.

## 11. Pontos de atenção conhecidos

| # | Situação | Impacto / sugestão |
|---|---|---|
| 1 | `main.jsx` registra `/sw.js`, mas não existe `public/sw.js` | Em produção a URL cai no rewrite e devolve HTML; o registro falha (aviso no console). Criar o service worker ou remover o registro |
| 2 | `scripts/generateJson.mjs` importa `./generateTerritoryFiles.mjs`, que não existe | O script falha ao iniciar. Ver INGESTAO-DE-DADOS.md |
| 3 | Consultas com `range(0, 3000)` | O Supabase costuma limitar a 1000 linhas por resposta (`max-rows`). Se houver mais registros, serão cortados sem erro. Confirmar a configuração ou paginar |
| 4 | `/admin` sem autenticação e com dados fixos | Não publicar como funcionalidade real antes de ligar ao banco e proteger o acesso |
| 5 | `index.html` usa `https://yourdomain.com/` em `canonical`, `og:*` e JSON-LD; `sitemap.xml`/`robots.txt` usam `secti-territorios.vercel.app` | O domínio de produção observado é `territorios-secti.vercel.app`. Alinhar para SEO e pré-visualização em redes sociais |
| 6 | `README.md` descreve uma versão antiga (componente único `PtiMap`) | Substituído por esta documentação |
| 7 | `src/App.jsx` exporta `useDadosSupabase` (consulta `stats_ti`) sem uso | Código morto; remover ou reaproveitar |
| 8 | `src/components/KpiCard.jsx` usa classes CSS inexistentes e não é importado | Código morto |
| 9 | Regra `.print\\:hidden` em `index.css` está com barra dupla | Sem efeito; o Tailwind já gera `print:hidden` |
| 10 | Chave publishable e URL do Supabase escritas no código como padrão | Aceitável (são públicas), mas dependem de RLS bem configurada |
