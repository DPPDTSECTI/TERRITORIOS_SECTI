# Graph Report - TERRITORIOS_SECTI  (2026-11-10)

## Corpus Check
- 108 files · ~146,945 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 664 nodes · 2031 edges · 30 communities (20 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f07dccbc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioPage.jsx
- [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes
- dependencies
- CadeiaPage.jsx
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- @fontsource-variable/plus-jakarta-sans
- captureReports.mjs
- scripts
- devDependencies
- exportReportClient.js
- normalize
- @dnd-kit/sortable@^10.0.0
- optimize-images.mjs
- @dnd-kit/utilities@^3.2.2
- capture-redesign.mjs
- generateJson.mjs
- notes
- playwright-core
- vercel.json
- @supabase/supabase-js
- simplify-topojson.mjs
- @fontsource-variable/plus-jakarta-sans
- package.json
- react-dom
- react-helmet-async
- react-joyride

## God Nodes (most connected - your core abstractions)
1. `react` - 56 edges
2. `cn()` - 47 edges
3. `useTheme()` - 36 edges
4. `lucide-react` - 36 edges
5. `SideMap()` - 34 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `normalize()` - 21 edges
10. `AnimatedRoutes()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas)` --conceptually_related_to--> `Design System SECTI Territorios (Bento Grid)`  [INFERRED]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md

## Import Cycles
- None detected.

## Communities (30 total, 10 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (68): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react, AdminPage(), INITIAL_ATIVOS, FontesReferenciasSection() (+60 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.08
Nodes (53): [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, Mapa coropletico da Bahia (escala de azuis), leaflet@^1.9.4, leaflet, react-leaflet, buildTopologiaPayload(), getCachedBahiaTopologia(), loadBahiaTopologia() (+45 more)

### Community 2 - "RelatorioPage.jsx"
Cohesion: 0.07
Nodes (62): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom@^7.17.0, react-to-print@^3.3.0 (+54 more)

### Community 3 - "[Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes"
Cohesion: 0.06
Nodes (53): AUDITORIA.md Auditoria do repositorio, [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] reportAggregation e funcoes de normalization so usados por testes, [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas (+45 more)

### Community 4 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, framer-motion@^12.43.0, lucide-react@^1.18.0, react@^18.3.1, react-joyride@^3.2.0, react-leaflet@^4.2.1, recharts@^3.10.1, supercluster@^9.0.0 (+9 more)

### Community 5 - "CadeiaPage.jsx"
Cohesion: 0.06
Nodes (38): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Media] lib/format.js nao usado (~38 formatacoes manuais), selectedTerritory compartilhado, CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor() (+30 more)

### Community 6 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.06
Nodes (47): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Design System SECTI Territorios (Bento Grid) (+39 more)

### Community 7 - "@fontsource-variable/plus-jakarta-sans"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.24
Nodes (13): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright() (+5 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3, @vitejs/plugin-react@^4.3.4 (+8 more)

### Community 11 - "exportReportClient.js"
Cohesion: 0.13
Nodes (22): Visualizacao: graficos Recharts/SVG, Exportacoes com tema claro forcado, Filtro do Semiarido (278 municipios), Componentes de graficos (components/graph), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), Utilitarios src/utils, html2canvas@^1.4.1, jspdf@^4.2.0 (+14 more)

### Community 12 - "normalize"
Cohesion: 0.16
Nodes (23): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), vitest, CardLista(), MUN_LOOKUP, MUN_LOOKUP, DataContext, classificarInstituicao(), expandirNomeEntidade() (+15 more)

### Community 14 - "optimize-images.mjs"
Cohesion: 0.22
Nodes (9): README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG (+1 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 18 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.15
Nodes (10): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+2 more)

### Community 27 - "package.json"
Cohesion: 0.15
Nodes (12): clsx@^2.1.1, @dnd-kit/core@^6.3.1, @dnd-kit/modifiers@^9.0.0, @sparticuz/chromium@^153.0.0, description, name, type, version (+4 more)

## Ambiguous Edges - Review These
- `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` → `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens`, `Workflow frontend.md (regras de acabamento)`, `Deploy Vercel (cron, headers, rewrites)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 147 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `[Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes`, `dependencies`, `CadeiaPage.jsx`, `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`, `normalize`, `package.json`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **What connects `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07915893630179345 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `dependencies`, `CadeiaPage.jsx`, `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`, `normalize`, `package.json`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador` and `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._