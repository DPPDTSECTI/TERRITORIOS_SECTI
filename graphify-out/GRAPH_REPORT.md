# Graph Report - TERRITORIOS_SECTI  (2026-11-23)

## Corpus Check
- 123 files · ~179,158 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 777 nodes · 2540 edges · 44 communities (31 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b374dca2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- exportReportClient.js
- AtivosPage.jsx
- SideMap.jsx
- dependencies
- exportReportClient.js
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- playwright
- captureReports.mjs
- scripts
- devDependencies
- testReactToPrintComparison.mjs
- RelatorioPage.jsx
- App.jsx
- package.json
- @radix-ui/react-tooltip
- capture-redesign.mjs
- generateJson.mjs
- MonitoringPanel.jsx
- TelemetryContext.jsx
- vercel.json
- AdminPage.jsx
- ThemeContext.jsx
- supercluster
- topojson-client
- AccessibilityBar.jsx
- @fontsource-variable/lexend
- DataContext.jsx
- @vercel/analytics
- AUDITORIA.md Auditoria do repositorio
- xlsx
- RelatorioPage.jsx
- react-joyride
- [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas
- CadeiaPage.jsx
- testReactToPrintComparison.mjs
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- ErrorBoundary
- @dnd-kit/modifiers@^9.0.0
- @dnd-kit/utilities@^3.2.2
- @fontsource-variable/plus-jakarta-sans

## God Nodes (most connected - your core abstractions)
1. `react` - 65 edges
2. `cn()` - 59 edges
3. `lucide-react` - 40 edges
4. `useTheme()` - 37 edges
5. `normalize()` - 35 edges
6. `SideMap()` - 35 edges
7. `getSemanticColors()` - 30 edges
8. `isMunicipioSemiarido()` - 28 edges
9. `CadeiaPage()` - 25 edges
10. `AUDITORIA.md Auditoria do repositorio` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `Dados estaticos versionados e consistencia dupla` --semantically_similar_to--> `Dados estaticos embutidos`  [INFERRED] [semantically similar]
  docs/INGESTAO-DE-DADOS.md → docs/SISTEMA.md
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md

## Import Cycles
- None detected.

## Communities (44 total, 13 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (69): Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, @radix-ui/react-dialog, react, react-router-dom, LoginPage(), ProtectedRoute() (+61 more)

### Community 1 - "exportReportClient.js"
Cohesion: 0.06
Nodes (70): [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos embutidos, react-to-print@^3.3.0, recharts@^3.10.1, react-to-print, recharts (+62 more)

### Community 2 - "AtivosPage.jsx"
Cohesion: 0.13
Nodes (4): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, MUNICIPIOS_COORDS

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (62): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapas PtiMap e SideMap (Leaflet), leaflet, react-leaflet (+54 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, clsx@^2.1.1, @dnd-kit/sortable@^10.0.0, @fontsource-variable/lexend@^5.3.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1 (+12 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.16
Nodes (18): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+10 more)

### Community 6 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.13
Nodes (16): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+8 more)

### Community 7 - "playwright"
Cohesion: 0.25
Nodes (4): playwright@^1.62.1, playwright, launchChromium(), test()

### Community 8 - "captureReports.mjs"
Cohesion: 0.22
Nodes (14): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright) (+6 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+8 more)

### Community 11 - "testReactToPrintComparison.mjs"
Cohesion: 0.10
Nodes (16): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+8 more)

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.13
Nodes (30): [Alta] reportAggregation e funcoes de normalization so usados por testes, vitest, CardLista(), addCountedEntry(), buildEntitySearchData(), deduplicateSuggestions(), getNormalizedCharMap(), IGNORED_SEARCH_VALUES (+22 more)

### Community 13 - "App.jsx"
Cohesion: 0.10
Nodes (28): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+20 more)

### Community 14 - "package.json"
Cohesion: 0.13
Nodes (14): @dnd-kit/core@^6.3.1, playwright-core@^1.63.0, @radix-ui/react-tooltip@^1.4.1, react-helmet-async@^3.0.0, @supabase/supabase-js@^2.112.3, description, name, type (+6 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "MonitoringPanel.jsx"
Cohesion: 0.13
Nodes (16): CATEGORY_FILTERS, formatDateTime(), getCategoryBadge(), getDeviceIcon(), getRoleBadgeClass(), MonitoringPanel(), SUB_VIEW_OPTIONS, useTelemetry() (+8 more)

### Community 19 - "TelemetryContext.jsx"
Cohesion: 0.25
Nodes (17): TelemetryContext, TelemetryProvider(), aggregateTelemetryMetrics(), clearTelemetryEvents(), computeDatabaseHealth(), createTelemetryEvent(), CRUD_ACTION_LABELS, CRUD_ENTITY_LABELS (+9 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "AdminPage.jsx"
Cohesion: 0.20
Nodes (14): [Alta] /admin e mock publico (CRUD em useState, sem auth), Pagina /admin (maquete sem autenticacao), AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES (+6 more)

### Community 22 - "ThemeContext.jsx"
Cohesion: 0.29
Nodes (5): Arquitetura SPA sem backend, somente leitura, Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro), ExportPdfButton(), ThemeContext

### Community 26 - "AccessibilityBar.jsx"
Cohesion: 0.26
Nodes (11): AccessibilityBar(), applyRootPreferences(), focusFirstMatching(), FONT_SCALES, jumpToMainContent(), jumpToNavigation(), jumpToSearch(), readStoredContrast() (+3 more)

### Community 28 - "DataContext.jsx"
Cohesion: 0.11
Nodes (39): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Dados estaticos versionados e consistencia dupla (+31 more)

### Community 30 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.14
Nodes (17): AUDITORIA.md Auditoria do repositorio, [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema (+9 more)

### Community 33 - "RelatorioPage.jsx"
Cohesion: 0.15
Nodes (3): MUN_LOOKUP, SEMIARIDO_MUNICIPIOS, DataContext

### Community 34 - "react-joyride"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 35 - "[Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas"
Cohesion: 0.21
Nodes (11): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Auditoria: secao Paginas e UI (+3 more)

### Community 36 - "CadeiaPage.jsx"
Cohesion: 0.33
Nodes (11): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), MUN_LOOKUP, normalizeName() (+3 more)

### Community 37 - "testReactToPrintComparison.mjs"
Cohesion: 0.33
Nodes (5): __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 38 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.40
Nodes (5): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Filtro do Semiarido (278 municipios), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils

## Ambiguous Edges - Review These
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 159 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `exportReportClient.js`, `AtivosPage.jsx`, `SideMap.jsx`, `dependencies`, `CadeiaPage.jsx`, `RelatorioPage.jsx`, `RelatorioPage.jsx`, `App.jsx`, `package.json`, `MonitoringPanel.jsx`, `TelemetryContext.jsx`, `AdminPage.jsx`, `ThemeContext.jsx`, `AccessibilityBar.jsx`, `DataContext.jsx`, `AUDITORIA.md Auditoria do repositorio`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07617625093353249 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `exportReportClient.js`, `AtivosPage.jsx`, `SideMap.jsx`, `dependencies`, `CadeiaPage.jsx`, `RelatorioPage.jsx`, `RelatorioPage.jsx`, `App.jsx`, `package.json`, `MonitoringPanel.jsx`, `AdminPage.jsx`, `ThemeContext.jsx`, `AccessibilityBar.jsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `exportReportClient.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061213579256883185 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._