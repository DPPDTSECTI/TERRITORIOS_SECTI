# Design System — SECTI Territórios (Bento Grid SaaS)

Guia de referência da fundação visual e tokens do Painel Territorial CT&I (SECTI - Governo da Bahia), redesenhado na estética moderna SaaS Bento Grid (inspirada no Finexy) com arquitetura cromática estrita **60-30-10** (Azul Royal, Preto Carbono e Cinza/Branco).

---

## 1. Princípios & Proporção Cromática 60-30-10

- **Canvas Geral da Página (60%):** `#F4F5F7` — Cinza gelo quente de baixa saturação, provendo respiro visual e contraste suave com as superfícies elevadas.
- **Superfície Primária / Cards Principais (30%):** `#FFFFFF` — Branco puro com `border-radius: 24px`, borda sutil `1px solid rgba(226, 232, 240, 0.6)` e sombra difusa `0 4px 20px -2px rgba(15, 23, 42, 0.04)`.
- **Superfície Secundária / Sub-cards (Caixa dentro de Caixa):** `#F8FAFC` — Cinza ultra claro com borda `1px solid #F1F5F9` e `border-radius: 16px`.
- **Contraste Forte (Preto Carbono):** `#111827` (Hover: `#1E293B`) — Usado para abas ativas, botões primários de ação, ícones selecionados no dock de navegação e série secundária de gráficos.
- **Destaque Principal (Accent Blue - 10%):**
  - Sólido: `#2563EB` (Royal Blue)
  - Gradiente Principal: `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)` (Hero KPI Card)
  - Sombra do Card Azul: `0 10px 25px -5px rgba(37, 99, 235, 0.30)`
  - Azul Suave (Badges/Ícones): `#DBEAFE` com texto `#1D4ED8`
- **Dark Mode Proporcional:**
  - Canvas: `#090D16`
  - Cards: `#111827`
  - Sub-cards: `#1E293B`
  - Destaque: `#2563EB`

---

## 2. Tipografia

- **Família:** `Plus Jakarta Sans Variable` (`@fontsource-variable/plus-jakarta-sans`)
- **Fallback:** `ui-sans-serif, system-ui, -apple-system, sans-serif`
- **Numeração Tabular:** `.tnum` (`font-variant-numeric: tabular-nums`) obrigatória em KPIs, métricas, rankings, tabelas e coordenadas.

### Escala Tipográfica & Hierarquia

| Elemento | Tamanho | Peso | Cor (Claro) | Cor (Escuro) | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Títulos de Boas-Vindas / Cabeçalho** | `28px` – `32px` | Semibold (`600`) | `#090D16` | `#F8FAFC` | `-0.02em` |
| **KPI Grande (Valor Principal)** | `28px` – `34px` | Bold (`700`) | `#090D16` (`#FFF` no card azul) | `#F8FAFC` | `-0.03em` |
| **KPI Label (Acima do valor)** | `13px` – `14px` | Medium (`500`) | `#64748B` (`rgba(255,255,255,0.85)` no azul) | `#94A3B8` | Normal |
| **KPI Mini-Pílula (Meta/Variação)** | `12px` | Semibold (`600`) | Semantic Badge (`#15803D` / `#B91C1C`) | Semantic Dark | Normal |
| **Subtítulos / Headers de Cards** | `15px` – `18px` | Semibold (`600`) | `#090D16` | `#F8FAFC` | `-0.01em` |
| **Corpo de Texto (Leitura)** | `14px` | Regular (`400`) | `#64748B` | `#94A3B8` | Normal |
| **Títulos de Colunas / Captions** | `12px` | Medium (`500`) | `#64748B` | `#94A3B8` | `0.025em` |

---

## 3. Tokens de Cor & Variáveis CSS Globais

### Superfícies e Canvas

| Token | CSS Variable | Claro (RGB / Hex) | Escuro (RGB / Hex) | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `bg-background` | `--color-background` | `244 245 247` (`#F4F5F7`) | `9 13 22` (`#090D16`) | Canvas Global da página (60%) |
| `bg-surface` | `--color-surface` | `255 255 255` (`#FFFFFF`) | `17 24 39` (`#111827`) | Cards Principais (30%) |
| `bg-surface-soft` | `--color-surface-soft` | `248 250 252` (`#F8FAFC`) | `30 41 59` (`#1E293B`) | Sub-cards e caixas internas |
| `bg-carbon` | `--color-carbon` | `17 24 39` (`#111827`) | `17 24 39` (`#111827`) | Preto Carbono contraste forte |
| `bg-carbon-hover` | `--color-carbon-hover` | `30 41 59` (`#1E293B`) | `30 41 59` (`#1E293B`) | Hover do Preto Carbono |

### Destaque (Accent Royal Blue - 10%)

| Token | CSS Variable | Claro (RGB / Hex) | Descrição |
| :--- | :--- | :--- | :--- |
| `bg-primary-600` | `--color-primary-600` | `37 99 235` (`#2563EB`) | Azul Royal sólido de destaque |
| `bg-primary-700` | `--color-primary-700` | `29 78 216` (`#1D4ED8`) | Azul profundo para gradientes |
| `bg-primary-100` | `--color-primary-100` | `219 234 254` (`#DBEAFE`) | Fundo de badges/ícones azul suave |
| `bg-brand-gradient` | `--gradient-brand` | `linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)` | Gradiente do Hero KPI Card |

### Badges Semânticos (Pílulas de Status/Variação)

| Estado | Fundo (Hex) | Texto (Hex) | Borda |
| :--- | :--- | :--- | :--- |
| **Positivo / Ativo** | `#DCFCE7` | `#15803D` | `1px solid rgba(22, 163, 74, 0.2)` |
| **Negativo / Inativo** | `#FEE2E2` | `#B91C1C` | `1px solid rgba(220, 38, 38, 0.2)` |
| **Alerta / Em Progresso**| `#FEF3C7` | `#B45309` | `1px solid rgba(217, 119, 6, 0.2)` |
| **Informativo / Primário**| `#DBEAFE` | `#1D4ED8` | `1px solid rgba(37, 99, 235, 0.2)` |

---

## 4. Geometria, Bordas e Sombras (Estilo Bento Grid)

### Hierarquia Caixa dentro de Caixa
- **Card Principal:** `border-radius: 24px` (`rounded-card` / `rounded-bento`), fundo `#FFFFFF`, borda `1px solid rgba(226, 232, 240, 0.6)`, sombra `shadow-bento` (`0 4px 20px -2px rgba(15, 23, 42, 0.04)`).
- **Sub-card Interno:** `border-radius: 16px` (`rounded-subcard`), fundo `#F8FAFC`, borda `1px solid #F1F5F9`.
- **Elementos Pílula:** `border-radius: 9999px` (`rounded-full` / `rounded-control`) em botões de ação, chips de filtro, abas de navegação e busca.

### Regra do Grid de KPIs
- Em grades métricas (ex: 4 a 5 KPIs), **apenas o 1º indicador (Hero)** recebe o gradiente Azul Royal (`linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)`), textos em branco e sombra `shadow-kpi-blue` (`0 10px 25px -5px rgba(37, 99, 235, 0.30)`).
- Os demais KPIs mantêm fundo neutro `#F8FAFC`, valor em `#090D16` e ícone circular no topo direito com fundo `#FFFFFF` e borda `#E2E8F0`.

### Menu Lateral (Dock Vertical)
- Container estilizado como dock vertical em formato de pílula branca com cantos arredondados (`rounded-[28px]`), borda sutil `#E2E8F0` e sombra Bento.
- Ícone do item ativo posicionado dentro de um círculo Preto Carbono (`#111827`) com ícone em branco (`#FFFFFF`).

---

## 5. Visualização de Dados (Gráficos, Mapas e Tabelas)

### Gráficos (Recharts / SVG)
- **Paleta Cromática Semântica:**
  1. Preto Carbono (`#111827`)
  2. Azul Royal (`#2563EB`)
  3. Cinza Claro (`#CBD5E1`)
  4. Slate (`#64748B`)
  5. Sky Blue (`#93C5FD`)
  6. Deep Carbon (`#1E293B`)
- **Cantos Arredondados:** Barras verticais e horizontais com `borderRadius: 8px` no topo.
- **Barras Empilhadas:** Espaçamento visual de `1.5px` com borda sutil entre fatias.
- **Linhas de Grade (Gridlines):** Tracejadas (`stroke-dasharray: 4 4`) com cor suave `#E2E8F0`.
- **Tooltips:** Fundo branco/translúcido (`bg-surface/95 backdrop-blur-md`), `border-radius: 12px` (`rounded-subcard`), borda sutil e sombra suave.

### Mapa Coroplético da Bahia (Leaflet)
- **Escala de Tons de Azul:**
  - Nível 1 (Máximo): `#1E3A8A` (Azul profundo)
  - Nível 2: `#2563EB` (Azul Royal)
  - Nível 3: `#60A5FA` (Azul Médio)
  - Nível 4: `#93C5FD` (Azul Claro)
  - Nível 5 (Mínimo): `#DBEAFE` (Azul Ultra Claro)
  - Neutro / Sem Dados: `#F1F5F9`
- **Seleção Ativa:** Contorno de borda em Preto Carbono (`#111827` / `#0F172A`).
- **Tooltips e Popups do Mapa:** Fundo `#FFFFFF`, `border-radius: 12px`, borda `1px solid #E2E8F0` e sombra difusa.

### Tabelas de Dados e Listagens
- **Cabeçalho (`thead`):** Fundo `#F8FAFC`, texto `#64748B`, `font-weight: 500`, sem divisores verticais.
- **Linhas (`tr`):** Fundo `#FFFFFF`, divisor inferior `1px solid #F1F5F9`, altura mínima `56px` para respiro visual, hover suave em `#F8FAFC`.
- **Checkboxes:** Estilizados com acento Preto Carbono (`#111827` no claro / `#2563EB` no escuro).
- **Controles de Busca e Filtro:** Fundo `#FFFFFF` ou `#F8FAFC`, borda `1px solid #E2E8F0` e formato pílula (`rounded-full`).

---

## 6. Acessibilidade & Micro-Interações

- **Foco Visível:** Todos os controles interativos mantêm o anel de foco `focus-visible:ring-2 focus-visible:ring-carbon dark:focus-visible:ring-primary-500`.
- **Feedback Tátil:** Botões e chips com transições rápidas (`150ms ease-out`), leve escala em clique (`active:scale-[0.99]`).
- **Respeito a `prefers-reduced-motion`:** Animações intensas são automaticamente desabilitadas quando solicitado pelo usuário no sistema operacional.
