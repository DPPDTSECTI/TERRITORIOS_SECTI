# ETAPA 3.2 — RELATÓRIO DO ADAPTER DE PRODUÇÃO → MODELO CANÔNICO

**Data:** 16/09/2026  
**Status do Adapter:** HOMOLOGADO E CONFORME  
**Estratégia:** Derivação semântica em camada de software (sem mutações no banco de dados)  
**Schema Alvo:** `api-lab/inep/shadow/semantic/unidade-canonica.schema.json`

---

## 1. Arquitetura do Adapter

O adapter resolve a incompatibilidade estrutural do banco de produção (que possui `id_tipo_ativo` limitado de 1 a 10 e não dispõe de coluna `ativo`) através de transformação em tempo de execução:

```
[ Supabase Legado: lista_ativos_cti (174) ]
                   │
                   ▼
     ┌───────────────────────────┐
     │   production-adapter.mjs  │ ◄── Regras de Negócio Homologadas
     └───────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
[ canonical-units (174) ]  [ pending-inep.json (50) ]
```

---

## 2. Quantitativos do Adapter de Produção

| Categoria Canônica Derivada | Qtd | Presença Física | Oferta Presencial | Ativo | Regra de Derivação Aplicada |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`ensino_superior_presencial`** | **154** | Sim | Sim | Sim | Campi confirmados no Censo INEP 2023 (inclui ID 75 preservado) |
| **`ambigua`** | **3** | Sim | Sim | Sim | IDs 1 (UNIRB Alagoinhas), 19 (UNIAENE Cachoeira) e 76 (UFSB Itabuna) |
| **`ensino_tecnico`** | **7** | Sim | Sim | Sim | IDs 5, 27, 58, 71, 83, 174, 188 (sem alteração de `id_tipo_ativo`) |
| **`pesquisa_extensao`** | **2** | Sim | Não | Sim | IDs 28 e 88 (centros avançados da UNEB) |
| **`administrativo`** | **1** | Sim | Não | Sim | ID 132 (Reitoria IF Baiano em Salvador) |
| **`ead`** | **6** | Não | Não | Sim | IDs 23, 38, 64, 92, 112, 158 (desvinculados da infraestrutura física) |
| **`inativa`** | **1** | Não | Não | Não | ID 164 (UNIRB Serrinha - derivada como `ativo = false`) |
| **TOTAL DERIVADO DE PRODUÇÃO** | **174** | **167** | **164** | **173** | **100% dos registros legados preservados** |

---

## 3. Conformidade com as Regras da Etapa 3.2

1. **UFSB Itabuna (IDs 75 e 76):**
   - Ambos os registros foram **preservados integralmente** no adapter.
   - Nenhuma deduplicação destrutiva foi aplicada.
   - O ID 76 permanece etiquetado como `ambigua` e o ID 75 como confirmado, mantendo a rastreabilidade cadastral.
2. **6 Polos EAD:**
   - O banco relacional permanece intocado (nenhum UPDATE foi executado).
   - No adapter, recebem `tipo_unidade = 'ead'`, `presenca_fisica = false`, `oferta_presencial = false`.
3. **7 Campi Técnicos:**
   - O `id_tipo_ativo = 5` (`Campi Instituto Federal`) original foi mantido.
   - No adapter, recebem `tipo_unidade = 'ensino_tecnico'`, `nivel_ensino: ['tecnico']`.
4. **Centros de Pesquisa (28 e 88) e Reitoria (132):**
   - Derivados respectivamente como `pesquisa_extensao` e `administrativo`, com `oferta_presencial: false`.
5. **UNIRB Serrinha (ID 164):**
   - O banco legado não foi alterado e nenhuma coluna foi adicionada.
   - O adapter deriva logicamente: `ativo = false`, `tipo_unidade = 'inativa'`, `status_reconciliacao = 'nao_localizada'`.
6. **Segregação dos 50 Novos INEP:**
   - Nenhum novo registro foi inserido no Supabase.
   - O arquivo [`pending-inep.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/production-adapter/pending-inep.json) isola as 50 unidades com chave de idempotência para futura composição.

---

## 4. Equações de Fechamento Matemático

- **Infraestrutura Física Real Legada:**
  $$mathbf{154 + 3 + 7 + 2 + 1 = 167}$$
- **Censo Total de Unidades Legadas:**
  $$mathbf{167 + 6 + 1 = 174}$$
- **Composição Futura (Supabase Legado + 50 Novos INEP):**
  - Infraestrutura Física Total: $167 + 50 = mathbf{217}$
  - Universo Geral Canônico: $174 + 50 = mathbf{224}$
