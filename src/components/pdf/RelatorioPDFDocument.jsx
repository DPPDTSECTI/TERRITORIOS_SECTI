import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Svg, Path, Circle } from '@react-pdf/renderer';

const BORDER_COLOR = '#E2E8F0';
const PRIMARY_COLOR = '#1D3557';
const SECONDARY_COLOR = '#457B9D';

const PIE_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', 
  '#6366F1', '#14B8A6', '#84CC16', '#EAB308'
];

const styles = StyleSheet.create({
  // PAGE 1: SPLIT LAYOUT
  pageSplit: {
    flexDirection: 'row',
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333333',
    backgroundColor: '#ffffff'
  },
  // PAGE 2: FULL LAYOUT
  pageFull: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#333333',
    backgroundColor: '#ffffff'
  },
  contentContainer: {
    flex: 1,
    padding: 40,
    display: 'flex',
    flexDirection: 'column'
  },
  mapContainer: {
    width: '40%',
    borderRightWidth: 4,
    borderRightColor: PRIMARY_COLOR,
    borderRightStyle: 'solid'
  },
  mapImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR,
    borderBottomStyle: 'solid',
    paddingBottom: 15,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    marginBottom: 6
  },
  dateInfo: {
    fontSize: 11,
    color: '#64748B'
  },
  scopeBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: '6px 12px',
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: 'bold'
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30
  },
  kpiBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15
  },
  kpiTitle: {
    fontSize: 11,
    color: SECONDARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: 'bold'
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PRIMARY_COLOR
  },
  kpiSubValue: {
    fontSize: 12,
    color: '#64748B'
  },
  // CHART STYLES
  chartSection: {
    marginTop: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40
  },
  chartLegend: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    maxHeight: 400,
    flexWrap: 'wrap'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '48%'
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 2,
    marginRight: 8
  },
  legendText: {
    fontSize: 10,
    color: '#333333'
  },
  legendValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 'auto'
  },
  // TABLE STYLES
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderBottomWidth: 0,
    borderRightWidth: 0
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR,
    minHeight: 28,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#F8FAFC'
  },
  tableCol: {
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 8,
    justifyContent: 'center'
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
    textTransform: 'uppercase'
  },
  tableCell: {
    fontSize: 10,
    color: PRIMARY_COLOR
  },
  colWide: { width: '35%' },
  colNormal: { width: '20%' },
  colSmall: { width: '15%' },
  colVerySmall: { width: '10%' },
  colHalf: { width: '55%' },
});

// Helper component to render a Pie Chart
const PdfPieChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  const total = data.reduce((acc, d) => acc + d.value, 0);
  let cumulativePercent = 0;
  
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <View style={styles.chartSection}>
      {/* Chart */}
      <View style={{ width: 250, height: 250 }}>
        <Svg width="250" height="250" viewBox="-1.2 -1.2 2.4 2.4" style={{ transform: 'rotate(-90deg)' }}>
          {data.map((slice, idx) => {
            const slicePercent = slice.value / total;
            if (slicePercent === 1) {
              return <Circle cx="0" cy="0" r="1" fill={slice.color} key={idx} />;
            }
            const startPercent = cumulativePercent;
            const endPercent = cumulativePercent + slicePercent;
            cumulativePercent = endPercent;

            const [startX, startY] = getCoordinatesForPercent(startPercent);
            const [endX, endY] = getCoordinatesForPercent(endPercent);
            const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

            const pathData = [
              'M 0 0',
              `L ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              'Z'
            ].join(' ');
            
            return <Path d={pathData} fill={slice.color} key={idx} />;
          })}
        </Svg>
      </View>
      {/* Legend */}
      <View style={styles.chartLegend}>
        {data.map((slice, idx) => (
          <View style={styles.legendItem} key={idx}>
            <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
            <Text style={styles.legendText}>{slice.name.length > 25 ? slice.name.substring(0, 25) + '...' : slice.name}</Text>
            <Text style={styles.legendValue}>{slice.value} ({((slice.value / total) * 100).toFixed(1)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
};


export default function RelatorioPDFDocument({ 
  reportType, 
  territoryTitle, 
  statsSintese, 
  tableData,
  reportLabel,
  mapImage
}) {
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const getColStyles = () => {
    if (reportType === 'municipios') {
      return [styles.colHalf, styles.colNormal, styles.colSmall, styles.colSmall];
    }
    if (reportType === 'ativos' || reportType === 'cursos') {
      return [styles.colWide, styles.colSmall, styles.colNormal, styles.colNormal, styles.colVerySmall];
    }
    return [styles.colWide, styles.colNormal, styles.colNormal, styles.colNormal];
  };

  const colStyles = getColStyles();

  // Aggregate Data for Pie Chart
  let chartData = [];
  if (reportType !== 'sintese' && reportType !== 'municipios' && tableData && tableData.length > 0) {
    const counts = {};
    tableData.forEach(row => {
      let key = 'Outros';
      if (reportType === 'cursos') key = row.col3; // Área
      else if (reportType === 'ativos') key = row.col3; // Tipo
      else if (reportType === 'cadeias') key = row.col2; // Tipologia
      
      counts[key] = (counts[key] || 0) + 1;
    });
    
    chartData = Object.keys(counts)
      .map(k => ({ name: k || 'Não Informado', value: counts[k] }))
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({ ...item, color: PIE_COLORS[idx % PIE_COLORS.length] }));
  }

  // Header Component to reuse
  const Header = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Relatório Executivo de CT&I</Text>
        <Text style={styles.subtitle}>{territoryTitle}</Text>
        <Text style={styles.dateInfo}>Gerado em: {currentDate} • Fonte: SECTI/BA</Text>
      </View>
      <View style={styles.scopeBadge}>
        <Text>Escopo: {reportLabel}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      {/* PAGE 1: RESUMO (MAPA + KPIs + CHART) */}
      <Page size={[1920, 1080]} style={styles.pageSplit}>
        {/* LADO ESQUERDO: MAPA */}
        {mapImage && (
          <View style={styles.mapContainer}>
            <Image src={mapImage} style={styles.mapImage} />
          </View>
        )}

        {/* LADO DIREITO: CONTEÚDO */}
        <View style={styles.contentContainer}>
          <Header />

          {/* KPIs */}
          <View style={styles.kpiContainer}>
            {(reportType === 'sintese' || reportType === 'ativos') && (
              <View style={styles.kpiBox}>
                <Text style={styles.kpiTitle}>Ativos de CT&I</Text>
                <Text style={styles.kpiValue}>{statsSintese.totalAtivos || 0}</Text>
              </View>
            )}
            {(reportType === 'sintese' || reportType === 'cursos') && (
              <View style={styles.kpiBox}>
                <Text style={styles.kpiTitle}>Cursos CT&I</Text>
                <Text style={styles.kpiValue}>{statsSintese.totalCursos || 0}</Text>
              </View>
            )}
            {(reportType === 'sintese' || reportType === 'cadeias') && (
              <View style={styles.kpiBox}>
                <Text style={styles.kpiTitle}>Cadeias Produtivas</Text>
                <Text style={styles.kpiValue}>{statsSintese.totalCadeias || 0}</Text>
              </View>
            )}
            {(reportType === 'sintese' || reportType === 'municipios') && (
              <View style={styles.kpiBox}>
                <Text style={styles.kpiTitle}>Cobertura Municipal</Text>
                <Text style={styles.kpiValue}>
                  {statsSintese.munAtendidosCount || 0} <Text style={styles.kpiSubValue}>/ {statsSintese.totalMunEscopo || 0}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* GRÁFICO */}
          {chartData.length > 0 && (
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                {reportType === 'cursos' && 'Distribuição por Área de Conhecimento'}
                {reportType === 'ativos' && 'Distribuição por Tipo de Ativo'}
                {reportType === 'cadeias' && 'Distribuição por Setor / Tipologia'}
              </Text>
              <PdfPieChart data={chartData} />
            </View>
          )}
        </View>
      </Page>

      {/* PAGE 2: TABELA DE DADOS (Se houver lista) */}
      {reportType !== 'sintese' && tableData && tableData.length > 0 && (
        <Page size={[1920, 1080]} style={styles.pageFull}>
          <Header />
          <Text style={styles.sectionTitle}>Listagem Detalhada ({tableData.length} registros)</Text>
          
          <View style={styles.table}>
            {/* Cabeçalho da Tabela */}
            <View style={[styles.tableRow, styles.tableHeader]} fixed>
              <View style={[styles.tableCol, colStyles[0]]}>
                <Text style={styles.tableCellHeader}>
                  {reportType === 'ativos' && 'Nome do Ativo'}
                  {reportType === 'cursos' && 'Curso Superior'}
                  {reportType === 'cadeias' && 'Cadeia Produtiva'}
                  {reportType === 'municipios' && 'Município'}
                </Text>
              </View>

              {reportType !== 'municipios' && (
                <View style={[styles.tableCol, colStyles[1]]}>
                  <Text style={styles.tableCellHeader}>
                    {reportType === 'ativos' && 'Sigla'}
                    {reportType === 'cursos' && 'IES'}
                    {reportType === 'cadeias' && 'Tipologia'}
                  </Text>
                </View>
              )}

              <View style={[styles.tableCol, reportType === 'municipios' ? colStyles[1] : colStyles[2]]}>
                <Text style={styles.tableCellHeader}>
                  {reportType === 'ativos' && 'Tipo'}
                  {reportType === 'cursos' && 'Área'}
                  {reportType === 'cadeias' && 'Abrangência'}
                  {reportType === 'municipios' && 'Ativos CT&I'}
                </Text>
              </View>

              <View style={[styles.tableCol, reportType === 'municipios' ? colStyles[2] : colStyles[3]]}>
                <Text style={styles.tableCellHeader}>
                  {reportType === 'ativos' && 'Município'}
                  {reportType === 'cursos' && 'Município'}
                  {reportType === 'cadeias' && 'Territórios'}
                  {reportType === 'municipios' && 'Cursos CT&I'}
                </Text>
              </View>

              {reportType !== 'cadeias' && (
                <View style={[styles.tableCol, colStyles[colStyles.length - 1], { borderRightWidth: 0, alignItems: 'flex-end' }]}>
                  <Text style={styles.tableCellHeader}>
                    {reportType === 'ativos' && 'RNP'}
                    {reportType === 'cursos' && 'Modalidade'}
                    {reportType === 'municipios' && 'Cobertura'}
                  </Text>
                </View>
              )}
            </View>

            {/* Linhas da Tabela */}
            {tableData.map((row, idx) => (
              <View key={idx} style={styles.tableRow} wrap={false}>
                <View style={[styles.tableCol, colStyles[0]]}>
                  <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{row.col1 || '-'}</Text>
                </View>
                
                {reportType !== 'municipios' && (
                  <View style={[styles.tableCol, colStyles[1]]}>
                    <Text style={styles.tableCell}>{row.col2 || '-'}</Text>
                  </View>
                )}
                
                <View style={[styles.tableCol, reportType === 'municipios' ? colStyles[1] : colStyles[2]]}>
                  <Text style={styles.tableCell}>{reportType === 'municipios' ? row.col4 : row.col3 || '-'}</Text>
                </View>
                
                <View style={[styles.tableCol, reportType === 'municipios' ? colStyles[2] : colStyles[3]]}>
                  <Text style={styles.tableCell}>{reportType === 'municipios' ? row.col5 : row.col4 || '-'}</Text>
                </View>

                {reportType !== 'cadeias' && (
                  <View style={[styles.tableCol, colStyles[colStyles.length - 1], { borderRightWidth: 0, alignItems: 'flex-end' }]}>
                    <Text style={styles.tableCell}>{row.col6 || '-'}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
}
