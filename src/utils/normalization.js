/**
 * Utilitários de Normalização e Filtragem de Dados
 */

/**
 * Normaliza uma string removendo acentos, caracteres especiais e convertendo para minúsculas.
 * Exemplo: "Vitória da Conquista!" -> "vitoria da conquista"
 */
export function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove acentos e caracteres especiais para gerar chaves seguras e consistentes.
 */
export function safeKey(k) {
  return String(k || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Corrige capitalizações e siglas em textos mantendo acrônimos em maiúsculo (ex: UFBA, IFBA).
 */
export function fixWeirdCapitalization(str) {
  if (!str || typeof str !== 'string') return str;
  return str.split(' ').map(word => {
    const letters = word.replace(/[^a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '');
    if (letters.length < 3) return word.replace(/(?<=[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ])([A-Z])/g, (match) => match.toLowerCase());
    const upperCount = (letters.match(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g) || []).length;
    const ratio = upperCount / letters.length;
    if (ratio > 0.5) return word.toLocaleUpperCase('pt-BR');
    return word.replace(/(?<=[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ])([A-Z])/g, (match) => match.toLowerCase());
  }).join(' ');
}

/**
 * Expande nomes informais de instituições para os seus nomes oficiais completos.
 */
export function expandirNomeEntidade(nomeRaw, tipoRaw = '', isCadeia = false) {
  let nome = String(nomeRaw || '').trim();
  let tipoNorm = normalize(tipoRaw);

  const isEcossistema = ['incubadora', 'parque', 'espacoDinamizadores', 'pesquisa', 'dinamizador', 'ict'].some(term => tipoNorm.includes(term));

  if (!isEcossistema && !isCadeia) {
    let nomeNorm = normalize(nome).replace(/\b(campus|polo|unidade|centro de|ead|departamento)\b.*$/g, '').trim();

    const dicionario = [
      { padrao: /\b(ufba|universidade federal da bahia)\b/, oficial: 'Universidade Federal da Bahia (UFBA)' },
      { padrao: /\b(ufrb|reconcavo da bahia|reconcavo)\b/, oficial: 'Universidade Federal do Recôncavo da Bahia (UFRB)' },
      { padrao: /\b(ufob|oeste da bahia)\b/, oficial: 'Universidade Federal do Oeste da Bahia (UFOB)' },
      { padrao: /\b(ufsb|sul da bahia)\b/, oficial: 'Universidade Federal do Sul da Bahia (UFSB)' },
      { padrao: /\b(univasf|vale do sao francisco)\b/, oficial: 'Universidade Federal do Vale do São Francisco (UNIVASF)' },
      { padrao: /\b(uneb|estado da bahia|estadual da bahia)\b/, oficial: 'Universidade do Estado da Bahia (UNEB)' },
      { padrao: /\b(uesc|santa cruz)\b/, oficial: 'Universidade Estadual de Santa Cruz (UESC)' },
      { padrao: /\b(uesb|sudoeste da bahia|sudoeste)\b/, oficial: 'Universidade Estadual do Sudoeste da Bahia (UESB)' },
      { padrao: /\b(uefs|feira de santana)\b/, oficial: 'Universidade Estadual de Feira de Santana (UEFS)' },
      { padrao: /\b(ifbaiano|if baiano|tecnologia baiano)\b/, oficial: 'Instituto Federal Baiano (IF BAIANO)' },
      { padrao: /\b(ifba|instituto federal da bahia|ciencia e tecnologia da bahia)\b/, oficial: 'Instituto Federal da Bahia (IFBA)' },
      { padrao: /\b(senai|cimatec)\b/, oficial: 'Serviço Nacional de Aprendizagem Industrial (SENAI)' },
      { padrao: /\b(senac)\b/, oficial: 'Serviço Nacional de Aprendizagem Comercial (SENAC)' },
      { padrao: /\b(uninassau|mauricio de nassau)\b/, oficial: 'Centro Universitário Maurício de Nassau (UNINASSAU)' },
      { padrao: /\b(unirb)\b/, oficial: 'Centro Universitário UNIRB' },
      { padrao: /\b(ucsal|catolica do salvador)\b/, oficial: 'Universidade Católica do Salvador (UCSAL)' },
      { padrao: /\b(unifacs|universidade salvador)\b/, oficial: 'Universidade Salvador (UNIFACS)' },
      { padrao: /\b(uniftc|ftc|tecnologia e ciencias)\b/, oficial: 'Centro Universitário UniFTC' },
      { padrao: /\b(estacio|estacio de sa)\b/, oficial: 'Universidade Estácio de Sá' },
      { padrao: /\b(fcg|capim grosso)\b/, oficial: 'Faculdade Capim Grosso (FCG)' }
    ];

    for (const item of dicionario) {
      if (item.padrao.test(nomeNorm)) {
        return item.oficial;
      }
    }
  }

  return nome;
}

/**
 * Função utilitária para ordenação alfabética considerando acentos em português.
 */
export function sortAlpha(a, b, key) {
  return String(a[key] || '').localeCompare(String(b[key] || ''), 'pt-BR');
}

/**
 * Filtra uma lista de cursos pelo termo de busca (curso, entidade ou município) e por área geral.
 */
export function filterCursos(cursos = [], searchTerm = '', areaGeralFilters = []) {
  const searchNorm = normalize(searchTerm);

  return cursos.filter(c => {
    if (searchNorm) {
      const matchName = normalize(c.curso).includes(searchNorm);
      const matchInst = normalize(c.entidade).includes(searchNorm);
      const matchMun = normalize(c.municipio).includes(searchNorm);
      if (!matchName && !matchInst && !matchMun) return false;
    }
    if (areaGeralFilters.length > 0 && !areaGeralFilters.includes(c.areaGeral)) {
      return false;
    }
    return true;
  });
}
