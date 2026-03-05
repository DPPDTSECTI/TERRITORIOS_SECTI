# 📄 Sistema de Relatórios PDF ABNT - Guia Rápido

## ⚡ Uso Básico

### 1. No Components (React)
```jsx
import PDFExportButton from './src/components/PDFExportButton';

function MyApp() {
  const mapRef = useRef(null);
  const municipios = [
    { nome: 'Salvador', quantidade: 25, territorio: 'Metropolitana' },
    // ... mais municípios
  ];

  return (
    <>
      <PDFExportButton 
        municipiosData={municipios}
        mapRef={mapRef}
      />
      <div ref={mapRef}>
        {/* Seu mapa aqui */}
      </div>
    </>
  );
}
```

### 2. Programáticamente
```javascript
import { generateAndDownloadReport } from './utils/pdfReportService';

// Gerar e baixar automaticamente
await generateAndDownloadReport({
  title: 'Programa Conecta Bahia',
  subtitle: 'Relatório de Pontos',
  municipiosData: municipios,
  includeMap: true,
  includeStatistics: true,
  includeData: true,
});
```

## 🎨 Opções de Relatório

### Relatório Completo (Padrão)
- ✅ Capa institucional
- ✅ Sumário
- ✅ Estadísticas gerais
- ✅ Mapa geográfico
- ✅ Dados tabulares dos municípios
- ✅ Referências ABNT
- ✅ Rodapé com numeração

### Relatório de Estadísticas
- ✅ Estadísticas gerais
- ✅ Dados tabulares
- ❌ Mapa (não incluído)

### Relatório com Mapa
- ✅ Mapa detalhado
- ✅ Título e subtítulo
- ❌ Estadísticas
- ❌ Dados tabulares

## 📐 Configuração ABNT

| Aspecto | Padrão |
|--------|--------|
| Papel | A4 |
| Margens | 3cm (sup/esq), 2cm (inf/dir) |
| Fonte | Helvetica |
| Tamanho Corpo | 11pt |
| Espaçamento | 1.5 linhas |

## 🏛️ Branding Oficial

O sistema inclui automaticamente:
- 🔹 Logo SECTI (Vertical)
- 🔹 Logo ConectaBahia
- 🔹 Cabeçalho: "Governo do Estado da Bahia"
- 🔹 Rodapé com numeração de páginas

## 📊 Estrutura de Dados

```javascript
// Formato esperado para municipiosData:
[
  {
    nome: "Salvador",           // String - Nome do município
    quantidade: 25,             // Number - Quantidade de pontos
    territorio: "Metropolitana" // String - Território de Identidade
  },
  // ... mais municípios
]
```

## 🛠️ Funções Principais

### `generatePDFReport(options)` 
Retorna objeto jsPDF para manipulação manual

```javascript
const pdf = await generatePDFReport({ ... });
pdf.save('relatorio.pdf');
pdf.addPage(); // Adicionar página
```

### `generateAndDownloadReport(options)`
Gera e baixa automaticamente

```javascript
await generateAndDownloadReport({ ... });
// Arquivo baixa automaticamente
```

### `htmlElementToBase64(element)`
Converte elemento HTML/SVG para imagem

```javascript
const imgBase64 = await htmlElementToBase64(mapElement);
// Usar em <img src={imgBase64} />
```

## 🎯 Casos de Uso Comuns

### Exportar por Território
```javascript
const bahiaTerritory = municipios.filter(
  m => m.territorio === 'Metropolitana'
);

await generateAndDownloadReport({
  title: 'Conecta Bahia',
  subtitle: 'Território Metropolitano',
  municipiosData: bahiaTerritory,
});
```

### Exportar com Análises Customizadas
```javascript
// Ver EXEMPLOS_AVANCADOS.js para:
// - generateAnalyticsReport()
// - generateComparisonReport()
// - generateDetailedMunicipalReport()
```

### Lote de Múltiplos PDFs
```javascript
import { generateBatchReports } from './EXEMPLOS_AVANCADOS.js';

await generateBatchReports(allMunicipios);
// Gera um PDF por território
```

## 🔧 Customização Simples

### Mudar Cores
Edite `utils/pdfReportService.js`:
```javascript
const ABNT_CONFIG = {
  colors: {
    primary: [30, 58, 138],      // Azul (RGB)
    // ... outras cores
  }
};
```

### Mudar Margens
```javascript
const ABNT_CONFIG = {
  margins: {
    top: 30,    // mm
    right: 20,
    bottom: 20,
    left: 30,
  }
};
```

### Adicionar Seção Customizada
```javascript
import { 
  createPDFDocument, 
  addSection, 
  addParagraph, 
  addFooter 
} from './utils/pdfReportService';

const pdf = createPDFDocument();
let yPos = 30;

yPos = addSection(pdf, yPos, 'Minha Seção', 1);
yPos = addParagraph(pdf, yPos, 'Conteúdo...');

addFooter(pdf);
pdf.save('custom.pdf');
```

## ⚙️ Instalação de Dependências

```bash
npm install jspdf html2canvas
```

Ou se já tiver package.json atualizado:
```bash
npm install
```

## 📦 Arquivos do Projeto

```
├── utils/
│   └── pdfReportService.js          # Serviço principal
│
├── src/components/
│   └── PDFExportButton.jsx          # Componente React
│
├── ConectaMap.jsx                   # Integração
├── EXEMPLOS_AVANCADOS.js            # Exemplos de uso
└── PDF_REPORT_DOCUMENTATION.md      # Documentação completa
```

## 🚀 Checklist de Implementação

- [x] Serviço de PDF com padrão ABNT
- [x] Componente React de exportação
- [x] Integração com ConectaMap
- [x] Logos e branding
- [x] Múltiplas opções de relatório
- [x] Captura de mapa como imagem
- [x] Documentação
- [ ] (Opcional) Temas customizáveis
- [ ] (Opcional) Assinatura digital
- [ ] (Opcional) Exportação multilíngue

## 💡 Dicas de Otimização

1. **Mapas Grandes**: Reduza tamanho com `maxWidth` em `addImage()`
2. **Muitos Dados**: Use `includeMap: false` para apenas tabelas
3. **Performance**: Processe geradores em fila com `PDFExportQueue`
4. **Qualidade**: Teste com dados reais antes de produção

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Logos não aparecem | Verifique `/public/img/` |
| Mapa em branco | Certifique-se que `mapRef` é válido |
| PDF muito grande | Reduza tamanho do mapa |
| Erro CORS | Configure CORS se URLs remotas |
| Caracteres estranhos | Verifique encoding UTF-8 |

## 📚 Documentação Completa

Veja `PDF_REPORT_DOCUMENTATION.md` para:
- API détalhes
- Funções auxiliares
- Referências normativas ABNT
- Exemplos avançados
- Customização profunda

## 🔄 Fluxo Típico

```
1. Carregar dados dos municípios
   ↓
2. Usuário clica "Exportar PDF"
   ↓
3. PDFExportButton carrega logos
   ↓
4. pdfReportService gera PDF
   ↓
5. Mapeia dados conforme opções
   ↓
6. Captura imagem do mapa (se necessário)
   ↓
7. Formata conforme ABNT
   ↓
8. Adiciona rodapé e numeração
   ↓
9. Faz download automaticamente
```

## 🎓 Próximos Passos

1. **Teste** o botão de exportação no ConectaMap
2. **Customize** as cores e logos conforme necessário
3. **Estenda** com funções do `EXEMPLOS_AVANCADOS.js`
4. **Integre** com seu backend para armazenar relatórios
5. **Implemente** análises automáticas

## 📞 Referências

- ABNT NBR 14724:2011 (Formatação)
- ABNT NBR 6023:2018 (Referências)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [html2canvas](https://html2canvas.hertzen.com/)

---

**Desenvolvido para SECTI - Bahia 2024**
