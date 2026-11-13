import { describe, it, expect } from 'vitest';
import {
  createEmptyDraft,
  getEntityItemId,
  getEntityItemLabel,
  applyCrudPatch,
  applyCadeiasDistribuicaoPatch,
  countDraftChanges,
  validateCrudForm,
} from '../../utils/crudDraft.js';

describe('Utilitários de Rascunho CRUD (crudDraft.test.js)', () => {
  it('extrai ID e rótulo corretamente por entidade', () => {
    expect(getEntityItemId('ativos', { id_ativo: 42, nome_ativo: 'PTB' })).toBe('42');
    expect(getEntityItemLabel('ativos', { nome_ativo: 'Parque Tecnológico' })).toBe('Parque Tecnológico');

    expect(getEntityItemId('cursos', { id_curso: 99, curso: 'Computação' })).toBe('99');
    expect(getEntityItemLabel('cursos', { curso: 'Computação' })).toBe('Computação');

    expect(getEntityItemId('cadeias', { id_cadeia: 7, entidade: 'Cacau Sul' })).toBe('7');
    expect(getEntityItemLabel('cadeias', { entidade: 'Cacau Sul' })).toBe('Cacau Sul');
  });

  it('aplica criações, edições e exclusões mantendo imutabilidade da base', () => {
    const base = [
      { id_ativo: 1, nome_ativo: 'CIMATEC', municipio: 'Salvador' },
      { id_ativo: 2, nome_ativo: 'CEPEDI', municipio: 'Ilhéus' },
    ];

    const patch = {
      added: [{ id_ativo: 'draft-1', nome_ativo: 'Hub Feira', municipio: 'Feira de Santana' }],
      updated: { '2': { nome_ativo: 'CEPEDI Atualizado' } },
      deleted: ['1'],
    };

    const result = applyCrudPatch(base, patch, 'ativos');

    expect(base).toHaveLength(2);
    expect(base[1].nome_ativo).toBe('CEPEDI');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id_ativo: 'draft-1', nome_ativo: 'Hub Feira', __crudStatus: 'added' });
    expect(result[1]).toMatchObject({ id_ativo: 2, nome_ativo: 'CEPEDI Atualizado', __crudStatus: 'updated' });
  });

  it('sincroniza distribuição de cadeias ao criar, editar ou excluir cadeias', () => {
    const baseDist = [
      { id_cadeia: 10, entidade: 'Cacau', municipio_sede: 'Ilhéus', nome_municipio: 'Ilhéus', tipo: 'IG' },
      { id_cadeia: 20, entidade: 'Sisaleira', municipio_sede: 'Valente', nome_municipio: 'Valente', tipo: 'APL' },
    ];

    const patch = {
      added: [{ id_cadeia: 'draft-c1', entidade: 'Café da Chapada', municipio_sede: 'Piatã', tipo: 'Indicação Geográfica Registrada' }],
      updated: { '10': { entidade: 'Cacau do Sul da Bahia' } },
      deleted: ['20'],
    };

    const res = applyCadeiasDistribuicaoPatch(baseDist, patch);
    expect(res).toHaveLength(2);
    expect(res[0].entidade).toBe('Café da Chapada');
    expect(res[0].nome_municipio).toBe('Piatã');
    expect(res[1].entidade).toBe('Cacau do Sul da Bahia');
  });

  it('contabiliza alterações pendentes no rascunho corretamente', () => {
    const draft = createEmptyDraft();
    draft.ativos.added.push({ id_ativo: 'draft-1', nome_ativo: 'Novo' });
    draft.cursos.updated['12'] = { curso: 'Editado' };
    draft.cadeias.deleted.push('5');

    const stats = countDraftChanges(draft);
    expect(stats.added).toBe(1);
    expect(stats.updated).toBe(1);
    expect(stats.deleted).toBe(1);
    expect(stats.total).toBe(3);
    expect(stats.byEntity).toEqual({ ativos: 1, cursos: 1, cadeias: 1 });
  });

  it('valida campos obrigatórios e coordenadas no formulário CRUD', () => {
    const invalidAtivo = validateCrudForm('ativos', {
      nome_ativo: '',
      tipo: '',
      municipio: '',
      latitude: 'abc',
      longitude: '-38.5',
    });
    expect(invalidAtivo.valid).toBe(false);
    expect(invalidAtivo.errors.nome_ativo).toBeTruthy();
    expect(invalidAtivo.errors.tipo).toBeTruthy();
    expect(invalidAtivo.errors.municipio).toBeTruthy();
    expect(invalidAtivo.errors.latitude).toBeTruthy();

    const validCurso = validateCrudForm('cursos', {
      curso: 'Engenharia de Software',
      entidade: 'UEFS',
      categoria: 'Engenharias e Tecnologias',
      municipio: 'Feira de Santana',
    });
    expect(validCurso.valid).toBe(true);
    expect(validCurso.errors).toEqual({});
  });
});

