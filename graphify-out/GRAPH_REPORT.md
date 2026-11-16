# Graph Report - TERRITORIOS_SECTI  (2026-11-16)

## Corpus Check
- 114 files · ~170,116 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 733 nodes · 2310 edges · 42 communities (28 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `35b5f09c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- DashboardPainel.jsx
- AdminPage.jsx
- SideMap.jsx
- dependencies
- exportReportClient.js
- Design System SECTI Territorios (Bento Grid)
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- SISTEMA.md Documentacao do Sistema
- RelatorioPage.jsx
- App.jsx
- @fontsource-variable/plus-jakarta-sans
- playwright-core
- capture-redesign.mjs
- generateJson.mjs
- package.json
- @radix-ui/react-dropdown-menu
- vercel.json
- react-helmet-async
- simplify-topojson.mjs
- @sparticuz/chromium
- supercluster
- react-dom
- react-joyride
- DataContext.jsx
- AUDITORIA.md Auditoria do repositorio
- topojson-client
- AtivosPage.jsx
- CadeiaPage.jsx
- notes
- RelatorioPage.jsx
- Auditoria: secao Paginas e UI
- motion.js
- TourGuide.jsx
- @fontsource-variable/lexend
- @vercel/analytics
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 53 edges
3. `lucide-react` - 38 edges
4. `useTheme()` - 36 edges
5. `SideMap()` - 35 edges
6. `normalize()` - 31 edges
7. `getSemanticColors()` - 29 edges
8. `isMunicipioSemiarido()` - 28 edges
9. `AUDITORIA.md Auditoria do repositorio` - 25 edges
10. `UiShowcasePage()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md

## Import Cycles
- None detected.

## Communities (42 total, 14 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (69): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, framer-motion, lucide-react, @radix-ui/react-dialog, react, FontesReferenciasSection(), ICONES_CATEGORIA, indicadoresEstrategicos (+61 more)

### Community 1 - "DashboardPainel.jsx"
Cohesion: 0.06
Nodes (72): [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Utilitarios src/utils, react-router-dom@^7.17.0, react-to-print@^3.3.0, react-router-dom (+64 more)

### Community 2 - "AdminPage.jsx"
Cohesion: 0.15
Nodes (14): [Alta] /admin e mock publico (CRUD em useState, sem auth), Pagina /admin (maquete sem autenticacao), AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES (+6 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (58): [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, Mapa coropletico da Bahia (escala de azuis), leaflet@^1.9.4, leaflet, react-leaflet, getContrastTextColor(), getSemanticColors(), buildTopologiaPayload() (+50 more)

### Community 4 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, clsx@^2.1.1, @dnd-kit/modifiers@^9.0.0, @dnd-kit/sortable@^10.0.0, framer-motion@^12.43.0, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-tooltip@^1.4.1 (+10 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.17
Nodes (17): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+9 more)

### Community 6 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.11
Nodes (19): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Contraste text-muted e KPI ambar abaixo de AA, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Design System SECTI Territorios (Bento Grid), Acessibilidade e micro-interacoes, Badges semanticos de status (+11 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.19
Nodes (18): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/ (+10 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+8 more)

### Community 11 - "SISTEMA.md Documentacao do Sistema"
Cohesion: 0.16
Nodes (15): Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, SISTEMA.md Documentacao do Sistema, Arquitetura SPA sem backend, somente leitura, Deploy Vercel (cron, headers, rewrites), Variaveis de ambiente, Mapas PtiMap e SideMap (Leaflet), Pontos de atencao conhecidos (10 itens) (+7 more)

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.12
Nodes (29): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, CardLista(), addCountedEntry(), buildEntitySearchData(), deduplicateSuggestions(), getNormalizedCharMap(), IGNORED_SEARCH_VALUES (+21 more)

### Community 13 - "App.jsx"
Cohesion: 0.10
Nodes (37): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+29 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "package.json"
Cohesion: 0.15
Nodes (12): @dnd-kit/core@^6.3.1, @dnd-kit/utilities@^3.2.2, recharts@^3.10.1, vite-plugin-node-polyfills@^0.28.0, description, name, type, version (+4 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.11
Nodes (16): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+8 more)

### Community 28 - "DataContext.jsx"
Cohesion: 0.11
Nodes (38): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Dados estaticos versionados e consistencia dupla, Glossario (IFDM, CT&I, PTI, EAD, RLS) (+30 more)

### Community 29 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.21
Nodes (5): [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), keep-alive: manter Supabase ativo, ErrorBoundary

### Community 32 - "AtivosPage.jsx"
Cohesion: 0.14
Nodes (3): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, MUNICIPIOS_COORDS

### Community 33 - "CadeiaPage.jsx"
Cohesion: 0.31
Nodes (12): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+4 more)

### Community 34 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 36 - "Auditoria: secao Paginas e UI"
Cohesion: 0.22
Nodes (9): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, Auditoria: secao Paginas e UI, ASSET_DARK_THEME_COLORS, ASSET_THEME_COLORS (+1 more)

### Community 37 - "motion.js"
Cohesion: 0.25
Nodes (7): DURATIONS, EASINGS, fadeIn, fadeUp, scaleIn, SPRING_DEFAULT, SPRING_FLUID

### Community 38 - "TourGuide.jsx"
Cohesion: 0.47
Nodes (3): [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, Pendencias e Excecoes de Redesign

### Community 41 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.40
Nodes (5): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Filtro do Semiarido (278 municipios), Layout, sidebar, scroll navigator e tour guiado, Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado

## Ambiguous Edges - Review These
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Deploy Vercel (cron, headers, rewrites)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 148 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `AtivosPage.jsx`, `CadeiaPage.jsx`, `AdminPage.jsx`, `DashboardPainel.jsx`, `dependencies`, `SideMap.jsx`, `RelatorioPage.jsx`, `TourGuide.jsx`, `RelatorioPage.jsx`, `App.jsx`, `package.json`, `DataContext.jsx`, `AUDITORIA.md Auditoria do repositorio`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `Deploy Vercel (cron, headers, rewrites)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.0756545042259328 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `AtivosPage.jsx`, `CadeiaPage.jsx`, `AdminPage.jsx`, `DashboardPainel.jsx`, `dependencies`, `SideMap.jsx`, `RelatorioPage.jsx`, `TourGuide.jsx`, `Auditoria: secao Paginas e UI`, `RelatorioPage.jsx`, `App.jsx`, `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `DashboardPainel.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06230847803881512 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._