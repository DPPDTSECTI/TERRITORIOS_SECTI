import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const BORDER_COLOR = '#E2E8F0';
const PRIMARY_COLOR = '#1D3557';
const SECONDARY_COLOR = '#457B9D';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
    backgroundColor: '#ffffff'
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_COLOR,
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    marginBottom: 4
  },
  dateInfo: {
    fontSize: 9,
    color: '#64748B'
  },
  scopeBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: '4px 8px',
    color: PRIMARY_COLOR,
    fontSize: 10,
    fontWeight: 'bold'
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  kpiBox: {
    width: '23%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8
  },
  kpiTitle: {
    fontSize: 8,
    color: SECONDARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold'
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR
  },
  kpiSubValue: {
    fontSize: 10,
    color: '#64748B'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 8
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
    borderColor: BORDER_COLOR
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
  },
  tableCol: {
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 5,
    justifyContent: 'center'
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
    textTransform: 'uppercase'
  },
  tableCell: {
    fontSize: 8,
    color: PRIMARY_COLOR
  },
  colWide: { width: '35%' },
  colNormal: { width: '20%' },
  colSmall: { width: '15%' },
  colVerySmall: { width: '10%' },
  colHalf: { width: '55%' },
});

export default function RelatorioPDFDocument({ 
  reportType, 
  territoryTitle, 
  statsSintese, 
  tableData,
  reportLabel
}) {
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // Ajuste de largura das colunas baseado no tipo de relatório
  const getColStyles = () => {
    if (reportType === 'municipios') {
      return [styles.colHalf, styles.colNormal, styles.colSmall, styles.colSmall];
    }
    if (reportType === 'ativos' || reportType === 'cursos') {
      return [styles.colWide, styles.colSmall, styles.colNormal, styles.colNormal, styles.colVerySmall];
    }
    // Cadeias
    return [styles.colWide, styles.colSmall, styles.colNormal, styles.colNormal, styles.colSmall, styles.colVerySmall];
  };

  const colStyles = getColStyles();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* CABEÇALHO */}
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

        {/* KPIs */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiTitle}>Ativos de CT&I</Text>
            <Text style={styles.kpiValue}>{statsSintese.totalAtivos || 0}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiTitle}>Cursos CT&I</Text>
            <Text style={styles.kpiValue}>{statsSintese.totalCursos || 0}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiTitle}>Cadeias Produtivas</Text>
            <Text style={styles.kpiValue}>{statsSintese.totalCadeias || 0}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiTitle}>Cobertura Municipal</Text>
            <Text style={styles.kpiValue}>
              {statsSintese.munAtendidosCount || 0} <Text style={styles.kpiSubValue}>/ {statsSintese.totalMunEscopo || 0}</Text>
            </Text>
          </View>
        </View>

        {/* TABELA DE DADOS (SE NÃO FOR SÍNTESE) */}
        {reportType !== 'sintese' && (
          <View>
            <Text style={styles.sectionTitle}>Listagem de Dados ({tableData?.length || 0} registros)</Text>
            
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

                {reportType === 'cadeias' && (
                  <View style={[styles.tableCol, colStyles[4]]}>
                    <Text style={styles.tableCellHeader}>Status</Text>
                  </View>
                )}

                <View style={[styles.tableCol, colStyles[colStyles.length - 1], { borderRightWidth: 0, alignItems: 'flex-end' }]}>
                  <Text style={styles.tableCellHeader}>
                    {reportType === 'ativos' && 'RNP'}
                    {reportType === 'cursos' && 'Modalidade'}
                    {reportType === 'cadeias' && 'Situação'}
                    {reportType === 'municipios' && 'Cobertura'}
                  </Text>
                </View>
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

                  {reportType === 'cadeias' && (
                    <View style={[styles.tableCol, colStyles[4]]}>
                      <Text style={styles.tableCell}>{row.col5 || '-'}</Text>
                    </View>
                  )}

                  <View style={[styles.tableCol, colStyles[colStyles.length - 1], { borderRightWidth: 0, alignItems: 'flex-end' }]}>
                    <Text style={styles.tableCell}>{row.col6 || '-'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
