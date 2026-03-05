# Sistema de Geração de Relatórios em PDF - Conecta Bahia

## 📋 Visão Geral

Sistema completo de geração de relatórios inteligentes em PDF com padrão ABNT, incluindo logos oficiais, dados dos municípios e visualização do mapa geográfico.

## 🎯 Características

- ✅ **Padrão ABNT**: Segue normas ABNT NBR 6023:2018 (Referências) e NBR 14724:2011 (Formatação)
- 🏛️ **Branding Governamental**: Inclui logos da SECTI e ConectaBahia
- 📊 **Múltiplos Formatos**: 
  - Relatório Completo (estatísticas + mapa + dados)
  - Relatório de Estatísticas (apenas dados tabulares)
  - Relatório com Mapa (visualização geográfica)
- 🗺️ **Mapas Dinâmicos**: Captura do SVG do mapa em tempo real
- 📑 **Formatação Profissional**: 
  - Capa institucional
  - Sumário automático
  - Cabeçalho e rodapé em todas as páginas
  - Numeração de páginas
  - Tabelas formatadas

## 📁 Estrutura de Arquivos

```
utils/
  └── pdfReportService.js       # Serviço de geração de PDFs (ABNT)

src/components/
  └── PDFExportButton.jsx        # Componente React para exportação

ConectaMap.jsx                   # Integração com o mapa
```

## 🚀 Componente PDFExportButton

### Props

```javascript
<PDFExportButton
  municipiosData={Array}    // Array de objetos com { nome, quantidade, territorio }
  mapRef={React.RefObject}  // Referência do elemento SVG do mapa
  className={String}        // Classes CSS adicionais (opcional)
/>
```

### Exemplo de Uso

```javascript
import PDFExportButton from './src/components/PDFExportButton';

export function MyComponent() {
  const mapRef = useRef(null);
  const municipiosData = [
    { nome: 'Salvador', quantidade: 25, territorio: 'Metropolitana' },
    { nome: 'Feira de Santana', quantidade: 18, territorio: 'Recôncavo' },
  ];

  return (
    <div>
      <PDFExportButton 
        municipiosData={municipiosData}
        mapRef={mapRef}
      />
      <div ref={mapRef}>
        {/* Seu mapa SVG aqui */}
      </div>
    </div>
  );
}
```

## 🛠️ API do serviço pdfReportService.js

### `generatePDFReport(options)`

Gera um relatório PDF com as opções especificadas.

**Parameters:**
```javascript
{
  title: String,                // Título principal
  subtitle: String,             // Subtítulo
  municipiosData: Array,        // Dados dos municípios
  sectiLogo: String,            // Logo SECTI em base64
  conectaLogo: String,          // Logo ConectaBahia em base64
  mapElement: HTMLElement,      // Elemento do mapa para capturar
  includeMap: Boolean,          // Incluir mapa no relatório
  includeStatistics: Boolean,   // Incluir estatísticas
  includeData: Boolean,         // Incluir dados dos municípios
}
```

**Returns:** Promise<jsPDF>

**Exemplo:**
```javascript
import { generatePDFReport } from './utils/pdfReportService';

const pdf = await generatePDFReport({
  title: 'Programa Conecta Bahia',
  subtitle: 'Relatório de Pontos de Acesso',
  municipiosData: municipios,
  includeMap: true,
  includeStatistics: true,
  includeData: true,
});

pdf.save('relatorio.pdf');
```

### `generateAndDownloadReport(options)`

Gera e faz download automático do relatório.

**Parameters:** Mesmos de `generatePDFReport`

**Exemplo:**
```javascript
import { generateAndDownloadReport } from './utils/pdfReportService';

await generateAndDownloadReport({
  title: 'Relatório Conecta Bahia',
  municipiosData: municipios,
});
// Arquivo será baixado automaticamente
```

### `htmlElementToBase64(element)`

Converte um elemento HTML/SVG para imagem base64.

**Parameters:**
- `element`: HTMLElement - Elemento a ser convertido

**Returns:** Promise<String> - Base64 da imagem PNG

**Exemplo:**
```javascript
import { htmlElementToBase64 } from './utils/pdfReportService';

const mapImage = await htmlElementToBase64(mapElement);
// mapImage é agora uma string base64 que pode ser usada em URLs de imagem
```

## 📐 Configuração ABNT

### Margens (ABNT NBR 14724)
- Superior: 3 cm
- Inferior: 2 cm
- Esquerdo: 3 cm
- Direito: 2 cm

### Tipografia
- **Fonte Principal**: Helvetica (padrão PDF)
- **Tamanho Título**: 16 pt
- **Tamanho Corpo**: 11 pt
- **Espaçamento**: 1.5 linhas

### Cores
- **Primária**: Azul Escuro (#1E3A8A)
- **Secundária**: Cinza Azulado (#475577)
- **Destaque**: Laranja (#FF6D00)

## 🖼️ Imagens e Logos

As imagens são carregadas automaticamente das seguintes localidades:

- **SECTI**: `/public/img/Secti_Vertical.png`
- **ConectaBahia**: `/public/img/LogoConecta.png`

Certifique-se de que estes arquivos existem no diretório especificado.

## 📦 Dependências

```json
{
  "jspdf": "^4.2.0",
  "html2canvas": "^1.4.1"
}
```

Instale com:
```bash
npm install jspdf html2canvas
```

## 🔧 Customização

### Alterar Cores

Edite a constante `ABNT_CONFIG.colors` em `utils/pdfReportService.js`:

```javascript
colors: {
  primary: [30, 58, 138],        // RGB
  secondary: [71, 85, 119],
  accent: [255, 109, 0],
  text: [25, 25, 25],
  lightText: [80, 80, 80],
  border: [200, 200, 200],
},
```

### Alterar Margens

Edite `ABNT_CONFIG.margins`:

```javascript
margins: {
  top: 30,    // mm
  right: 20,
  bottom: 20,
  left: 30,
},
```

### Adicionar Seções Customizadas

Use as funções auxiliares no `pdfReportService.js`:

```javascript
import { 
  createPDFDocument,
  addSection,
  addParagraph,
  addTable,
  addImage,
  addFooter 
} from './utils/pdfReportService';

const pdf = createPDFDocument();
let yPos = 30;

yPos = addSection(pdf, yPos, 'Minha Seção Customizada', 1);
yPos = addParagraph(pdf, yPos, 'Meu parágrafo...');

addFooter(pdf);
pdf.save('custom.pdf');
```

## 📋 Estrutura do Relatório Padrão

1. **Capa** - Logo + Título + Data
2. **Sumário** - Lista de seções
3. **Introdução** - Descrição do programa
4. **Estadísticas** - Métricas do programa
5. **Mapa** - Visualização geográfica (opcional)
6. **Dados dos Municípios** - Tabela com todos os dados
7. **Referências** - Créditos e normas utilizadas
8. **Rodapé** - Número de página e separadores

## 🎨 Personalização de Conteúdo

Para adicionar ou remover seções, modifique a função `generatePDFReport`:

```javascript
// Adicionar uma nova seção
if (options.includeCustomSection) {
  yPos = addSection(pdf, yPos, 'Seção Customizada', 1);
  yPos = addParagraph(pdf, yPos, 'Conteúdo aqui...');
}
```

## ⚠️ Limitações Conhecidas

1. **Tamanho de Mapa**: Mapas muito grandes podem resultar em arquivos PDF grandes
2. **Qualidade de Imagem**: Captura de SVG depende do html2canvas
3. **Caracteres Especiais**: Alguns caracteres especiais podem não renderizar corretamente
4. **Navegadores Anti-tracking**: Alguns navegadores bloqueiam a captura de canvas

## 🐛 Troubleshooting

### Erro: "Imagem não carregada"
- Verifique se os logos existem em `/public/img/`
- Verifique a CORS se estiver usando URLs remotas

### Erro: "Mapa vazio"
- Certifique-se de que `mapRef` está apontando para um elemento válido
- Verifique se o SVG está renderizado corretamente

### PDF muito grande
- Reduza o tamanho do mapa usando `maxWidth` em `addImage()`
- Use `includeMap: false` para gerar apenas dados tabulares

## 📚 Referências Normativas

- **ABNT NBR 6023:2018** - Informação e documentação - Referências - Elaboração
- **ABNT NBR 14724:2011** - Informação e documentação - Trabalhos acadêmicos - Apresentação

## 🔄 Atualizações Futuras

- [ ] Suporte para gráficos interativos
- [ ] Temas customizáveis
- [ ] Exportação em múltiplos idiomas
- [ ] Assinatura digital
- [ ] Geração de múltiplos PDFs em lote

## 📞 Suporte

Para problemas ou sugestões, abra uma issue no repositório do projeto.

---

**Desenvolvido para a Secretaria de Ciência, Tecnologia e Inovação - SECTI**
Bahia, 2024
