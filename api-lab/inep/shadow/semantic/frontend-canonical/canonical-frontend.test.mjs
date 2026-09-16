import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_VALIDATION_JSON = path.resolve(__dirname, 'canonical-validation.json');
const FILE_READINESS_FINAL_JSON = path.resolve(__dirname, 'migration-readiness-final.json');

describe('ETAPA 2.9 — Testes de Homologação Canônica do Frontend', () => {
  it('arquivos de validação e prontidão final devem existir', () => {
    expect(fs.existsSync(FILE_VALIDATION_JSON)).toBe(true);
    expect(fs.existsSync(FILE_READINESS_FINAL_JSON)).toBe(true);
  });

  const valPayload = JSON.parse(fs.readFileSync(FILE_VALIDATION_JSON, 'utf-8'));
  const readiness = JSON.parse(fs.readFileSync(FILE_READINESS_FINAL_JSON, 'utf-8'));

  it('deve validar todos os KPIs canônicos diretamente na auditoria de interface', () => {
    expect(valPayload.kpis.infraestrutura_fisica_total).toBe(217);
    expect(valPayload.kpis.ensino_superior_presencial_confirmado).toBe(204);
    expect(valPayload.kpis.ensino_superior_presencial_com_ambiguos).toBe(207);
    expect(valPayload.kpis.ensino_tecnico).toBe(7);
    expect(valPayload.kpis.pesquisa_extensao).toBe(2);
    expect(valPayload.kpis.administrativo).toBe(1);
    expect(valPayload.kpis.ead).toBe(6);
    expect(valPayload.kpis.unidades_inativas).toBe(1);
    expect(valPayload.kpis.unidades_totais).toBe(224);
  });

  it('deve validar a pureza dos filtros por categoria sem vazamento de registros', () => {
    expect(valPayload.filtro_audit.status).toBe('SUCESSO');
    expect(valPayload.filtro_audit.filtros.ensino_superior).toBe(207);
    expect(valPayload.filtro_audit.filtros.tecnico).toBe(7);
    expect(valPayload.filtro_audit.filtros.pesquisa).toBe(2);
    expect(valPayload.filtro_audit.filtros.administrativo).toBe(1);
    expect(valPayload.filtro_audit.filtros.ead).toBe(6);
    expect(valPayload.filtro_audit.filtros.inativo).toBe(1);
  });

  it('deve validar a auditoria cartográfica do mapa (217 pontos físicos, 7 excluídos)', () => {
    expect(valPayload.mapa_audit.status).toBe('VALIDADO');
    expect(valPayload.mapa_audit.pontos_plotados_obtidos).toBe(217);
    expect(valPayload.mapa_audit.pontos_excluidos).toBe(7);
    expect(valPayload.mapa_audit.ead_excluidos).toBe(6);
    expect(valPayload.mapa_audit.inativas_excluidas).toBe(1);
    expect(valPayload.mapa_audit.detalhamento_fisico.superior_confirmado).toBe(204);
    expect(valPayload.mapa_audit.detalhamento_fisico.ambiguos).toBe(3);
    expect(valPayload.mapa_audit.detalhamento_fisico.tecnicos).toBe(7);
    expect(valPayload.mapa_audit.detalhamento_fisico.pesquisa).toBe(2);
    expect(valPayload.mapa_audit.detalhamento_fisico.administrativo).toBe(1);
  });

  it('deve cobrir exatamente os 27 territórios de identidade na auditoria territorial', () => {
    expect(valPayload.auditoria_territorios.length).toBe(27);
    for (const t of valPayload.auditoria_territorios) {
      expect(t.id_territorio).toBeGreaterThanOrEqual(1);
      expect(t.id_territorio).toBeLessThanOrEqual(27);
      expect(typeof t.territorio).toBe('string');
      expect(typeof t.infraestrutura_fisica).toBe('number');
      expect(typeof t.ensino_superior).toBe('number');
      expect(typeof t.tecnico).toBe('number');
    }
  });

  it('deve validar a conformidade de relatórios e exportação PDF', () => {
    expect(valPayload.relatorios_pdf_audit.status).toBe('CONFORME');
    expect(valPayload.relatorios_pdf_audit.ead_fora_campi_presenciais).toBe(true);
    expect(valPayload.relatorios_pdf_audit.tecnico_rotulado_corretamente).toBe(true);
    expect(valPayload.relatorios_pdf_audit.pesquisa_isolada_sem_graduacao).toBe(true);
    expect(valPayload.relatorios_pdf_audit.admin_nao_conta_como_instituicao_ensino).toBe(true);
    expect(valPayload.relatorios_pdf_audit.inativa_oculta_das_listas_ativas).toBe(true);
  });

  it('deve manter ready_for_production estritamente como false', () => {
    expect(readiness.ready_for_production).toBe(false);
    expect(readiness.data_model_ok).toBe(true);
    expect(readiness.kpi_ok).toBe(true);
    expect(readiness.filters_ok).toBe(true);
    expect(readiness.map_ok).toBe(true);
    expect(readiness.reports_ok).toBe(true);
    expect(readiness.pdf_ok).toBe(true);
    expect(readiness.canonical_ok).toBe(true);
    expect(readiness.blockers.length).toBe(5);
  });
});
