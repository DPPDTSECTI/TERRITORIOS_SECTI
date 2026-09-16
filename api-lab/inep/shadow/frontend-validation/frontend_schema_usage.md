# 📱 Mapeamento de Consumo de Schema no Frontend: Produção × Shadow

**Etapa:** 2.5 — Homologação do Shadow no Frontend  
**Data:** 16/09/2026, 11:08:38  

---

## 1. Componentes Mapeados e Uso Real de Campos

### 🔹 `AtivosPage.jsx` (`src/components/AtivosPage.jsx`)
**Objetivo:** Visualização e filtragem interativa de campi e ativos de CT&I  
**Entidades Consumidas:** lista_ativos_cti (ativosData), tipo_ativos (tiposAtivos), stats_ti (selectedTerritory)

| Campo Utilizado | Tipo | Obrigatório | Uso no Componente |
| :--- | :---: | :---: | :--- |
| `id_ativo` | `number` | Sim | Chave única de identificação do ativo |
| `nome_ativo` | `string` | Sim | Título principal exibido no card e cabeçalho |
| `sigla` | `string` | Não | Sigla institucional para badge e busca rápida |
| `tipo` | `string` | Sim | Filtro de categoria, ícone e cor temática |
| `id_tipo_ativo` | `number` | Não | Mapeamento para paleta visual e ícone |
| `municipio` | `string` | Sim | Exibição de cidade e filtro geográfico |
| `id_municipio` | `number` | Não | Associação com tabela de municípios |
| `id_territorio` | `number` | Sim | Filtro por Território de Identidade |
| `territorio_identidade` | `string` | Sim | Nome do território para cabeçalho e agupamento |
| `latitude` | `number` | Sim | Plotagem cartográfica (lat) |
| `longitude` | `number` | Sim | Plotagem cartográfica (lng) |
| `semiarido` | `boolean` | Não | Filtro de recorte semiárido |
| `rnp` | `boolean` | Não | Badge de presença do Ponto de Presença RNP |
| `titulo_referencia` | `string` | Não | Rodapé de fonte de dados |
| `url_referencia` | `string` | Não | Link para fonte oficial no modal de detalhes |

---

### 🔹 `CursosPage.jsx` (`src/components/CursosPage.jsx`)
**Objetivo:** Visualização, busca e filtro de cursos superiores em CT&I  
**Entidades Consumidas:** lista_cursos_cti (cursosData), tipo_cursos (tiposCursos), lista_ativos_cti (ativosData)

| Campo Utilizado | Tipo | Obrigatório | Uso no Componente |
| :--- | :---: | :---: | :--- |
| `id` | `number` | Sim | Identificador do curso |
| `curso` | `string` | Sim | Nome da graduação/curso |
| `entidade` | `string` | Sim | Nome por extenso da IES ofertante |
| `sigla` | `string` | Não | Sigla da IES |
| `categoria` | `string` | Sim | Área do conhecimento de CT&I |
| `id_tipo_curso` | `number` | Não | Mapeamento visual da área |
| `id_ativo` | `number` | Não | Enlace com campus físico da IES no município |
| `municipio` | `string` | Sim | Município de oferta |
| `id_territorio` | `number` | Sim | Filtro por território |
| `territorio_identidade` | `string` | Sim | Exibição do território |
| `ead` | `boolean` | Sim | Filtro estrito: apenas cursos com ead === false são exibidos |

---

### 🔹 `DashboardPainel.jsx` (`src/components/DashboardPainel.jsx`)
**Objetivo:** Painel executivo de indicadores, gráficos e síntese territorial  
**Entidades Consumidas:** ativosData, cursosData, territoriosData, kpisGlobais

| Campo Utilizado | Tipo | Obrigatório | Uso no Componente |
| :--- | :---: | :---: | :--- |
| `tipo` | `string` | Sim | Gráfico de barras de distribuição por categoria institucional |
| `categoria` | `string` | Sim | Gráfico de cursos por área estratégica |
| `instituicao` | `string` | Não | Fallback institucional (instituicao || nome_ativo || entidade || sigla) |
| `id_territorio` | `number` | Sim | Agrupamento territorial |
| `territorio_identidade` | `string` | Sim | Rótulo dos gráficos |

---

### 🔹 `SideMap.jsx / PtiMap.jsx` (`src/components/maps/SideMap.jsx`)
**Objetivo:** Visualização geoespacial interativa com Leaflet e camadas temáticas  
**Entidades Consumidas:** ativos (campi), municipios, territorios

| Campo Utilizado | Tipo | Obrigatório | Uso no Componente |
| :--- | :---: | :---: | :--- |
| `id_ativo` | `number` | Não | ID para seleção de ponto |
| `latitude` | `number` | Sim | Coordenada Y no mapa |
| `longitude` | `number` | Sim | Coordenada X no mapa |
| `nome_ativo` | `string` | Sim | Popup e tooltip do marcador |
| `sigla` | `string` | Não | Texto curto sobreposto no ícone |
| `tipo` | `string` | Sim | Cor do marcador e filtragem de camadas |
| `municipio` | `string` | Sim | Localização do ativo no popup |
| `territorio_identidade` | `string` | Sim | Associação com polígono do território |

---

### 🔹 `RelatorioPage.jsx / RelatorioAtivos.jsx` (`src/components/RelatorioPage.jsx`)
**Objetivo:** Tabelas analíticas, impressão e exportação em PDF dos ativos e cursos  
**Entidades Consumidas:** ativosData, cursosData, territoriosData

| Campo Utilizado | Tipo | Obrigatório | Uso no Componente |
| :--- | :---: | :---: | :--- |
| `nome_ativo` | `string` | Sim | Coluna "Nome do Ativo" |
| `sigla` | `string` | Não | Coluna "Sigla" |
| `tipo` | `string` | Sim | Coluna "Tipo de Ativo" |
| `municipio` | `string` | Sim | Coluna "Município" |
| `territorio_identidade` | `string` | Sim | Coluna "Território" |
| `curso` | `string` | Não | Relatório de cursos |
| `categoria` | `string` | Não | Área do conhecimento |


---

## 2. Garantia de Compatibilidade com o Dataset Shadow

1. **Campos Obrigatórios:** Todos os campos obrigatórios (`id_ativo`, `nome_ativo`, `sigla`, `tipo`, `municipio`, `id_territorio`, `territorio_identidade`, `latitude`, `longitude`) encontram-se **100% preenchidos** no shadow.
2. **Nenhum Campo Faltante:** Nenhuma propriedade existente em produção foi suprimida.
3. **Novos Registros INEP:** Possuem `id_ativo = null`, impedindo colisão com IDs reais do banco relacional.
4. **Filtros Preservados:** Filtro territorial (`id_territorio`), filtro semiárido (`semiarido`) e filtro de categoria (`tipo`) operam perfeitamente sem alteração de assinaturas.
