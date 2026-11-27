# Graph Report - TERRITORIOS_SECTI  (2026-11-27)

## Corpus Check
- 101 files · ~156,736 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .example 1, .xml 1)

## Summary
- 29 nodes · 29 edges · 2 communities (0 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ea5a5ef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Hero.jsx
- LandingHero

## God Nodes (most connected - your core abstractions)
1. `StatKpiCard()` - 2 edges
2. `LandingHero()` - 2 edges
3. `modulosPlataforma` - 1 edges
4. `indicadoresEstrategicos` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (2 total, 2 thin omitted)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Hero.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._