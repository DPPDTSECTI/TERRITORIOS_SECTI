# Adapters de Dados — `src/data/adapters/`

## Visão Geral

Esta pasta contém a **camada de integração de dados** do painel SECTI.
O frontend nunca acessa Supabase, INEP, shadow ou artefatos de homologação diretamente.
Toda a lógica de composição e normalização está aqui.

```
SECTI/Supabase ──────────────┐
                              ├──► canonicalAdapter.js ──► getCanonicalUnits()
INEP (memória)  ──────────────┘                           getCanonicalCourses()
                                                          getCanonicalInstitutions()
                                                               │
                                                               ▼
                                                         DataContext.jsx
                                                               │
                                                               ▼
                                                     Componentes React
```

---

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `config.js` | Controla `DATA_SOURCE` (produção sempre = `production-composed`) |
| `sectiAdapter.js` | Leitura dos 174 registros legados do Supabase |
| `inepAdapter.js` | Gerencia os 50 registros INEP em memória (`id_ativo = null`) |
| `canonicalAdapter.js` | Composição 174 + 50 = 224 unidades; interface única do frontend |

---

## Interface Pública (canonicalAdapter.js)

```js
import {
  getCanonicalUnits,        // → 224 unidades com shape compatível
  getCanonicalCourses,      // → { presenciais, ead }
  getCanonicalInstitutions, // → metadados territoriais e de suporte
  getCanonicalTiposAtivos,  // → tabela de tipos canônica
} from './canonicalAdapter';
```

---

## Como adicionar uma nova fonte de dados

1. **Criar `novaFonteAdapter.js`** nesta pasta:
   - Exportar uma função `fetchNovaFonteUnits()` que retorna `Array<UnidadeCanonica>`
   - Garantir que o shape de saída respeite `unidade-canonica.schema.json` (em `api-lab/inep/shadow/semantic/`)

2. **Adicionar ao `canonicalAdapter.js`**:
   - Importar `fetchNovaFonteUnits` 
   - Incluir no `Promise.all` de `getCanonicalUnits()`
   - Adicionar campo `origem: 'nova_fonte'` nos registros

3. **Adicionar à `config.js`**:
   - Incluir novo valor em `DATA_SOURCES` se for um modo distinto

4. **Atualizar `adapters.test.mjs`**:
   - Ajustar os totais esperados
   - Adicionar teste de `origem === 'nova_fonte'`

5. **Atualizar `docs/arquitetura-dados.md`**:
   - Documentar o novo fluxo

---

## Regras de Governança

- ❌ **Nunca executar INSERT/UPDATE/DELETE no Supabase nesta camada**
- ❌ **Nunca importar `supabase` diretamente fora de `sectiAdapter.js`**
- ❌ **Nunca importar arquivos de `api-lab/` a partir do frontend**
- ✅ **Registros INEP sempre com `id_ativo = null` e `origem = "inep"`**
- ✅ **Registros SECTI sempre com `origem = "secti"`**
