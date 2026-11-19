# Graph Report - TERRITORIOS_SECTI  (2026-11-19)

## Corpus Check
- 122 files · ~179,109 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
<<<<<<< HEAD
- 709 nodes · 2343 edges · 34 communities (23 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58ed9db9`
=======
- 775 nodes · 2546 edges · 43 communities (27 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `500d055b`
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
<<<<<<< HEAD
- exportReportClient.js
- CadeiaPage.jsx
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
- @dnd-kit/utilities@^3.2.2
- @radix-ui/react-tooltip
- capture-redesign.mjs
- generateJson.mjs
- recharts
- supercluster
- vercel.json
- @supabase/supabase-js
- simplify-topojson.mjs
- @sparticuz/chromium
- @fontsource-variable/lexend
- AdminPage.jsx
- AUDITORIA.md Auditoria do repositorio
- topojson-client
- CadeiaPage.jsx
- react-joyride
- @fontsource-variable/plus-jakarta-sans
=======
- exportReportClient.js
- AtivosPage.jsx
- SideMap.jsx
- @dnd-kit/core@^6.3.1
- Design System SECTI Territorios (Bento Grid)
- RelatorioPage.jsx
- testReactToPrintComparison.mjs
- captureReports.mjs
- scripts
- devDependencies
- simplify-topojson.mjs
- RelatorioPage.jsx
- App.jsx
- DataContext.jsx
- dependencies
- capture-redesign.mjs
- generateJson.mjs
- CursosPage.jsx
- notes
- vercel.json
- @supabase/supabase-js
- simplify-topojson.mjs
- TelemetryContext.jsx
- AUDITORIA.md Auditoria do repositorio
- ThemeContext.jsx
- @fontsource-variable/lexend
- AdminPage.jsx
- playwright-core
- topojson-client
- CadeiaPage.jsx
- [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes
- react-joyride
- motion.js
- Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)
- clsx
- recharts
- @sparticuz/chromium
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4
- @dnd-kit/modifiers@^9.0.0

## God Nodes (most connected - your core abstractions)
1. `react` - 65 edges
2. `cn()` - 59 edges
3. `lucide-react` - 40 edges
4. `useTheme()` - 37 edges
5. `SideMap()` - 36 edges
<<<<<<< HEAD
6. `AdminPage()` - 31 edges
7. `normalize()` - 31 edges
8. `getSemanticColors()` - 30 edges
9. `isMunicipioSemiarido()` - 28 edges
10. `CadeiaPage()` - 25 edges
=======
6. `normalize()` - 35 edges
7. `getSemanticColors()` - 30 edges
8. `isMunicipioSemiarido()` - 28 edges
9. `CadeiaPage()` - 25 edges
10. `AUDITORIA.md Auditoria do repositorio` - 25 edges
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

## Surprising Connections (you probably didn't know these)
- `Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test)` --semantically_similar_to--> `Tipografia Plus Jakarta Sans e tabular-nums`  [INFERRED] [semantically similar]
  .agents/workflows/frontend.md → docs/DESIGN_SYSTEM.md
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-pdf.js → scripts/captureReports.mjs
- `handler()` --calls--> `captureReportWithPlaywright()`  [EXTRACTED]
  api/export-png.js → scripts/captureReports.mjs
- `README Painel Territorial CT&I` --references--> `INGESTAO-DE-DADOS.md Ingestao e fluxo de dados`  [EXTRACTED]
  README.md → docs/INGESTAO-DE-DADOS.md
<<<<<<< HEAD
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` --semantically_similar_to--> `Limites de paginacao .range vs max rows 1000`  [INFERRED] [semantically similar]
  docs/AUDITORIA.md → docs/INGESTAO-DE-DADOS.md
=======
- `Tipografia Plus Jakarta Sans e tabular-nums` --conceptually_related_to--> `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md → docs/SISTEMA.md
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

## Import Cycles
- None detected.

<<<<<<< HEAD
## Communities (34 total, 11 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (83): [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, framer-motion, @radix-ui/react-dialog, react, AdminPage(), buildPayloadFromForm(), cleanTerritoryLabel() (+75 more)

### Community 1 - "exportReportClient.js"
Cohesion: 0.06
Nodes (85): [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, Dados estaticos versionados e consistencia dupla, Normalizacao de nomes (normalize), Dados estaticos embutidos, react-router-dom@^7.17.0 (+77 more)

### Community 2 - "CadeiaPage.jsx"
Cohesion: 0.19
Nodes (17): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), getTipoCadeiaConfig(), MUN_LOOKUP (+9 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.08
Nodes (55): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), Mapa coropletico da Bahia (escala de azuis), Layout, sidebar, scroll navigator e tour guiado, leaflet@^1.9.4, leaflet (+47 more)

### Community 4 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, clsx@^2.1.1, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, framer-motion@^12.43.0, lucide-react@^1.18.0, playwright-core@^1.63.0, @radix-ui/react-dialog@^1.3.1 (+16 more)

### Community 5 - "exportReportClient.js"
Cohesion: 0.06
Nodes (37): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Media] Contraste text-muted e KPI ambar abaixo de AA, Design System SECTI Territorios (Bento Grid), Acessibilidade e micro-interacoes, Badges semanticos de status (+29 more)

### Community 6 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.20
Nodes (10): [Alta] /admin e mock publico (CRUD em useState, sem auth), [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), Pagina /admin (maquete sem autenticacao), Filtro do Semiarido (278 municipios), keep-alive: manter Supabase ativo, Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio) (+2 more)

### Community 7 - "playwright"
Cohesion: 0.25
Nodes (4): playwright@^1.62.1, playwright, launchChromium(), test()

### Community 8 - "captureReports.mjs"
Cohesion: 0.19
Nodes (14): handler(), handler(), [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Alta] SSRF: baseUrl do Chromium via x-forwarded-host sem allowlist, Relatorios 16:9 e exportacao PDF/PNG (cliente e Playwright) (+6 more)
=======
## Communities (43 total, 16 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (71): Layout, sidebar, scroll navigator e tour guiado, framer-motion, @radix-ui/react-dialog, react, react-router-dom, LoginPage(), ProtectedRoute(), FontesReferenciasSection() (+63 more)

### Community 1 - "exportReportClient.js"
Cohesion: 0.06
Nodes (76): [Media] lib/format.js nao usado (~38 formatacoes manuais), [Alta] ~25% de codigo identico nos 4 relatorios, [Alta] enrichedCadeias duplicado e KPIs divergentes entre relatorios, [Media] Relatorios: PDF raster, laco autoPrint, codigo morto, deps pesadas, artefatos em scripts/, Dados estaticos versionados e consistencia dupla, Dados estaticos embutidos, lucide-react, react-to-print (+68 more)

### Community 3 - "SideMap.jsx"
Cohesion: 0.09
Nodes (56): [Baixa] Mapas: codigo morto, arquivos monoliticos, CSP, sanitizacao, [Media] Mapas: ~247 hex hardcoded, duplicacao SideMap/PtiMap, performance, acessibilidade, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry, [Alta] Limites de zoom/maxBounds nao mudam ao alternar modo Geografico, Mapas PtiMap e SideMap (Leaflet), leaflet, react-leaflet (+48 more)

### Community 4 - "@dnd-kit/core@^6.3.1"
Cohesion: 0.09
Nodes (23): dependencies, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, leaflet@^1.9.4, lucide-react@^1.18.0, @radix-ui/react-dialog@^1.3.1, @radix-ui/react-tooltip@^1.4.1, react@^18.3.1 (+15 more)

### Community 5 - "Design System SECTI Territorios (Bento Grid)"
Cohesion: 0.16
Nodes (18): Exportacoes com tema claro forcado, Utilitarios src/utils, html2canvas@^1.4.1, jspdf@^4.2.0, html2canvas, jspdf, captureDomElement(), captureReportViaIframe() (+10 more)

### Community 6 - "RelatorioPage.jsx"
Cohesion: 0.13
Nodes (18): Workflow frontend.md (regras de acabamento), Obrigatorios (min 12px, AA, tabular-nums, invisible, diffs minimos, build+test), Proibicoes visuais (gradientes, pilulas aninhadas, caixa-alta, cores novas), [Media] Adocao do DS: props inexistentes, button crus, cards ad-hoc, hex cru e zinc/amber, [Baixa] Paginas/UI: codigo morto, imports nao usados, dnd-kit, GlobalScroll, Tour, docs desatualizadas, [Media] SEO (yourdomain.com, mesmo title) e layout nao responsivo, Design System SECTI Territorios (Bento Grid), Badges semanticos de status (+10 more)

### Community 7 - "testReactToPrintComparison.mjs"
Cohesion: 0.12
Nodes (9): playwright@^1.62.1, playwright, launchChromium(), test(), __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST (+1 more)

### Community 8 - "captureReports.mjs"
Cohesion: 0.21
Nodes (16): handler(), handler(), AUDITORIA.md Auditoria do repositorio, [Alta] isMunicipioSemiarido(Xique-Xique) retorna false, [Baixa] Relatorios: logica repetida, heatmap duplicado, memos mortos, testes, [Alta] Timeouts Playwright >210s vs maxDuration 60s, [Alta] Endpoints export-pdf/png anonimos sem rate limit (Seguranca e Relatorios), [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition (+8 more)
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

### Community 9 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 10 - "devDependencies"
Cohesion: 0.14
Nodes (19): description, devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+11 more)

<<<<<<< HEAD
### Community 11 - "testReactToPrintComparison.mjs"
Cohesion: 0.33
Nodes (5): __dirname, __filename, OUTPUT_DIR, REPORTS_TO_TEST, ROOT_DIR

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.12
Nodes (36): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, vitest@^4.1.10, vitest, cleanIes(), findMunicipioCoords(), getTipoCadeiaConfig(), MUN_LOOKUP (+28 more)
=======
### Community 11 - "simplify-topojson.mjs"
Cohesion: 0.15
Nodes (10): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+2 more)

### Community 12 - "RelatorioPage.jsx"
Cohesion: 0.11
Nodes (33): [Alta] classificarInstituicao erra (UNILAB, nit, typo espacoDinamizadoress), [Alta] reportAggregation e funcoes de normalization so usados por testes, vitest, CardLista(), MUN_LOOKUP, findMunicipioCoords(), MUN_LOOKUP, addCountedEntry() (+25 more)
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

### Community 13 - "App.jsx"
Cohesion: 0.10
Nodes (37): AdminPage, AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState() (+29 more)

### Community 16 - "capture-redesign.mjs"
Cohesion: 0.18
Nodes (10): __dirname, ensureServerRunning(), __filename, OUTPUT_DIR, pingServer(), RESOLUTIONS, ROOT_DIR, ROUTES (+2 more)

### Community 17 - "generateJson.mjs"
Cohesion: 0.24
Nodes (12): __dirname, downloadFile(), __filename, FINANCIAL_PATTERNS, findColIndex(), headerToKey(), isFinancial(), main() (+4 more)

### Community 20 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, memory, maxDuration, memory, crons, functions, api/export-pdf.js, api/export-png.js (+2 more)

<<<<<<< HEAD
### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.10
Nodes (16): exportarDados.mjs (placeholder), generateJson.mjs (legado e quebrado), Scripts do repositorio, __dirname, __filename, projectRoot, __dirname, __filename (+8 more)

### Community 28 - "AdminPage.jsx"
Cohesion: 0.16
Nodes (27): INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas), Glossario (IFDM, CT&I, PTI, EAD, RLS), Lacunas: ETL, esquema, RLS fora do repositorio, Limites de paginacao .range vs max rows 1000, Mapa TopoJSON e simplify-map, Procedimentos de atualizacao (+19 more)

### Community 29 - "AUDITORIA.md Auditoria do repositorio"
Cohesion: 0.15
Nodes (16): AUDITORIA.md Auditoria do repositorio, [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Alta] Tiles Esri/ArcGIS sem atribuicao (licenca), [Alta] Falha no TopoJSON deixa spinner infinito sem retry (+8 more)

### Community 32 - "CadeiaPage.jsx"
Cohesion: 0.18
Nodes (13): [Media] Seguranca: RLS nao versionada, npm audit, xlsx, sem CSP, Content-Disposition, SISTEMA.md Documentacao do Sistema, Arquitetura SPA sem backend, somente leitura, Deploy Vercel (cron, headers, rewrites), Variaveis de ambiente, Mapas PtiMap e SideMap (Leaflet), Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase), Supabase (Postgres, chave anon) (+5 more)

=======
### Community 21 - "@supabase/supabase-js"
Cohesion: 0.33
Nodes (4): @dnd-kit/utilities@^3.2.2, @supabase/supabase-js@^2.112.3, @dnd-kit/utilities, @supabase/supabase-js

### Community 22 - "simplify-topojson.mjs"
Cohesion: 0.22
Nodes (9): README Painel Territorial CT&I, Painel Territorial CT&I SECTI Bahia, Scripts npm (dev, build, test, simplify-map, optimize-images), __dirname, __filename, getFilesRecursively(), optimizeImages(), PUBLIC_IMG (+1 more)

### Community 24 - "TelemetryContext.jsx"
Cohesion: 0.23
Nodes (18): TelemetryContext, TelemetryProvider(), supabasePublic, aggregateTelemetryMetrics(), clearTelemetryEvents(), computeDatabaseHealth(), createTelemetryEvent(), CRUD_ACTION_LABELS (+10 more)

### Community 26 - "ThemeContext.jsx"
Cohesion: 0.26
Nodes (11): AccessibilityBar(), applyRootPreferences(), focusFirstMatching(), FONT_SCALES, jumpToMainContent(), jumpToNavigation(), jumpToSearch(), readStoredContrast() (+3 more)

### Community 28 - "AdminPage.jsx"
Cohesion: 0.06
Nodes (60): [Baixa] Dados: assetTypes acoplado, heuristica cache, provider, O(n*m), [Alta] Falhas de consulta silenciosas e cache parcial por 10 min, [Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD, [Alta] /admin e mock publico (CRUD em useState, sem auth), [Alta] Contagens fixas (88 cadeias, 417 municipios) no codigo, INGESTAO-DE-DADOS.md Ingestao e fluxo de dados, Cache: versao da chave e heuristica distCadeias>88, Carga do Supabase no DataContext (12 consultas) (+52 more)

### Community 29 - "playwright-core"
Cohesion: 0.17
Nodes (12): Evolucao entre branches (dev, main, redesign) e funcionalidades perdidas, [Baixa] Seguranca (keep-alive fail-open, /admin, postMessage, cache immutable), Manter banco ativo (keep-alive), SISTEMA.md Documentacao do Sistema, Arquitetura SPA sem backend, somente leitura, Deploy Vercel (cron, headers, rewrites), Variaveis de ambiente, keep-alive: manter Supabase ativo (+4 more)

### Community 32 - "CadeiaPage.jsx"
Cohesion: 0.31
Nodes (12): CadeiaPage(), cleanTerritorioName(), findMunicipioCoords(), getAlphaColor(), getSemiaridoArrangementColor(), getTipoBadgeVariant(), MUN_LOOKUP, normalizeName() (+4 more)

### Community 33 - "[Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes"
Cohesion: 0.24
Nodes (10): [Media] Dados: RLS/chave no .env.example, scripts SharePoint, referenciasDB, estaticos inconsistentes, docs divergentes, [Media] Acessibilidade: div onClick, graficos so mouse, Tabs/Dialog/Dropdown sem foco/aria, [Media] Contraste text-muted e KPI ambar abaixo de AA, [Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador, [Alta] Paginas monoliticas com ~65% de repeticao (Cursos, Ativos, Cadeia, Relatorio), [Media] Performance: agregacoes O(n2) em map, enrichedCadeias/tema, typewriter, contextos sem useMemo, [Media] Robustez: localStorage sem try/catch, ErrorBoundary/404, SW removido mas registrado, Auditoria: secao Paginas e UI (+2 more)

>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4
### Community 34 - "react-joyride"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

<<<<<<< HEAD
### Community 38 - "@fontsource-variable/plus-jakarta-sans"
Cohesion: 0.20
Nodes (6): @fontsource-variable/plus-jakarta-sans@^5.3.0, react-helmet-async@^3.0.0, vite-plugin-node-polyfills@^0.28.0, @fontsource-variable/plus-jakarta-sans, react-helmet-async, vite-plugin-node-polyfills
=======
### Community 35 - "motion.js"
Cohesion: 0.25
Nodes (7): DURATIONS, EASINGS, fadeIn, fadeUp, scaleIn, SPRING_DEFAULT, SPRING_FLUID

### Community 36 - "Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio)"
Cohesion: 0.33
Nodes (6): [Media] Filtros de Ativos/Cursos/Cadeia em useState local, fora da URL, Visualizacao: graficos Recharts/SVG, Filtro do Semiarido (278 municipios), Componentes de graficos (components/graph), Modulos e rotas (/territorios, /ativos, /cadeia, /cursos, /relatorio), selectedTerritory compartilhado
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

## Ambiguous Edges - Review These
- `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` → `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`  [AMBIGUOUS]
  docs/AUDITORIA.md · relation: conceptually_related_to
- `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` → `Tipografia Plus Jakarta Sans e tabular-nums`  [AMBIGUOUS]
  docs/DESIGN_SYSTEM.md · relation: conceptually_related_to

## Knowledge Gaps
- **7 isolated node(s):** `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)`, `Badges semanticos de status`, `Geometria Bento Grid (card, sub-card, pilula)` (+2 more)
<<<<<<< HEAD
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 139 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
=======
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 158 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

<<<<<<< HEAD
- **Why does `react` connect `react` to `exportReportClient.js`, `CadeiaPage.jsx`, `SideMap.jsx`, `dependencies`, `devDependencies`, `RelatorioPage.jsx`, `App.jsx`, `AdminPage.jsx`, `AUDITORIA.md Auditoria do repositorio`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06198347107438017 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `exportReportClient.js` to `react`, `CadeiaPage.jsx`, `SideMap.jsx`, `dependencies`, `devDependencies`, `RelatorioPage.jsx`, `App.jsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `exportReportClient.js` be split into smaller, more focused modules?**
  _Cohesion score 0.056074766355140186 - nodes in this community are weakly interconnected._
=======
- **Why does `react` connect `react` to `CadeiaPage.jsx`, `exportReportClient.js`, `AtivosPage.jsx`, `SideMap.jsx`, `@dnd-kit/core@^6.3.1`, `devDependencies`, `RelatorioPage.jsx`, `App.jsx`, `TelemetryContext.jsx`, `ThemeContext.jsx`, `AdminPage.jsx`, `playwright-core`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **What connects `Glossario (IFDM, CT&I, PTI, EAD, RLS)`, `Procedimentos de atualizacao`, `Deploy Vercel (cron, headers, rewrites)` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07247399047786987 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `exportReportClient.js` to `react`, `CadeiaPage.jsx`, `AtivosPage.jsx`, `SideMap.jsx`, `@dnd-kit/core@^6.3.1`, `devDependencies`, `RelatorioPage.jsx`, `App.jsx`, `ThemeContext.jsx`, `AdminPage.jsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `exportReportClient.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06198019801980198 - nodes in this community are weakly interconnected._
>>>>>>> f2e27583efd25582f4bd5065825b409e219031c4

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `[Alta] .range sem order/paginacao trunca em 1000 linhas e corrompe EAD` and `[Alta] ETL e correcoes de dados hard-coded na UI, fallback silencioso para Salvador`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Stack (React 18, Vite, Tailwind, Recharts, Leaflet, Supabase)` and `Tipografia Plus Jakarta Sans e tabular-nums`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._