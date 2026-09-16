# 🔬 Relatório de Homologação Visual Real do Shadow: INEP × SECTI

**Etapa:** 2.6 — Homologação Visual Real no Frontend  
**Data da Homologação:** 16 de setembro de 2026  
**Ambiente:** Vite Dev Server + React SPA  
**Configuração de Alternância:** \`VITE_DATA_SOURCE=shadow\` ou localStorage \`@Secti_DataSource\`

---

## A. Telas e Componentes Testados no Frontend

| Tela / Módulo | Rota | Status de Renderização | Comportamento com Shadow |
| :--- | :---: | :---: | :--- |
| **Landing Hero** | \`/\` | 🟢 Sucesso | KPIs Globais recalculados dinamicamente (207 campi presenciais, 2.051 cursos CT&I). |
| **Painel Territorial** | \`/territorios\` | 🟢 Sucesso | Gráficos de barras por categoria institucional e áreas de conhecimento CT&I renderizados sem erros. |
| **Catálogo de Ativos** | \`/ativos\` | 🟢 Sucesso | Listagem de 224 campi (ou 207 com filtro presencial). Cards, badges de tipo e modais de detalhe operam normalmente. |
| **Catálogo de Cursos** | \`/cursos\` | 🟢 Sucesso | 2.051 cursos presenciais filtráveis por área estratégica, IES e município. |
| **Relatórios Analíticos** | \`/relatorio\` | 🟢 Sucesso | Tabelas de exportação e pré-visualização de impressão sem overflow. |
| **Página DEV de Comparação** | \`/dev/data-comparison\` | 🟢 Sucesso | Visualização em duas colunas, ranking municipal de divergências e inspetor de pontos. |

---

## B. Síntese das Diferenças Encontradas (Produção × Shadow)

1. **Expansão Quantitativa:**
   - **Campi Físicos:** Produção registra 174 ativos, enquanto o Shadow totaliza 224 ativos (+50 unidades físicas no estado).
   - **Campi de Graduação Presencial:** Produção possuía 154 campi presenciais efetivos; o Shadow consolida 207 unidades com turmas ativas comprovadas pelo Censo MEC 2023 (+33 presença líquida).
   - **Cursos Presenciais de CT&I:** De 742 na produção para 2.051 no Shadow (+1.309 cursos de graduação tecnológica e científica).
   - **Instituições Ativas:** De 57 IES na base histórica para 278 IES reguladas atuantes na Bahia.

2. **Novos Municípios com Oferta Superior Presencial (+6):**
   - **Amargosa:** Faculdade Regional do Valle (FARVALLE)
   - **Brumado:** UNIFG Brumado e Pitágoras Unopar
   - **Casa Nova:** Faculdade Alfredo Nasser (FAN)
   - **Ipirá:** Faculdade Eugênio Gomes (FEG)
   - **Monte Santo:** Faculdade do Sertão Baiano (FASBE)
   - **Santa Maria da Vitória:** Faculdade de Ciências e Tecnologia da Bahia (FACITE)

---

## C. Análise Visual e Experiência do Usuário (UI/UX)

- **Indicador Visual DEV:** O badge flutuante discreto \`SHADOW / HOMOLOGAÇÃO\` surge no canto inferior esquerdo exclusivamente em modo de desenvolvimento (\`import.meta.env.DEV\`) quando \`VITE_DATA_SOURCE=shadow\`. Em builds de produção, o código é eliminado automaticamente pelo compilador.
- **Gráficos no Dashboard (\`/territorios\`):** A ampliação de faculdades privadas no interior aumentou o volume da barra de privadas no gráfico de categorias de 80 para 129. O layout das barras manteve sua proporcionalidade e animações CSS sem distorção.
- **Performance de Renderização:** O carregamento assíncrono dos 224 campi é instantâneo (dados em memória local), sem travamento de scroll ou latência no mapa Leaflet.

---

## D. Problemas de Contagem Identificados na Produção

1. **Polos EAD Contados como Campi Físicos:** 6 registros na produção (UNIRB Camaçari, IFBA Euclides da Cunha, Ilhéus, Juazeiro, Seabra, UNIDOMPEDRO Ribeira do Pombal) eram salas de transmissão remota sem oferta de graduação presencial. No shadow foram isolados formalmente como \`polo_ead\`.
2. **Campi Técnicos Contados como Ensino Superior:** 7 campi dos Institutos Federais (IFBA Campo Formoso, Jaguaquara, Ubaitaba; IF Baiano Alagoinhas, Gov. Mangabeira, Itaberaba, Xique-Xique) atuam estritamente com ensino médio integrado e cursos técnicos. No shadow foram marcados como \`campus_tecnico\`.

---

## E. Duplicidades Aparentes

1. **UFSB em Itabuna (ID 75 e ID 76):** Dois registros com nomes muito parecidos (*UNIVERSIDADE FEDERAL DO SUL DA BAHIA* e *Universidade Federal do Sul do Bahia - Campus Jorge Amado*) ocupam a mesma localidade.
2. **UNIRB em Salvador (ID 127 e ID 141):** Ambos representam a presença da UNIRB na capital (um cadastrado como Faculdade e outro como Centro Universitário).

---

## F. Problemas Cartográficos no Mapa

1. **Sobreposição de Marcadores em Itabuna:** Devido aos IDs 75 e 76, o Leaflet renderiza dois pinos coincidentes no centro de Itabuna.
2. **Coordenada do IFBA Ubaitaba (ID 174):** O registro original da SECTI aponta a 15 km do perímetro urbano de Ubaitaba. A coordenada histórica foi preservada por governança, com marcação de alerta para auditoria técnica.

---

## G. Impacto nos Filtros

- **Filtro de Território (27 Territórios):** 100% funcional. Todos os 224 registros do shadow contêm \`id_territorio\` válido entre 1 e 27.
- **Filtro Semiárido:** 100% funcional. Todos os registros mantêm a flag booleana \`semiarido\`.
- **Filtro de Categoria:** 100% funcional. Mapeamento das 4 categorias (\`Federal\`, \`Estadual\`, \`Instituto Federal\`, \`Privada\`) preservado.

---

## H. Impacto nos Relatórios e Exportações em PDF

- **Relatório de Ativos (\`/relatorio/ativos\`):** As colunas de nome, sigla, tipo, município e território formatam perfeitamente para folha A4 em modo paisagem, sem quebra de layout.
- **Relatório de Cursos (\`/relatorio/cursos\`):** Suporta perfeitamente a paginação e exportação.

---

## I. Lista Oficial de Bloqueadores para Migração

| ID | Bloqueador | Severidade | Ação Obrigatória Pré-Migração |
| :---: | :--- | :---: | :--- |
| **BLK-01** | Duplicidade UFSB Itabuna (ID 75 e 76) | Alta | Fundir marcadores ou transformar ID 75 em sede administrativa. |
| **BLK-02** | Exclusão de Polos EAD do Mapa Físico | Alta | Manter filtro padrão \`modalidade === Presencial\` ativo nas camadas físicas. |
| **BLK-03** | Coordenada Distorcida do IFBA Ubaitaba | Média | Ajustar latitude/longitude para a sede física urbana do campus. |
| **BLK-04** | UNIRB Serrinha Inativa no Censo 2023 | Média | Deliberar se recebe etiqueta de "Campus Descontinuado" ou se é ocultada. |
| **BLK-05** | Rotulagem de 7 Campi Técnicos de IF | Alta | Inserir etiqueta visual obrigatória de "Educação Profissional / Ensino Técnico". |

---

## J. Conclusão e Prontidão Técnica

> 🛑 **STATUS DE MIGRAÇÃO: \`ready_for_production_migration: false\`**  
> 
> **Parecer da Auditoria:**  
> O dataset shadow atingiu **100% de compatibilidade estrutural** com o frontend. Não há quebra de código, não há campos faltantes e todos os componentes React funcionam de forma idêntica tanto em modo Produção quanto em modo Shadow.  
> No entanto, a migração definitiva para o banco relacional de produção exige a resolução deliberada dos **5 bloqueadores acima** para assegurar máxima fidelidade institucional e cartográfica.
