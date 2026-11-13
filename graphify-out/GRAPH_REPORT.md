# Graph Report - TERRITORIOS_SECTI  (2026-11-13)

## Corpus Check
- 109 files · ~149,217 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 687 nodes · 2126 edges · 37 communities (23 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a29f459f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- optimize-images.mjs
- SideMap.jsx
- dependencies
- DashboardPainel.jsx
- Design System SECTI Territorios (Bento Grid)
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- crudDraft.js
- normalize
- App.jsx
- AccessibilityBar.jsx
- testReactToPrintComparison.mjs
- capture-redesign.mjs
- generateJson.mjs
- clsx
- @dnd-kit/utilities@^3.2.2
- vercel.json
- exportReportClient.js
- simplify-topojson.mjs
- react-dom
- @supabase/supabase-js
- playwright-core
- react-helmet-async
- react-joyride
- DataContext.jsx
- @sparticuz/chromium
- supercluster
- topojson-client
- notes
- xlsx
- @dnd-kit/sortable@^10.0.0

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
2. `cn()` - 51 edges
3. `lucide-react` - 38 edges
4. `useTheme()` - 36 edges
5. `SideMap()` - 34 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `CadeiaPage()` - 23 edges
10. `normalize()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md

## Import Cycles
- None detected.

## Communities (37 total, 14 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (91): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react, AdminPage(), INITIAL_ATIVOS, CadeiaPage() (+83 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.08
Nodes (62): [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom@^7.17.0, react-to-print@^3.3.0, react-router-dom (+54 more)

### Community 2 - "optimize-images.mjs"
Cohesion: 0.29
Nodes (6): __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG, ROOT

### Community 3 - "SideMap.jsx"
Cohesion: 0.08
Nodes (53): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, leaflet, react-leaflet, buildTopologiaPayload(), getCachedBahiaTopologia(), loadBahiaTopologia(), getMapPalette() (+45 more)

### Community 4 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @dnd-kit/core@^6.3.1, @dnd-kit/modifiers@^9.0.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, react@^18.3.1 (+10 more)

### Community 5 - "DashboardPainel.jsx"
Cohesion: 0.20
Nodes (16): [Media] lib/format.js nao usado (~38 formatacoes manuais), DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), DARK_BLUE_PALETTE, DARK_CHART_PALETTE, LIGHT_BLUE_PALETTE (+8 more)

### Community 6 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.09
Nodes (22): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, Auditoria: secao Paginas e UI, Design System SECTI Territorios (Bento Grid) (+14 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.18
Nodes (4): playwright@^1.62.1, playwright, launchChromium(), test()

### Community 8 - "captureReports.mjs"
Cohesion: 0.22
Nodes (12): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright() (+4 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.14
Nodes (19): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+11 more)

### Community 11 - "crudDraft.js"
Cohesion: 0.24
Nodes (11): applyCadeiasDistribuicaoPatch(), applyCrudPatch(), countDraftChanges(), createEmptyDraft(), CRUD_DRAFT_STORAGE_KEY, CRUD_ENTITIES, ENTITY_META, getEntityItemId() (+3 more)

### Community 12 - "normalize"
Cohesion: 0.16
Nodes (23): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), Normalizacao de nomes (normalize), vitest@^4.1.10, vitest, MUN_LOOKUP, MUN_LOOKUP, classificarInstituicao(), expandirNomeEntidade() (+15 more)

### Community 13 - "App.jsx"
Cohesion: 0.14
Nodes (28): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+20 more)

### Community 14 - "AccessibilityBar.jsx"
Cohesion: 0.26
Nodes (11): AccessibilityBar(), applyRootPreferences(), focusFirstMatching(), FONT_SCALES, jumpToMainContent(), jumpToNavigation(), jumpToSearch(), readStoredContrast() (+3 more)

### Community 15 - "testReactToPrintComparison.mjs"
Cohesion: 0.29
Nodes (6): __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR, runComparison()

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 21 - "exportReportClient.js"
Cohesion: 0.10
Nodes (26): [Alta] /admin e mock publico (CRUD em useState, sem auth), [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Visualizacao: graficos Recharts/SVG, Exportacoes com tema claro forcado, Pagina /admin (maquete sem autenticacao), Filtro do Semiarido (278 municipios), Componentes de graficos (components/graph), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio) (+18 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.16
Nodes (9): exportarDados.mjs (placeholder), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename, ROOT (+1 more)

### Community 29 - "DataContext.jsx"
Cohesion: 0.06
Nodes (54): AUDITORIA.md Auditoria do repositorio, [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas (+46 more)

### Community 34 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 156 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `SideMap.jsx`, `dependencies`, `DashboardPainel.jsx`, `Design System SECTI Territorios (Bento Grid)`, `devDependencies`, `App.jsx`, `AccessibilityBar.jsx`, `DataContext.jsx`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05577342047930283 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `SideMap.jsx`, `dependencies`, `DashboardPainel.jsx`, `Design System SECTI Territorios (Bento Grid)`, `devDependencies`, `AccessibilityBar.jsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07649122807017544 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._