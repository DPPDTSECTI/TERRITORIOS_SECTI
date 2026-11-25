CREATE OR REPLACE VIEW public.lista_ativos_cti AS
SELECT
    a.id_ativo,
    a.nome_ativo,
    a.sigla,
    a.rnp,
    t.id_tipo_ativo,
    t.nome_tipo AS tipo,
    m.id_municipio,
    m.nome_municipio AS municipio,
    m.semiarido,
    a.latitude,
    a.longitude,
    ti.id_territorio,
    ti.nome_territorio AS territorio_identidade,
    r.titulo_referencia,
    r.texto_referencia,
    r.url_referencia,
    a.id_instituicao,
    a.parceiro_local,
    i.nome_instituicao,
    i.sigla AS sigla_instituicao,
    i.ict_status,
    i.natureza_institucional AS natureza_instituicao,
    i.site_oficial
FROM public.ativos_cti a
    LEFT JOIN public.municipios m ON a.id_municipio = m.id_municipio
    LEFT JOIN public.tipo_ativos t ON a.id_tipo_ativo = t.id_tipo_ativo
    LEFT JOIN public.regiao_identidade ti ON m.id_territorio = ti.id_territorio
    LEFT JOIN public.referencias r ON a.id_referencia = r.id_referencia
    LEFT JOIN public.instituicoes i ON a.id_instituicao = i.id_instituicao;
