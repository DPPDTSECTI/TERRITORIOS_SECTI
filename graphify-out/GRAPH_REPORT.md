# Graph Report - TERRITORIOS_SECTI  (2026-11-17)

## Corpus Check
- 114 files · ~170,164 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 733 nodes · 2307 edges · 38 communities (24 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3b457bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- DashboardPainel.jsx
- CadeiaPage.jsx
- SideMap.jsx
- dependencies
- exportReportClient.js
- Design System SECTI Territorios (Bento Grid)
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- exportarDados.mjs
- RelatorioPage.jsx
- App.jsx
- ErrorBoundary
- react-dom
- capture-redesign.mjs
- generateJson.mjs
- @dnd-kit/core@^6.3.1
- @radix-ui/react-dropdown-menu
- vercel.json
- @supabase/supabase-js
- simplify-topojson.mjs
- clsx
- topojson-client
- AccessibilityBar.jsx
- react-joyride
- DataContext.jsx
- main.jsx
- @fontsource-variable/lexend
- SISTEMA.md Documentacao do Sistema
- notes
- vite-plugin-node-polyfills
- @dnd-kit/modifiers@^9.0.0
- @dnd-kit/sortable@^10.0.0
- playwright-core

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 53 edges
3. `lucide-react` - 38 edges
4. `useTheme()` - 37 edges
5. `SideMap()` - 35 edges
6. `normalize()` - 31 edges
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
- `[Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL` --conceptually_related_to--> `selectedTerritory compartilhado`  [INFERRED]
  docs/AUDITORIA.md → docs/SISTEMA.md
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md

## Import Cycles
- None detected.

## Communities (38 total, 14 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (65): Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, @radix-ui/react-dialog, react, FontesReferenciasSection(), ICONES_CATEGORIA, indicadoresEstrategicos (+57 more)

### Community 1 - "DashboardPainel.jsx"
Cohesion: 0.07
Nodes (71): [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, react-router-dom, react-to-print, recharts, DashboardPainel() (+63 more)

### Community 2 - "CadeiaPage.jsx"
Cohesion: 0.05
Nodes (47): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Alta] /admin e mock publico (CRUD em useState, sem auth), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL (+39 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (54): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, Mapa coropletico da Bahia (escala de azuis), leaflet@^1.9.4, leaflet, react-leaflet, DARK_CHART_PALETTE, buildTopologiaPayload() (+46 more)

### Community 4 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @dnd-kit/utilities@^3.2.2, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-tooltip@^1.4.1, react@^18.3.1 (+13 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.13
Nodes (21): Exportacoes com tema claro forcado, Filtro do Semiarido (278 municipios), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas (+13 more)

### Community 6 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.14
Nodes (15): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional, Menu lateral dock vertical (+7 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (10): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+2 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.22
Nodes (14): handler(), handler(), [Alta] reportAggregation e funcoes de normalization so usados por testes, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist (+6 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.13
Nodes (20): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+12 more)

### Community 11 - "exportarDados.mjs"
Cohesion: 0.22
Nodes (8): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, xlsx@^0.18.5, xlsx, __dirname, __filename, projectRoot

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.11
Nodes (35): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, MUN_LOOKUP, cleanIes(), findMunicipioCoords(), getTipoCadeiaConfig(), MUN_LOOKUP, RelatorioPage() (+27 more)

### Community 13 - "App.jsx"
Cohesion: 0.11
Nodes (28): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+20 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.14
Nodes (12): README Painel Territorial CT&I, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT (+4 more)

### Community 24 - "clsx"
Cohesion: 0.33
Nodes (4): clsx@^2.1.1, @sparticuz/chromium@^153.0.0, clsx, @sparticuz/chromium

### Community 26 - "AccessibilityBar.jsx"
Cohesion: 0.26
Nodes (11): AccessibilityBar(), applyRootPreferences(), focusFirstMatching(), FONT_SCALES, jumpToMainContent(), jumpToNavigation(), jumpToSearch(), readStoredContrast() (+3 more)

### Community 28 - "DataContext.jsx"
Cohesion: 0.09
Nodes (44): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas) (+36 more)

### Community 29 - "main.jsx"
Cohesion: 0.21
Nodes (11): AUDITORIA.md Auditoria do repositorio, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema, Deploy Vercel (cron, headers, rewrites) (+3 more)

### Community 32 - "SISTEMA.md Documentacao do Sistema"
Cohesion: 0.25
Nodes (8): [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, Arquitetura SPA sem backend, somente leitura, Variaveis de ambiente, Mapas PtiMap e SideMap (Leaflet), Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro), Painel Territorial CT&I SECTI Bahia, supabase

### Community 34 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

## Ambiguous Edges - Review These
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 147 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DashboardPainel.jsx`, `CadeiaPage.jsx`, `SideMap.jsx`, `dependencies`, `devDependencies`, `RelatorioPage.jsx`, `App.jsx`, `AccessibilityBar.jsx`, `DataContext.jsx`, `main.jsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07973124300111982 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `DashboardPainel.jsx`, `CadeiaPage.jsx`, `SideMap.jsx`, `dependencies`, `devDependencies`, `RelatorioPage.jsx`, `App.jsx`, `AccessibilityBar.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `DashboardPainel.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06920326864147089 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._