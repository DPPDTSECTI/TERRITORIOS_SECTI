# Graph Report - TERRITORIOS_SECTI  (2026-11-27)

## Corpus Check
- 101 files · ~156,711 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 253 nodes · 372 edges · 13 communities (7 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b3e0c94`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Hero.jsx
- devDependencies
- App.jsx
- scripts
- package.json
- leaflet
- Painel Territorial CT&I — SECTI Bahia
- MapMarkersAndPopups.jsx
- SuperclusteredMarkers
- lucide-react
- react-leaflet@^4.2.1

## God Nodes (most connected - your core abstractions)
1. `AnimatedRoutes()` - 16 edges
2. `scripts` - 10 edges
3. `react` - 7 edges
4. `lucide-react` - 6 edges
5. `framer-motion` - 5 edges
6. `react-router-dom` - 5 edges
7. `Painel Territorial CT&I — SECTI Bahia` - 5 edges
8. `SingleAssetMarkerItem` - 4 edges
9. `SuperclusteredMarkers()` - 4 edges
10. `MagmaLampBackground()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `SideMap()` --calls--> `SuperclusteredMarkers()`  [EXTRACTED]
  src/components/maps/SideMap.jsx → src/components/maps/side/MapMarkersAndPopups.jsx

## Import Cycles
- None detected.

## Communities (13 total, 6 thin omitted)

### Community 0 - "Hero.jsx"
Cohesion: 0.08
Nodes (6): react@^18.3.1, react, indicadoresEstrategicos, LandingHero(), modulosPlataforma, StatKpiCard()

### Community 1 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer@^10.4.20, mapshaper@^0.7.49, playwright@^1.62.1, postcss@^8.4.49, sharp@^0.35.3, tailwindcss@^3.4.0, vite@^6.4.3 (+11 more)

### Community 2 - "App.jsx"
Cohesion: 0.07
Nodes (23): AnimatedRoutes(), AppWrapper(), AtivosPage, CadeiaPage, CursosPage, DashboardPainel, generateRandomState(), GlobalScroll() (+15 more)

### Community 3 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, generate-json, generate-json:file, optimize-images, preview, simplify-map (+2 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (50): dependencies, clsx@^2.1.1, @fontsource-variable/lexend@^5.3.0, @fontsource-variable/plus-jakarta-sans@^5.3.0, framer-motion@^12.43.0, html2canvas@^1.4.1, jspdf@^4.2.0, playwright-core@^1.63.0 (+42 more)

### Community 7 - "Painel Territorial CT&I — SECTI Bahia"
Cohesion: 0.33
Nodes (5): Começando, Documentação, Grafo de conhecimento (graphify), Painel Territorial CT&I — SECTI Bahia, Scripts

### Community 9 - "MapMarkersAndPopups.jsx"
Cohesion: 0.13
Nodes (3): SingleAssetMarkerItem, SingleAssetPopupContent(), SingleCadeiaPopupContent()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Hero.jsx` to `App.jsx`, `CursosPage.jsx`, `package.json`, `SideMap.jsx`, `MapMarkersAndPopups.jsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Should `Hero.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `package.json` to `Hero.jsx`, `react-leaflet@^4.2.1`, `leaflet`, `lucide-react`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `Hero.jsx`, `CursosPage.jsx`, `package.json`, `SideMap.jsx`, `MapMarkersAndPopups.jsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07123034227567067 - nodes in this community are weakly interconnected._
- **Should `CursosPage.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._