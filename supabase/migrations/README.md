# Histórico Local de Migrations — `db_territorios` (`vicaqpcluxkwbbbwdpkg`)

Este diretório registra as migrations versionadas a partir da **Onda 0.1** da reestruturação dos Ativos de CT&I do projeto **Territórios SECTI**.

## Contexto do Schema Legado

1. **Schema pré-existente no Supabase:** O projeto `db_territorios` (ID `vicaqpcluxkwbbbwdpkg`, PostgreSQL 17.6, região `sa-east-1`) possui um schema legado pré-existente criado fora deste repositório antes da Onda 0.1, incluindo tabelas operacionais e views no schema `public`:
   - **Tabelas operacionais legadas:** `ativos_cti`, `tipo_ativos`, `referencias`, `municipios`, `regiao_identidade`, `cursos`, `tipo_cursos`, `cadeias_produtivas`, `cadeia_municipio`, `tipo_cadeia`, `firjan`.
   - **Views legadas:** `lista_ativos_cti`, `stats_ti`, `distribuicao_cadeias`, `lista_cadeia_produtiva`, `lista_cursos_cti`, `lista_municipioxterritorio`.

2. **Pré-requisito das migrations aqui registradas:** A migration [`20261124155639_onda_0_1_backup_integral_pre_migracao.sql`](./20261124155639_onda_0_1_backup_integral_pre_migracao.sql) pressupõe a existência prévia dessas tabelas e views originais no schema `public` (especialmente `ativos_cti`, `tipo_ativos`, `referencias` e `stats_ti`).

3. **Escopo incompleto para reconstrução do zero:** O conteúdo atual de `supabase/migrations/` **não** representa o histórico completo desde a criação inicial do banco e **não** é suficiente para reconstruir o banco `db_territorios` do zero em um ambiente limpo.

4. **Reconstrução futura planejada em etapa dedicada:** Nenhum dump sintético ou migration inicial retroativa foi gerado neste momento. A eventual reconstrução ou baseline formal do schema legado será planejada e validada em etapa dedicada, preservando integridade e consistência com o histórico remoto (`supabase_migrations.schema_migrations`).

## Alerta Operacional

> [!CAUTION]
> **NÃO execute** `supabase db push`, `supabase db reset`, `supabase migration repair` ou qualquer rotina automatizada de reconstrução/sincronização contra ambientes remotos ou locais enquanto o schema legado não estiver formalmente baselineado e sem estratégia explícita de sincronização aprovada.
>
> - `supabase db reset` falharia por dependência das tabelas e views legadas ausentes deste histórico local, ou destruiria dados em um banco alvo se executado indevidamente.
> - `supabase db push` sem alinhamento prévio de histórico remoto/local pode gerar conflito de versões ou tentativa de reaplicação de objetos já existentes.
