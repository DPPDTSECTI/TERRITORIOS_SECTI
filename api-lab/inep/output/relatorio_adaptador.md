# 🔄 Relatório Analítico: Camada de Adaptação INEP → Modelo SECTI (Etapa 2.1)

**Data de Execução:** 16/09/2026, 10:38:11  
**Origem dos Dados Adaptados:** Microdados do Censo da Educação Superior 2023 (MEC/INEP)  
**Destino Estrutural:** Modelo de Dados do Painel TERRITÓRIOS SECTI

---

## 1. Mapeamento de Atributos e Campos

### A) Campos Preservados (Mapeamento Direto 1:1)
Campos presentes no Censo do INEP que coincidem conceitual e funcionalmente com as colunas esperadas pelo frontend da SECTI:
- `curso` ⟵ `NO_CURSO`
- `entidade` ⟵ `NO_IES`
- `sigla` ⟵ `SG_IES`
- `municipio` ⟵ `NO_MUNICIPIO`
- `codigo_ibge` ⟵ `CO_MUNICIPIO`
- `ead` ⟵ `TP_MODALIDADE_ENSINO === 2`

### B) Campos Novos Oferecidos pelo INEP (Enriquecimento)
Campos do Censo que foram incorporados nos metadados (`_inep`) de cada registro para auditoria e expansões futuras:
- `codigo_curso`: Identificador oficial do MEC/INEP para o curso superior.
- `codigo_ies`: Identificador governamental único da instituição mantenedora/IES.
- `tipo_curso`: Grau acadêmico normativo (*Bacharelado*, *Licenciatura*, *Tecnológico*).
- `rotulo_cine`: Denominação padronizada nacional da formação conforme a taxonomia CINE Brasil.
- `tipo_instituicao`: Organização acadêmica formal (*Universidade*, *Centro Universitário*, *Faculdade*, *Instituto Federal*).
- `categoria_administrativa`: Enquadramento jurídico original (*Pública Federal*, *Pública Estadual*, *Privada com fins lucrativos*, *Privada sem fins lucrativos*).

### C) Campos Ausentes no INEP
Atributos essenciais ao funcionamento do dashboard que **NÃO constam no Censo federal**:
- `id_territorio` e `territorio_identidade`: O INEP não possui a divisão estadual dos 27 Territórios de Identidade da Bahia.
- `latitude` e `longitude` de campi: O INEP disponibiliza o código do município, mas não geolocaliza prédios físicos ou polos.
- `rnp`: Indicador de conexão da instituição ao backbone de alta velocidade da Rede Nacional de Ensino e Pesquisa.
- `id_ativo`: Chave primária do catálogo geral de ativos e equipamentos de CT&I da SECTI.

### D) Campos Mantidos pela SECTI via Adaptador
O adaptador preenche os campos ausentes acima de forma consistente através dos seguintes mecanismos:
1. **Territórios de Identidade**: Mapeados a partir de `utils/territorioMunicipios.json` cruzando o `codigo_ibge` de 7 dígitos.
2. **Semiárido**: Injetado automaticamente comparando o município com a delimitação oficial de `src/constants/semiarido.js`.
3. **Coordenadas**: Recuperadas de `src/data/municipiosCoords.js` e do snapshot de campi da SECTI (`secti_campi_atual.json`).
4. **Vínculo com Campi (`id_ativo`)**: Associado quando a IES possui campus presencial pré-cadastrado no município correspondente.

---

## 2. Diferenças Quantitativas e Estruturais

| Dimensão | Base SECTI Atual | Adaptado INEP (Total) | Adaptado INEP (Recorte CT&I Presencial) | Diagnóstico |
| :--- | :---: | :---: | :---: | :--- |
| **Cursos** | **642** | **38.356** | **992** | A base atual da SECTI foca em 642 cursos de graduação presencial em CT&I. O INEP adiciona mais 350 cursos presenciais dessas 5 áreas e 36.358 polos EAD. |
| **Campi Educacionais** | **174** | **327** | **174 validados** | No INEP presencial foram identificadas 327 relações (IES × Município), cobrindo 100% dos 174 campi SECTI e mapeando 153 novos polos/faculdades privadas. |
| **Instituições de Ensino** | **~80** | **232** | **83** | O INEP expande o mapeamento institucional registrando todas as faculdades privadas do interior do Estado. |
| **Municípios com Cursos** | **64** | **417** | **82** | A oferta presencial de CT&I alcança 82 municípios baianos (contra 64 na base SECTI restrita). A oferta EAD cobre todos os 417 municípios. |

---

## 3. Análise de Divergências

### A) Diferenças de Nomes
- Variações ortográficas menores encontradas em **0** cursos (ex: acentuação de *Ciência* vs *Ciencia* e conectivos *de* vs *da*).
- Nas instituições, o INEP utiliza prioritariamente a Razão Social completa cadastrada no MEC (ex: *UNIVERSIDADE SALVADOR*), enquanto a SECTI adota a denominação consagrada pelo público (ex: *Universidade Salvador (UNIFACS)*).

### B) Diferenças de Município
- **0 municípios sem correspondência**. Todos os cursos presenciais e polos mapeados pertencem a municípios válidos com códigos IBGE homologados da Bahia.

### C) Diferenças de Modalidade
- **Base SECTI Atual**: Concentrada estritamente na modalidade presencial para o cômputo dos indicadores principais do painel.
- **Base INEP**: Contempla 1.998 cursos presenciais e 36.358 polos EAD. O adaptador isola o campo `ead: boolean` para que o dashboard continue aplicando o filtro `c.ead === false` sem inflar os rankings municipais.

### D) Diferenças de Categoria Administrativa
- **Taxonomia INEP**: Utiliza códigos numéricos de 1 a 7 (*Pública Federal, Estadual, Municipal, Privada com e sem fins lucrativos*).
- **Taxonomia SECTI**: Mapeia para o padrão de filtros do painel:
  - *Pública Federal* ⟶ `federal` (`Campi Universidade Pública - Federal`)
  - *Pública Estadual* ⟶ `estadual` (`Campi Universidade Pública - Estadual`)
  - *IFBA / IF Baiano* ⟶ `institutoFederal` (`Campi Instituto Federal`)
  - *Privadas* ⟶ `privada` (`Campi Universidade Privada`)

---

## 4. Snapshots Gerados

1. [`api-lab/inep/output/cursos_secti_inep.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/output/cursos_secti_inep.json)
2. [`api-lab/inep/output/campi_secti_inep.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/output/campi_secti_inep.json)
3. [`api-lab/inep/output/instituicoes_secti_inep.json`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/output/instituicoes_secti_inep.json)

---

## 5. Parecer e Próximos Passos
A camada de adaptação comprovou que é tecnicamente viável alimentar os componentes de cursos e instituições do dashboard com os dados do Censo do INEP enriquecidos com a geografia SEPLAN, mantendo 100% de compatibilidade de interface.
