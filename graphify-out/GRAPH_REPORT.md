# Graph Report - TERRITORIOS_SECTI  (2026-11-12)

## Corpus Check
- 111 files · ~154,567 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 696 nodes · 2174 edges · 42 communities (26 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1db4234`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- SideMap.jsx
- RelatorioPage.jsx
- AUDITORIA.md Auditoria do repositorio
- dependencies
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- @fontsource-variable/plus-jakarta-sans
- captureReports.mjs
- scripts
- devDependencies
- exportReportClient.js
- normalize
- Design System SECTI Territorios (Bento Grid)
- DataContext.jsx
- clsx
- capture-redesign.mjs
- generateJson.mjs
- notes
- playwright-core
- vercel.json
- optimize-images.mjs
- simplify-topojson.mjs
- DashboardPainel.jsx
- recharts
- react-helmet-async
- INGESTAO-DE-DADOS.md Ingestao e fluxo de dados
- @supabase/supabase-js
- xlsx
- CadeiaPage.jsx
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- react-joyride
- [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas
- Arquitetura SPA sem backend, somente leitura
- motion.js
- ErrorBoundary
- @dnd-kit/sortable@^10.0.0
- react-joyride
- @sparticuz/chromium
- supercluster

## God Nodes (most connected - your core abstractions)
1. `react` - 57 edges
2. `cn()` - 49 edges
3. `lucide-react` - 37 edges
4. `useTheme()` - 36 edges
5. `SideMap()` - 31 edges
6. `isMunicipioSemiarido()` - 28 edges
7. `AUDITORIA.md Auditoria do repositorio` - 25 edges
8. `UiShowcasePage()` - 24 edges
9. `normalize()` - 23 edges
10. `CadeiaPage()` - 23 edges

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

## Communities (42 total, 16 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (72): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, Layout, sidebar, scroll navigator e tour guiado, framer-motion, lucide-react, react (+64 more)

### Community 1 - "SideMap.jsx"
Cohesion: 0.09
Nodes (52): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, leaflet, react-leaflet, buildTopologiaPayload(), getCachedBahiaTopologia(), loadBahiaTopologia(), getMapPalette() (+44 more)

### Community 2 - "RelatorioPage.jsx"
Cohesion: 0.07
Nodes (67): [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, react-router-dom@^7.17.0, react-to-print@^3.3.0, react-router-dom (+59 more)

### Community 3 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.15
Nodes (18): AUDITORIA.md Auditoria do repositorio, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, [Alta] Timeouts Playwright >210s vs maxDuration 60s (+10 more)

### Community 4 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @dnd-kit/core@^6.3.1, @dnd-kit/modifiers@^9.0.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, react@^18.3.1 (+10 more)

### Community 6 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.13
Nodes (27): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+19 more)

### Community 7 - "@fontsource-variable/plus-jakarta-sans"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.25
Nodes (12): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright), captureReportWithPlaywright(), __dirname (+4 more)

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.14
Nodes (19): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+11 more)

### Community 11 - "exportReportClient.js"
Cohesion: 0.17
Nodes (17): Exportacoes com tema claro forcado, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe(), downloadCanvasAsPdf() (+9 more)

### Community 12 - "normalize"
Cohesion: 0.15
Nodes (24): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, Normalizacao de nomes (normalize), vitest@^4.1.10, vitest, ExportPdfButton(), classificarInstituicao() (+16 more)

### Community 13 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.13
Nodes (15): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Design System SECTI Territorios (Bento Grid), Badges semanticos de status, Geometria Bento Grid (card, sub-card, pilula), Dark mode proporcional (+7 more)

### Community 14 - "DataContext.jsx"
Cohesion: 0.11
Nodes (28): [Alta] /admin e mock publico (CRUD em useState, sem auth), Pagina /admin (maquete sem autenticacao), AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel(), CrudStatusPill(), DEFAULT_ATIVO_TYPES, DEFAULT_CADEIA_TYPES (+20 more)

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
Cohesion: 0.10
Nodes (19): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename (+11 more)

### Community 24 - "DashboardPainel.jsx"
Cohesion: 0.20
Nodes (13): [Media] lib/format.js nao usado (~38 formatacoes manuais), DashboardPainel(), MUN_LOOKUP, normalizeName(), normalizeTerritoryName(), DARK_BLUE_PALETTE, DARK_CHART_PALETTE, LIGHT_BLUE_PALETTE (+5 more)

### Community 27 - "INGESTAO-DE-DADOS.md Ingestao e fluxo de dados"
Cohesion: 0.19
Nodes (17): [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] Falha no TopoJSON deixa spinner infinito sem retry, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio (+9 more)

### Community 30 - "CadeiaPage.jsx"
Cohesion: 0.24
Nodes (14): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+6 more)

### Community 32 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.29
Nodes (7): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Visualizacao: graficos Recharts/SVG, Filtro do Semiarido (278 municipios), Componentes de graficos (components/graph), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado, Utilitarios src/utils

### Community 34 - "[Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas"
Cohesion: 0.25
Nodes (8): [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, Auditoria: secao Paginas e UI, Acessibilidade e micro-interacoes, Pendencias e Excecoes de Redesign, QA final: 48 screenshots Playwright, foco visivel, reduced-motion

### Community 35 - "Arquitetura SPA sem backend, somente leitura"
Cohesion: 0.50
Nodes (4): Arquitetura SPA sem backend, somente leitura, Mapas PtiMap e SideMap (Leaflet), Supabase (Postgres, chave anon), ThemeContext (tema claro/escuro)

### Community 36 - "motion.js"
Cohesion: 0.25
Nodes (7): DURATIONS, EASINGS, fadeIn, fadeUp, scaleIn, SPRING_DEFAULT, SPRING_FLUID

## Ambiguous Edges - Review These
- `Tipografia Plus Jakarta Sans e tabular-nums` → `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens`, `Workflow frontend.md (regras de acabamento)`, `Glossario (IFDM, CT&I, PTI, EAD, RLS)` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 155 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `[Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas`, `dependencies`, `AtivosPage.jsx`, `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`, `AUDITORIA.md Auditoria do repositorio`, `devDependencies`, `normalize`, `DataContext.jsx`, `DashboardPainel.jsx`, `CadeiaPage.jsx`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)`, `Tabelas e listagens` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06926811053024645 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `SideMap.jsx`, `RelatorioPage.jsx`, `[Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas`, `dependencies`, `AtivosPage.jsx`, `devDependencies`, `normalize`, `DataContext.jsx`, `DashboardPainel.jsx`, `CadeiaPage.jsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `SideMap.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0890937019969278 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Tipografia Plus Jakarta Sans e tabular-nums` and `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._