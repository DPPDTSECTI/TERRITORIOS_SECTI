# Graph Report - TERRITORIOS_SECTI  (2026-11-27)

## Corpus Check
- 101 files · ~156,779 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 167 nodes · 243 edges · 35 communities (11 shown, 24 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `480a1e25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Hero.jsx
- devDependencies
- App.jsx
- scripts
- AnimatedRoutes
- package.json
- dependencies
- Painel Territorial CT&I — SECTI Bahia
- notes
- MainApp
- MagmaLampBackground
- @fontsource-variable/lexend@^5.3.0
- @fontsource-variable/plus-jakarta-sans@^5.3.0
- html2canvas@^1.4.1
- jspdf@^4.2.0
- lucide-react
- playwright-core@^1.63.0
- @radix-ui/react-dialog@^1.3.1
- @radix-ui/react-dropdown-menu@^2.2.1
- @radix-ui/react-tooltip@^1.4.1
- react-helmet-async
- react-leaflet@^4.2.1
- react-to-print@^3.3.0
- supercluster@^9.0.0
- topojson-client@^3.1.0
- vite-plugin-node-polyfills@^0.28.0
- xlsx@^0.18.5
- CadeiaPage
- DashboardPainel
- RelatorioAnalisePage
- RelatorioCadeias
- PageWrapper
- RelatorioPage
- RelatorioAtivosPage
- SobrePage

## God Nodes (most connected - your core abstractions)
1. `AnimatedRoutes()` - 16 edges
2. `scripts` - 10 edges
3. `Painel Territorial CT&I — SECTI Bahia` - 5 edges
4. `MagmaLampBackground()` - 4 edges
5. `MainApp()` - 4 edges
6. `framer-motion` - 4 edges
7. `react` - 4 edges
8. `react-router-dom` - 4 edges
9. `LandingHero` - 3 edges
10. `SobrePage` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AnimatedRoutes()` --calls--> `SobrePage`  [EXTRACTED]
  src/App.jsx → src/App.jsx  _Bridges community 34 → community 4_
- `AnimatedRoutes()` --calls--> `DashboardPainel`  [EXTRACTED]
  src/App.jsx → src/App.jsx  _Bridges community 28 → community 4_
- `AnimatedRoutes()` --calls--> `AtivosPage`  [EXTRACTED]
  src/App.jsx → src/App.jsx  _Bridges community 2 → community 4_
- `AnimatedRoutes()` --calls--> `CadeiaPage`  [EXTRACTED]
  src/App.jsx → src/App.jsx  _Bridges community 27 → community 4_
- `AnimatedRoutes()` --calls--> `RelatorioPage`  [EXTRACTED]
  src/App.jsx → src/App.jsx  _Bridges community 32 → community 4_

## Import Cycles
- None detected.

## Communities (35 total, 24 thin omitted)

### Community 0 - "Hero.jsx"
Cohesion: 0.07
Nodes (10): framer-motion@^12.43.0, react@^18.3.1, react-router-dom@^7.17.0, framer-motion, react, react-router-dom, indicadoresEstrategicos, LandingHero() (+2 more)

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, playwright@^1.62.1, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+11 more)

### Community 2 - "App.jsx"
Cohesion: 0.12
Nodes (3): AtivosPage, MAGMA_ORBS_CONFIG, ROUTER_BASENAME

### Community 3 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 4 - "AnimatedRoutes"
Cohesion: 0.25
Nodes (5): AnimatedRoutes(), CursosPage, LandingHero, RelatorioCursosPage, RelatorioSintesePage

### Community 5 - "package.json"
Cohesion: 0.22
Nodes (8): recharts@^3.10.1, @supabase/supabase-js@^2.112.3, description, name, type, version, recharts, @supabase/supabase-js

### Community 6 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, clsx@^2.1.1, leaflet@^1.9.4, react-dom@^18.3.1, react-joyride@^3.2.0, clsx, leaflet, react-dom (+1 more)

### Community 7 - "Painel Territorial CT&I — SECTI Bahia"
Cohesion: 0.33
Nodes (5): Começando, Documentação, Grafo de conhecimento (graphify), Painel Territorial CT&I — SECTI Bahia, Scripts

### Community 8 - "notes"
Cohesion: 0.67
Nodes (3): notes, tailwind, topojson

### Community 9 - "MainApp"
Cohesion: 0.67
Nodes (3): AppWrapper(), GlobalScroll(), MainApp()

### Community 10 - "MagmaLampBackground"
Cohesion: 1.00
Nodes (3): generateRandomState(), MagmaLampBackground(), randomBetween()

## Knowledge Gaps
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `Hero.jsx`, `package.json`, `@fontsource-variable/lexend@^5.3.0`, `@fontsource-variable/plus-jakarta-sans@^5.3.0`, `html2canvas@^1.4.1`, `jspdf@^4.2.0`, `lucide-react`, `playwright-core@^1.63.0`, `@radix-ui/react-dialog@^1.3.1`, `@radix-ui/react-dropdown-menu@^2.2.1`, `@radix-ui/react-tooltip@^1.4.1`, `react-helmet-async`, `react-leaflet@^4.2.1`, `react-to-print@^3.3.0`, `supercluster@^9.0.0`, `topojson-client@^3.1.0`, `vite-plugin-node-polyfills@^0.28.0`, `xlsx@^0.18.5`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `Hero.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `Hero.jsx` to `App.jsx`, `package.json`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Hero.jsx` to `App.jsx`, `package.json`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._