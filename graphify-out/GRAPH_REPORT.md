# Graph Report - TERRITORIOS_SECTI  (2026-11-16)

## Corpus Check
- 114 files · ~169,999 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
<<<<<<< HEAD
- 702 nodes · 2295 edges · 33 communities (21 shown, 12 thin omitted)
=======
- 736 nodes · 2316 edges · 41 communities (32 shown, 9 thin omitted)
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
<<<<<<< HEAD
- Built from commit: `03c7a853`
=======
- Built from commit: `55f1250a`
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
<<<<<<< HEAD
- SideMap.jsx
- AUDITORIA.md Auditoria do repositorio
=======
- RelatorioCadeias.jsx
- AtivosPage.jsx
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819
- SideMap.jsx
- dependencies
- main.jsx
- CadeiaPage.jsx
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
<<<<<<< HEAD
- [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo
- normalize
- App.jsx
- @fontsource-variable/plus-jakarta-sans
- recharts
- capture-redesign.mjs
- generateJson.mjs
- @vercel/analytics
- vite-plugin-node-polyfills
- vercel.json
- clientExport.js
- simplify-topojson.mjs
- @supabase/supabase-js
- playwright-core
- DataContext.jsx
- @sparticuz/chromium
- supercluster
- topojson-client
- notes
=======
- supabase.js
- RelatorioPage.jsx
- App.jsx
- RelatorioPage.jsx
- DashboardPainel.jsx
- capture-redesign.mjs
- generateJson.mjs
- package.json
- @radix-ui/react-dropdown-menu
- vercel.json
- useTheme
- simplify-topojson.mjs
- AdminPage.jsx
- @supabase/supabase-js
- react-dom
- react-joyride
- DataContext.jsx
- AUDITORIA.md Auditoria do repositorio
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- chartTheme.js
- CadeiaPage.jsx
- notes
- RelatorioAtivos.jsx
- motion.js
- referenciasDB.js
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819
- @dnd-kit/sortable@^10.0.0
- @fontsource-variable/lexend
- @vercel/analytics

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 53 edges
3. `lucide-react` - 38 edges
4. `SideMap()` - 36 edges
5. `useTheme()` - 36 edges
6. `normalize()` - 31 edges
7. `getSemanticColors()` - 29 edges
8. `isMunicipioSemiarido()` - 28 edges
9. `AUDITORIA.md Auditoria do repositorio` - 25 edges
10. `CadeiaPage()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` --semantically_similar_to--> `Limites de paginacao .range vs max rows 1000`  [INFERRED] [semantically similar]
  docs/AUDITORIA.md → docs/INGESTAO-DE-DADOS.md
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md

## Import Cycles
- None detected.

<<<<<<< HEAD
## Communities (33 total, 12 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (89): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, framer-motion, lucide-react, @radix-ui/react-dialog, react, AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel() (+81 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.06
Nodes (75): [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Utilitarios src/utils, react-router-dom@^7.17.0, react-to-print@^3.3.0 (+67 more)

### Community 2 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.17
Nodes (19): AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador (+11 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (56): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapas PtiMap e SideMap (Leaflet), leaflet, react-leaflet, buildTopologiaPayload() (+48 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, clsx@^2.1.1, @dnd-kit/core@^6.3.1, @dnd-kit/modifiers@^9.0.0, @dnd-kit/utilities@^3.2.2, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0 (+17 more)

### Community 5 - "main.jsx"
Cohesion: 0.21
Nodes (5): [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), keep-alive: manter Supabase ativo, ErrorBoundary

### Community 6 - "CadeiaPage.jsx"
Cohesion: 0.07
Nodes (41): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] /admin e mock publico (CRUD em useState, sem auth), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo (+33 more)
=======
## Communities (41 total, 9 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (62): framer-motion, @radix-ui/react-dialog, react, FontesReferenciasSection(), ICONES_CATEGORIA, indicadoresEstrategicos, LandingHero(), modulosPlataforma (+54 more)

### Community 1 - "RelatorioCadeias.jsx"
Cohesion: 0.15
Nodes (22): formatTerritoryName(), StackedBarChart(), CADEIA_CATEGORIES, CADEIA_PRESENCA_CATEGORIES, findMunicipioCoords(), initialPdfCadeiasSemantic, isMunicipioInTerritory(), MUN_LOOKUP (+14 more)

### Community 2 - "AtivosPage.jsx"
Cohesion: 0.10
Nodes (8): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Filtro do Semiarido (278 municipios), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils, getContrastTextColor()

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (55): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapa coropletico da Bahia (escala de azuis), Mapas PtiMap e SideMap (Leaflet), leaflet (+47 more)

### Community 4 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, clsx@^2.1.1, @dnd-kit/modifiers@^9.0.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1 (+14 more)

### Community 5 - "clientExport.js"
Cohesion: 0.31
Nodes (8): html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf(), downloadCanvasAsPng()

### Community 6 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.08
Nodes (26): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+18 more)
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.20
Nodes (13): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright() (+5 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
<<<<<<< HEAD
Cohesion: 0.13
Nodes (20): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+12 more)

### Community 11 - "[Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo"
Cohesion: 0.40
Nodes (4): [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Dark mode proporcional, Tokens de cor e CSS variables, Convencoes de interface (desktop only, tokens, min-w-0)

### Community 12 - "normalize"
Cohesion: 0.10
Nodes (33): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, CardLista(), cleanIes(), findMunicipioCoords(), getTipoCadeiaConfig(), MUN_LOOKUP, RelatorioPage() (+25 more)
=======
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+8 more)

### Community 11 - "supabase.js"
Cohesion: 0.22
Nodes (9): [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, Arquitetura SPA sem backend, somente leitura, Variaveis de ambiente, Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro), README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images) (+1 more)

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.12
Nodes (32): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), Normalizacao de nomes (normalize), vitest, CardLista(), MUN_LOOKUP, addCountedEntry(), buildEntitySearchData(), deduplicateSuggestions() (+24 more)
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819

### Community 13 - "App.jsx"
Cohesion: 0.10
Nodes (36): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+28 more)

### Community 14 - "RelatorioPage.jsx"
Cohesion: 0.12
Nodes (23): [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, cleanIes(), MUN_LOOKUP (+15 more)

### Community 15 - "DashboardPainel.jsx"
Cohesion: 0.21
Nodes (19): [Media] lib/format.js nao usado (~38 formatacoes manuais), lucide-react, DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), useChartTheme(), CustomPieChart() (+11 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "package.json"
Cohesion: 0.12
Nodes (16): @dnd-kit/core@^6.3.1, @dnd-kit/utilities@^3.2.2, playwright-core@^1.63.0, recharts@^3.10.1, supercluster@^9.0.0, topojson-client@^3.1.0, description, name (+8 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

<<<<<<< HEAD
### Community 21 - "clientExport.js"
Cohesion: 0.27
Nodes (9): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+1 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.10
Nodes (19): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename (+11 more)

### Community 29 - "DataContext.jsx"
Cohesion: 0.10
Nodes (37): INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Dados estaticos versionados e consistencia dupla, Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio, Limites de paginacao .range vs max rows 1000, Mapa TopoJSON e simplify-map (+29 more)

### Community 34 - "notes"
Cohesion: 0.19
Nodes (7): @fontsource-variable/lexend@^5.3.0, react-helmet-async@^3.0.0, notes, tailwind, topojson, @fontsource-variable/lexend, react-helmet-async
=======
### Community 21 - "useTheme"
Cohesion: 0.15
Nodes (17): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, Auditoria: secao Paginas e UI, Acessibilidade e micro-interacoes (+9 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.11
Nodes (16): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+8 more)

### Community 24 - "AdminPage.jsx"
Cohesion: 0.14
Nodes (14): [Alta] /admin e mock publico (CRUD em useState, sem auth), Pagina /admin (maquete sem autenticacao), AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES (+6 more)

### Community 28 - "DataContext.jsx"
Cohesion: 0.34
Nodes (14): DataProvider(), applyCadeiasDistribuicaoPatch(), applyCrudPatch(), clearCrudDraft(), countDraftChanges(), createEmptyDraft(), CRUD_DRAFT_STORAGE_KEY, CRUD_ENTITIES (+6 more)

### Community 29 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.16
Nodes (12): AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema, Deploy Vercel (cron, headers, rewrites) (+4 more)

### Community 30 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.21
Nodes (16): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio, Limites de paginacao .range vs max rows 1000 (+8 more)

### Community 32 - "chartTheme.js"
Cohesion: 0.18
Nodes (10): [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, DARK_BLUE_PALETTE, getSemanticColors(), LIGHT_BLUE_PALETTE, LIGHT_CHART_PALETTE, resolveCssHex(), resolveCssPalette(), getTipoCadeiaConfig() (+2 more)

### Community 33 - "CadeiaPage.jsx"
Cohesion: 0.33
Nodes (11): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+3 more)

### Community 34 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 35 - "RelatorioAtivos.jsx"
Cohesion: 0.40
Nodes (9): react-to-print@^3.3.0, react-to-print, checkSemiaridoValue(), formatTipoUnificado(), getRedeInfo(), getRnpTargetCategory(), MUN_LOOKUP, normalizeName() (+1 more)

### Community 36 - "motion.js"
Cohesion: 0.25
Nodes (7): DURATIONS, EASINGS, fadeIn, fadeUp, scaleIn, SPRING_DEFAULT, SPRING_FLUID

### Community 37 - "referenciasDB.js"
Cohesion: 0.29
Nodes (6): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, CATEGORIAS_REFERENCIAS, FONTES_METADADOS, REFERENCIAS_DATABASE, SUBCATEGORIAS_REFERENCIAS
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819

## Ambiguous Edges - Review These
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
<<<<<<< HEAD
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 141 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
=======
- **7 isolated node(s):** `Deploy Vercel (cron, headers, rewrites)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

<<<<<<< HEAD
- **Why does `react` connect `react` to `SideMap.jsx`, `SideMap.jsx`, `dependencies`, `main.jsx`, `CadeiaPage.jsx`, `devDependencies`, `normalize`, `App.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05915324985092427 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `SideMap.jsx`, `dependencies`, `CadeiaPage.jsx`, `devDependencies`, `normalize`, `App.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06139512661251792 - nodes in this community are weakly interconnected._
=======
- **Why does `react` connect `react` to `chartTheme.js`, `CadeiaPage.jsx`, `AtivosPage.jsx`, `RelatorioCadeias.jsx`, `dependencies`, `SideMap.jsx`, `RelatorioAtivos.jsx`, `RelatorioPage.jsx`, `App.jsx`, `RelatorioPage.jsx`, `DashboardPainel.jsx`, `package.json`, `useTheme`, `AdminPage.jsx`, `DataContext.jsx`, `AUDITORIA.md Auditoria do repositorio`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **What connects `Deploy Vercel (cron, headers, rewrites)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08385579937304075 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `DashboardPainel.jsx` to `react`, `CadeiaPage.jsx`, `AtivosPage.jsx`, `chartTheme.js`, `dependencies`, `SideMap.jsx`, `RelatorioAtivos.jsx`, `RelatorioCadeias.jsx`, `RelatorioPage.jsx`, `App.jsx`, `RelatorioPage.jsx`, `package.json`, `useTheme`, `AdminPage.jsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `RelatorioCadeias.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1452991452991453 - nodes in this community are weakly interconnected._
>>>>>>> a15899817e4bd8c878e7aaf3def998545b424819

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._