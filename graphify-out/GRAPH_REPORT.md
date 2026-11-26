# Graph Report - TERRITORIOS_SECTI  (2026-11-26)

## Corpus Check
- 132 files · ~187,117 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 804 nodes · 2596 edges · 44 communities (31 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c39350f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- exportReportClient.js
- AccessibilityBar.jsx
- SideMap.jsx
- dependencies
- exportReportClient.js
- AtivosPage.jsx
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- testReactToPrintComparison.mjs
- RelatorioPage.jsx
- App.jsx
- @dnd-kit/utilities@^3.2.2
- InstituicoesPage.jsx
- capture-redesign.mjs
- generateJson.mjs
- Design System SECTI Territorios (Bento Grid)
- TelemetryContext.jsx
- vercel.json
- AdminPage.jsx
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- @vercel/analytics@^2.0.1
- xlsx
- Histórico Local de Migrations — `db_territorios` (`vicaqpcluxkwbbbwdpkg`)
- @fontsource-variable/lexend
- DataContext.jsx
- DashboardPainel.jsx
- AUDITORIA.md Auditoria do repositorio
- playwright
- package.json
- motion.js
- Arquitetura SPA sem backend, somente leitura
- notes
- @dnd-kit/modifiers@^9.0.0
- @fontsource-variable/lexend
- @radix-ui/react-dropdown-menu
- supercluster
- topojson-client
- vite-plugin-node-polyfills

## God Nodes (most connected - your core abstractions)
1. `react` - 66 edges
2. `cn()` - 59 edges
3. `lucide-react` - 41 edges
4. `normalize()` - 38 edges
5. `useTheme()` - 37 edges
6. `SideMap()` - 31 edges
7. `getSemanticColors()` - 30 edges
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
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md
- `README Painel Territorial CT&I` --references--> `SISTEMA.md Documentacao do Sistema`  [EXTRACTED]
  README.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Communities (44 total, 13 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (67): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, @radix-ui/react-dialog, react, LoginPage(), FontesReferenciasSection() (+59 more)

### Community 1 - "exportReportClient.js"
Cohesion: 0.06
Nodes (67): [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom, react-to-print, DARK_BLUE_PALETTE (+59 more)

### Community 2 - "AccessibilityBar.jsx"
Cohesion: 0.26
Nodes (11): AccessibilityBar(), applyRootPreferences(), focusFirstMatching(), FONT_SCALES, jumpToMainContent(), jumpToNavigation(), jumpToSearch(), readStoredContrast() (+3 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (59): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapas PtiMap e SideMap (Leaflet), leaflet, react-leaflet (+51 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @dnd-kit/core@^6.3.1, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, playwright-core@^1.63.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-tooltip@^1.4.1 (+13 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.16
Nodes (18): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+10 more)

### Community 6 - "AtivosPage.jsx"
Cohesion: 0.12
Nodes (16): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant() (+8 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.22
Nodes (5): __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 8 - "captureReports.mjs"
Cohesion: 0.24
Nodes (13): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright() (+5 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+8 more)

### Community 11 - "testReactToPrintComparison.mjs"
Cohesion: 0.10
Nodes (19): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename (+11 more)

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.09
Nodes (39): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, CardLista(), MUN_LOOKUP, cleanIes(), findMunicipioCoords(), getTipoCadeiaConfig(), MUN_LOOKUP (+31 more)

### Community 13 - "App.jsx"
Cohesion: 0.08
Nodes (31): [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage (+23 more)

### Community 15 - "InstituicoesPage.jsx"
Cohesion: 0.18
Nodes (16): ICT_FILTER_OPTIONS, ICT_STATUS_META, IctStatusBadge(), InstituicoesPage(), SAMPLE_ATIVOS, SAMPLE_INSTITUICOES, buildAtivosByInstituicaoMap(), computeInstituicoesAnalytics() (+8 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.13
Nodes (16): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+8 more)

### Community 19 - "TelemetryContext.jsx"
Cohesion: 0.16
Nodes (23): ProtectedRoute(), AuthContext, AuthProvider(), useAuth(), TelemetryContext, TelemetryProvider(), supabase, supabasePublic (+15 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "AdminPage.jsx"
Cohesion: 0.11
Nodes (21): AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES, DEFAULT_CURSO_CATEGORIES, FieldError() (+13 more)

### Community 22 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.29
Nodes (7): [Alta] /admin e mock publico (CRUD em useState, sem auth), [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Pagina /admin (maquete sem autenticacao), Filtro do Semiarido (278 municipios), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils

### Community 26 - "Histórico Local de Migrations — `db_territorios` (`vicaqpcluxkwbbbwdpkg`)"
Cohesion: 0.50
Nodes (3): Alerta Operacional, Contexto do Schema Legado, Histórico Local de Migrations — `db_territorios` (`vicaqpcluxkwbbbwdpkg`)

### Community 28 - "DataContext.jsx"
Cohesion: 0.14
Nodes (31): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio, Limites de paginacao .range vs max rows 1000 (+23 more)

### Community 29 - "DashboardPainel.jsx"
Cohesion: 0.15
Nodes (15): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, Auditoria: secao Paginas e UI, Acessibilidade e micro-interacoes (+7 more)

### Community 30 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.18
Nodes (15): AUDITORIA.md Auditoria do repositorio, [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition (+7 more)

### Community 33 - "playwright"
Cohesion: 0.25
Nodes (4): playwright@^1.62.1, playwright, launchChromium(), test()

### Community 34 - "package.json"
Cohesion: 0.13
Nodes (14): clsx@^2.1.1, @dnd-kit/sortable@^10.0.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, @sparticuz/chromium@^153.0.0, @supabase/supabase-js@^2.112.3, description, name, type (+6 more)

### Community 36 - "motion.js"
Cohesion: 0.29
Nodes (6): DURATIONS, EASINGS, fadeIn, scaleIn, SPRING_DEFAULT, SPRING_FLUID

### Community 39 - "Arquitetura SPA sem backend, somente leitura"
Cohesion: 0.67
Nodes (3): Arquitetura SPA sem backend, somente leitura, Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro)

### Community 40 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

## Ambiguous Edges - Review These
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens`, `Workflow frontend.md (regras de acabamento)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 164 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `exportReportClient.js`, `package.json`, `AccessibilityBar.jsx`, `dependencies`, `SideMap.jsx`, `AtivosPage.jsx`, `RelatorioPage.jsx`, `App.jsx`, `InstituicoesPage.jsx`, `TelemetryContext.jsx`, `AdminPage.jsx`, `DataContext.jsx`, `DashboardPainel.jsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **What connects `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07973911213970124 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `exportReportClient.js`, `package.json`, `AccessibilityBar.jsx`, `dependencies`, `SideMap.jsx`, `AtivosPage.jsx`, `RelatorioPage.jsx`, `App.jsx`, `InstituicoesPage.jsx`, `AdminPage.jsx`, `DashboardPainel.jsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Should `exportReportClient.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06386554621848739 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._