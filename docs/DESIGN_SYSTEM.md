# Design System — SECTI Territórios

Guia de referência da fundação visual e tokens do Painel Territorial CT&I (SECTI - Governo da Bahia).

---

## 1. Tipografia

- **Família Principal:** `Plus Jakarta Sans Variable` (`@fontsource-variable/plus-jakarta-sans`)
- **Fallback:** `ui-sans-serif, system-ui, -apple-system, sans-serif`
- **Variante Numérica Tabular:** `.tnum` (`font-variant-numeric: tabular-nums`) para dados, KPIs, tabelas e valores monetários/estatísticos.

### Escala Tipográfica (Tailwind Tokens)

| Token Tailwind | Tamanho | Line Height | Letter Spacing | Font Weight | Uso Recomendado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-micro` | `11px` | `14px` | `0.06em` | 600 (Semibold) | Badges ultra-compactos, tags de metadados, legendas técnicas |
| `text-caption` | `12px` | `16px` | normal | 500 (Medium) | Legendas, tooltips, hints de formulário, breadcrumbs |
| `text-body-sm` | `13px` | `20px` | normal | 400 (Regular) | Textos secundários, tabelas densas, filtros compactos |
| `text-body` | `14px` | `22px` | normal | 400 (Regular) | Corpo padrão de leitura, inputs, parágrafos |
| `text-subtitle` | `16px` | `24px` | normal | 600 (Semibold) | Cabeçalhos de cards secundários, itens de menu |
| `text-title` | `20px` | `28px` | `-0.01em` | 650 (Semibold+) | Títulos de seções, cabeçalhos de cards principais |
| `text-headline` | `28px` | `34px` | `-0.02em` | 700 (Bold) | Títulos de módulos e páginas |
| `text-kpi` | `36px` | `40px` | `-0.02em` | 700 (Bold) | Números de destaque em métricas (usar com `.tnum`) |
| `text-display` | `44px` | `48px` | `-0.03em` | 700 (Bold) | Hero banner, totais consolidados estaduais |

---

## 2. Superfícies, Cores e Contraste

O sistema adota variáveis CSS no formato `R G B` com suporte nativo a opacidade (`rgb(var(--token) / <alpha-value>)`) e alternância de tema claro/escuro via classe `.dark`.

### Superfícies e Fundo

| Token | CSS Variable | Claro (RGB) | Escuro (RGB) | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `bg-background` | `--color-background` | `244 247 251` | `11 15 25` | Canvas global da aplicação |
| `bg-surface` | `--color-surface` | `255 255 255` | `17 25 41` | Superfície base para cards e containers |
| `bg-surface-raised` | `--color-surface-raised` | `255 255 255` | `24 34 54` | Modais, dropdowns, popovers, cards suspensos |
| `bg-surface-soft` | `--color-surface-soft` | `248 250 253` | `22 32 50` | Áreas de agrupamento secundárias, headers de tabela |
| `bg-surface-sunken` | `--color-surface-sunken` | `238 243 248` | `8 12 20` | Caixas de entrada em repouso, fundos rebaixados |

### Texto, Bordas e Foco

| Token | CSS Variable | Claro (RGB / Hex) | Escuro (RGB / Hex) | Contraste Mínimo |
| :--- | :--- | :--- | :--- | :--- |
| `text-text-primary` | `--color-text-primary` | `var(--color-neutral-900)` | `241 245 249` | > 10:1 (AAA) |
| `text-text-secondary` | `--color-text-secondary` | `var(--color-neutral-700)` | `194 206 222` | > 7:1 (AAA) |
| `text-text-muted` | `--color-text-muted` | `var(--color-neutral-600)` | `150 166 188` | > 4.5:1 (AA) |
| `border-border` | `--color-border` | `var(--color-neutral-200)` | `33 45 66` | Estrutural |
| `border-border-strong` | `--color-border-strong` | `var(--color-neutral-300)` | `48 64 90` | Divisores destacados |
| `ring-ring` | `--color-ring` | `var(--color-primary-500)` | `var(--color-primary-400)` | Indicador de foco acessível |

### Paletas Semânticas

| Domínio | 50 (Fundo) | 100 (Badge) | 600 (Base) | 700 (Texto/Forte) |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `var(--color-success-50)` | `var(--color-success-100)` | `var(--color-success-600)` | `var(--color-success-700)` |
| **Warning** | `var(--color-warning-50)` | `var(--color-warning-100)` | `var(--color-warning-600)` | `var(--color-warning-700)` |
| **Danger** | `var(--color-danger-50)` | `var(--color-danger-100)` | `var(--color-danger-600)` | `var(--color-danger-700)` |
| **Accent (Bahia)** | `var(--color-accent-50)` | `var(--color-accent-100)` | `var(--color-accent-600)` | `var(--color-accent-700)` |

### Visualização de Dados (Gráficos amigáveis a daltonismo)

Paleta com 8 tonalidades balanceadas para contraste e distinção cromática em ambos os temas:

| Token | Claro (RGB) | Escuro (RGB) | Aplicação |
| :--- | :--- | :--- | :--- |
| `chart-1` | `47 117 181` | `96 160 216` | Série primária / barras principais |
| `chart-2` | `20 150 160` | `45 190 195` | Cursos / Formação tecnológica |
| `chart-3` | `196 146 36` | `232 178 60` | Ativos / Cadeias produtivas |
| `chart-4` | `124 108 196` | `160 145 225` | Inovação / Ambientes promotores |
| `chart-5` | `92 155 200` | `130 185 225` | Séries secundárias |
| `chart-6` | `217 108 90` | `240 135 115` | Alertas / Demandas setoriais |
| `chart-7` | `76 140 110` | `100 190 150` | Indicadores de sustentabilidade |
| `chart-8` | `123 138 153` | `148 163 184` | Neutro / Outros / Dados residuais |

### Mapas Coropléticos

Gradiente institucional em 5 faixas (`color-map-1` até `color-map-5`) + neutro (`color-map-neutral`):
- `map-1`: Densidade máxima
- `map-2` a `map-4`: Faixas intermediárias
- `map-5`: Densidade baixa
- `map-neutral`: Sem dados / município não selecionado

---

## 3. Raios de Borda e Sombras

### Raios (`borderRadius`)

| Token Tailwind | Valor | Aplicação |
| :--- | :--- | :--- |
| `rounded-control` | `10px` | Botões, inputs, selects, segmented controls |
| `rounded-card` | `16px` | Cards métricos, gráficos, blocos de conteúdo |
| `rounded-panel` | `20px` | Gavetas laterais (drawers), modais, containers mestres |

### Sombras (`boxShadow`)

As sombras adaptam-se dinamicamente por variáveis CSS: sombras difusas no tema claro e elevação com inner highlight sutil (`inset 0 1px 0 rgba(...)`) no tema escuro.

| Token Tailwind | Variável CSS | Comportamento |
| :--- | :--- | :--- |
| `shadow-xs` | `--shadow-xs` | Borda sutil de repouso / microelevação |
| `shadow-card` | `--shadow-card` | Cards em repouso |
| `shadow-card-hover` | `--shadow-card-hover` | Cards interativos no hover |
| `shadow-float` | `--shadow-float` | Modais, tooltips flutuantes e menus |

*Nota de retrocompatibilidade:* Os aliases `shadow-card-soft`, `shadow-card-elevated`, `shadow-glass` e `shadow-glass-hover` foram mantidos mapeados para os tokens oficiais.

---

## 4. Transições e Animações (`src/lib/motion.js`)

Centralização das configurações de movimento com respeito estrito a acessibilidade (`reducedMotion="user"` via `<MotionConfig>`).

### Curvas de Aceleração (Easings)

- **Standard:** `[0.2, 0, 0, 1]` — Uso geral em transições e hover.
- **Emphasized:** `[0.16, 1, 0.3, 1]` — Entradas de modais, expansões de cards.

### Durações

- `fast`: `120ms` (`0.12s`) — Feedback de botões, hovers, trocas de abas.
- `normal`: `200ms` (`0.2s`) — Transições de cor, colapsáveis.
- `emphasized`: `320ms` (`0.32s`) — Troca de páginas, cards que surgem na tela.
- `slow`: `500ms` (`0.5s`) — Transições complexas de layouts.

### Variantes Framer-Motion

```javascript
import { fadeIn, fadeUp, scaleIn, staggerContainer } from '@/lib/motion';

// Exemplo de uso:
<motion.div variants={staggerContainer(0.05)} initial="initial" animate="animate">
  <motion.div variants={fadeUp} className="bg-surface rounded-card p-4 shadow-card">
    ...
  </motion.div>
</motion.div>
```

---

## 5. Cores dos Tipos de Ativos (CT&I)

Mapeamento centralizado de variáveis CSS e tokens semânticos Tailwind para as 13 tipologias de ativos de Ciência, Tecnologia e Inovação da Bahia:

| Tipologia / Chave | Hex Padrão | Variável CSS | Token Tailwind |
| :--- | :--- | :--- | :--- |
| `univ_privada` | `#38BDF8` | `--color-asset-privada` | `bg-asset-privada`, `text-asset-privada`, `border-asset-privada` |
| `univ_estadual` | `#2563EB` | `--color-asset-estadual` | `bg-asset-estadual`, `text-asset-estadual`, `border-asset-estadual` |
| `univ_federal` | `#1E3A8A` | `--color-asset-federal` | `bg-asset-federal`, `text-asset-federal`, `border-asset-federal` |
| `inst_federal` | `#0284C7` | `--color-asset-if` | `bg-asset-if`, `text-asset-if`, `border-asset-if` |
| `aceleradora` | `#10B981` | `--color-asset-aceleradora` | `bg-asset-aceleradora`, `text-asset-aceleradora`, `border-asset-aceleradora` |
| `espaco_dinamizador` | `#06B6D4` | `--color-asset-dinamizador` | `bg-asset-dinamizador`, `text-asset-dinamizador`, `border-asset-dinamizador` |
| `incubadora` | `#6366F1` | `--color-asset-incubadora` | `bg-asset-incubadora`, `text-asset-incubadora`, `border-asset-incubadora` |
| `parque` | `#0F172A` | `--color-asset-parque` | `bg-asset-parque`, `text-asset-parque`, `border-asset-parque` |
| `ict` | `#0D9488` | `--color-asset-ict` | `bg-asset-ict`, `text-asset-ict`, `border-asset-ict` |
| `hub_inovacao` | `#8B5CF6` | `--color-asset-hub` | `bg-asset-hub`, `text-asset-hub`, `border-asset-hub` |
| `centro_pd` | `#F59E0B` | `--color-asset-centro-pd` | `bg-asset-centro-pd`, `text-asset-centro-pd`, `border-asset-centro-pd` |
| `investimento` | `#EC4899` | `--color-asset-investimento` | `bg-asset-investimento`, `text-asset-investimento`, `border-asset-investimento` |
| `pesquisa` | `#64748B` | `--color-asset-pesquisa` | `bg-asset-pesquisa`, `text-asset-pesquisa`, `border-asset-pesquisa` |
| `outro` | `#94A3B8` | `--color-asset-outro` | `bg-asset-outro`, `text-asset-outro`, `border-asset-outro` |
