# Graph Report - TERRITORIOS_SECTI  (2026-11-19)

## Corpus Check
- 122 files · ~178,944 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 769 nodes · 2510 edges · 39 communities (26 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d52d2695`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- exportReportClient.js
- main.jsx
- SideMap.jsx
- @dnd-kit/core@^6.3.1
- Design System SECTI Territorios (Bento Grid)
- RelatorioPage.jsx
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- AccessibilityBar.jsx
- RelatorioPage.jsx
- App.jsx
- DataContext.jsx
- dependencies
- capture-redesign.mjs
- generateJson.mjs
- CursosPage.jsx
- notes
- vercel.json
- clsx
- simplify-topojson.mjs
- TelemetryContext.jsx
- AUDITORIA.md Auditoria do repositorio
- ThemeContext.jsx
- @fontsource-variable/lexend
- AdminPage.jsx
- playwright-core
- topojson-client
- react-helmet-async
- supercluster
- react-joyride
- @radix-ui/react-dropdown-menu
- xlsx
- @radix-ui/react-tooltip
- @sparticuz/chromium

## God Nodes (most connected - your core abstractions)
1. `react` - 65 edges
2. `cn()` - 59 edges
3. `lucide-react` - 40 edges
4. `SideMap()` - 36 edges
5. `useTheme()` - 36 edges
6. `normalize()` - 35 edges
7. `getSemanticColors()` - 29 edges
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
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Communities (39 total, 13 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (70): Layout, sidebar, scroll navigator e tour guiado, framer-motion, @radix-ui/react-dialog, react, react-router-dom, LoginPage(), ProtectedRoute(), FontesReferenciasSection() (+62 more)

### Community 1 - "exportReportClient.js"
Cohesion: 0.17
Nodes (16): html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf(), downloadCanvasAsPng() (+8 more)

### Community 2 - "main.jsx"
Cohesion: 0.21
Nodes (5): [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), keep-alive: manter Supabase ativo, ErrorBoundary

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (58): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, Mapa coropletico da Bahia (escala de azuis), leaflet@^1.9.4, leaflet, react-leaflet, getContrastTextColor(), getSemanticColors() (+50 more)

### Community 5 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.13
Nodes (15): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+7 more)

### Community 6 - "RelatorioPage.jsx"
Cohesion: 0.06
Nodes (61): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador (+53 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.21
Nodes (12): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright(), __dirname (+4 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.13
Nodes (20): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+12 more)

### Community 11 - "AccessibilityBar.jsx"
Cohesion: 0.26
Nodes (11): AccessibilityBar(), applyRootPreferences(), focusFirstMatching(), FONT_SCALES, jumpToMainContent(), jumpToNavigation(), jumpToSearch(), readStoredContrast() (+3 more)

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.12
Nodes (32): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, vitest, CardLista(), MUN_LOOKUP, MUN_LOOKUP, addCountedEntry(), deduplicateSuggestions() (+24 more)

### Community 13 - "App.jsx"
Cohesion: 0.13
Nodes (26): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+18 more)

### Community 14 - "DataContext.jsx"
Cohesion: 0.11
Nodes (38): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio (+30 more)

### Community 15 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @dnd-kit/modifiers@^9.0.0, @dnd-kit/sortable@^10.0.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1, react@^18.3.1 (+15 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "CursosPage.jsx"
Cohesion: 0.08
Nodes (48): [Media] lib/format.js nao usado (~38 formatacoes manuais), react-to-print, recharts, DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), DARK_BLUE_PALETTE (+40 more)

### Community 19 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.11
Nodes (16): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+8 more)

### Community 24 - "TelemetryContext.jsx"
Cohesion: 0.25
Nodes (17): TelemetryContext, TelemetryProvider(), aggregateTelemetryMetrics(), clearTelemetryEvents(), computeDatabaseHealth(), createTelemetryEvent(), CRUD_ACTION_LABELS, CRUD_ENTITY_LABELS (+9 more)

### Community 25 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.16
Nodes (16): AUDITORIA.md Auditoria do repositorio, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, SISTEMA.md Documentacao do Sistema (+8 more)

### Community 26 - "ThemeContext.jsx"
Cohesion: 0.25
Nodes (7): [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, Arquitetura SPA sem backend, somente leitura, Mapas PtiMap e SideMap (Leaflet), Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro), ExportPdfButton(), ThemeContext

### Community 28 - "AdminPage.jsx"
Cohesion: 0.07
Nodes (29): [Alta] /admin e mock publico (CRUD em useState, sem auth), Pagina /admin (maquete sem autenticacao), AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES (+21 more)

### Community 30 - "topojson-client"
Cohesion: 0.33
Nodes (4): @dnd-kit/utilities@^3.2.2, topojson-client@^3.1.0, @dnd-kit/utilities, topojson-client

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 162 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `main.jsx`, `SideMap.jsx`, `RelatorioPage.jsx`, `devDependencies`, `AccessibilityBar.jsx`, `RelatorioPage.jsx`, `App.jsx`, `DataContext.jsx`, `dependencies`, `CursosPage.jsx`, `TelemetryContext.jsx`, `ThemeContext.jsx`, `AdminPage.jsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07454863133372161 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `RelatorioPage.jsx` to `react`, `SideMap.jsx`, `devDependencies`, `AccessibilityBar.jsx`, `RelatorioPage.jsx`, `DataContext.jsx`, `dependencies`, `CursosPage.jsx`, `ThemeContext.jsx`, `AdminPage.jsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09192546583850932 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._