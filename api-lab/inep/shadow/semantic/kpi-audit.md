# ETAPA 2.8 — AUDITORIA FINAL DOS KPIs CANÔNICOS

**Data de Realização:** 16 de Setembro de 2026  
**Status da Auditoria:** VALIDADO COM 100% DE FECHAMENTO MATEMÁTICO  
**Escopo:** Modelo Canônico de Unidades Territoriais (`api-lab/inep/shadow/semantic/`)  
**Base Auditada:** 224 unidades territoriais (174 legadas SECTI + 50 novas presenciais INEP)

---

## 1. Definições Formais dos KPIs

| Nº | KPI | Definição Lógica / Filtro | Valor | Detalhamento Semântico |
| :-: | :--- | :--- | :-: | :--- |
| **1** | **`infraestrutura_fisica_total`** | `presenca_fisica === true` | **217** | Todas as unidades prediais com infraestrutura física real no solo baiano. |
| **2** | **`infraestrutura_fisica_ativa`** | `presenca_fisica === true && ativo === true` | **217** | Unidades físicas ativas em operação regular (idêntico ao total físico pois a inativa não possui presença física). |
| **3** | **`ensino_superior_presencial_confirmado`** | `tipo_unidade === "ensino_superior_presencial"` | **204** | 154 campi confirmados da SECTI + 50 novas presenças físicas identificadas pelo INEP. |
| **4** | **`ensino_superior_presencial_com_ambiguos`** | `tipo_unidade === "ensino_superior_presencial" \|\| tipo_unidade === "ambigua"` | **207** | 204 confirmados + 3 unidades ativas de ensino superior sob averiguação cadastral. |
| **5** | **`ensino_tecnico`** | `tipo_unidade === "ensino_tecnico"` | **7** | Unidades do IFBA e IF Baiano que ofertam exclusivamente educação profissionalizante. |
| **6** | **`pesquisa_extensao`** | `tipo_unidade === "pesquisa_extensao"` | **2** | Centros avançados de pesquisa científica e extensão comunitária (UNEB Canudos e Jeremoabo). |
| **7** | **`administrativo`** | `tipo_unidade === "administrativo"` | **1** | Prédios administrativos e reitorias sem oferta direta de aulas (Reitoria IF Baiano Salvador). |
| **8** | **`ead`** | `tipo_unidade === "ead"` | **6** | Polos de apoio presencial exclusivamente EAD herdados do cadastro original. |
| **9** | **`unidades_inativas`** | `ativo === false` | **1** | Unidade inativa no Censo da Educação Superior 2023 (FACULDADE UNIRB - SERRINHA, ID 164). |
| **10** | **`unidades_totais`** | Todos os registros da base | **224** | Censo exaustivo de todas as unidades territoriais mapeadas. |

*Nota de Nomenclatura*: Seguindo rigorosamente as diretrizes, não se utiliza o termo genérico "campi" para os KPIs agregadores, visto que a base engloba centros de pesquisa, polos EAD, prédios administrativos e unidades técnicas.

---

## 2. Matriz de Classificação × Inclusão nos KPIs

Esta matriz evidencia como cada uma das 7 categorias canônicas contribui para os KPIs agregadores:

| Categoria Canônica (`tipo_unidade`) | Qtd | Presença Física | Ativo | Infra. Física Total (1) | Sup. Confirmado (3) | Sup. c/ Ambíguos (4) | Técnico (5) | Pesquisa (6) | Admin (7) | EAD (8) | Inativa (9) |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **`ensino_superior_presencial`** | 204 | Sim | Sim | **SIM** | **SIM** | **SIM** | Não | Não | Não | Não | Não |
| **`ambigua`** | 3 | Sim | Sim | **SIM** | Não | **SIM** | Não | Não | Não | Não | Não |
| **`ensino_tecnico`** | 7 | Sim | Sim | **SIM** | Não | Não | **SIM** | Não | Não | Não | Não |
| **`pesquisa_extensao`** | 2 | Sim | Sim | **SIM** | Não | Não | Não | **SIM** | Não | Não | Não |
| **`administrativo`** | 1 | Sim | Sim | **SIM** | Não | Não | Não | Não | **SIM** | Não | Não |
| **`ead`** | 6 | Não | Sim | Não | Não | Não | Não | Não | Não | **SIM** | Não |
| **`inativa`** | 1 | Não | Não | Não | Não | Não | Não | Não | Não | Não | **SIM** |
| **TOTAL DE UNIDADES** | **224** | **217** | **223** | **217** | **204** | **207** | **7** | **2** | **1** | **6** | **1** |

---

## 3. Validação Matemática das Equações de Fechamento

### Equação 1 — Fechamento da Infraestrutura Física Real:
$$\text{ensino\_superior\_presencial\_confirmado} + \text{ambigua} + \text{ensino\_tecnico} + \text{pesquisa\_extensao} + \text{administrativo} = \text{infraestrutura\_fisica\_total}$$

$$204 + 3 + 7 + 2 + 1 = 217$$

- **Resultado:** **217** unidades prediais físicas reais no estado da Bahia.
- **Status:** **VALIDADO (100% FECHADO)**

---

### Equação 2 — Fechamento do Censo Total de Unidades:
$$\text{infraestrutura\_fisica\_total} + \text{ead} + \text{unidades\_inativas} = \text{unidades\_totais}$$

$$217 + 6 + 1 = 224$$

- **Decomposição Analítica Completa:**
$$204 + 3 + 7 + 2 + 1 + 6 + 1 = 224$$

- **Resultado:** **224** unidades registradas no modelo canônico (174 SECTI legadas + 50 novas INEP).
- **Status:** **VALIDADO (100% FECHADO)**

---

## 4. Garantias de Integridade Respeitadas

1. **Classificação Intacta:** A taxonomia dos 224 registros permaneceu rigorosamente inalterada em relação ao arquivo `canonical-units.json`.
2. **Nenhuma Nova Categoria:** O universo de categorias é exatamente as 7 canônicas (`ensino_superior_presencial`, `ambigua`, `ensino_tecnico`, `pesquisa_extensao`, `administrativo`, `ead`, `inativa`).
3. **Nenhum Registro Eliminado:** O dataset preserva 100% dos 174 ativos SECTI e os 50 novos registros INEP.
4. **Produção Preservada:** Nenhuma alteração foi realizada nos arquivos em `src/`, `public/data/` ou nos datasets em produção.
