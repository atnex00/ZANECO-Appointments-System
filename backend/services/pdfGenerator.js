const fs = require('fs')
const path = require('path')
const pdfmake = require('pdfmake')
const fontContainer = require('pdfmake/build/fonts/Roboto')

Object.keys(fontContainer.vfs).forEach(key => {
  pdfmake.virtualfs.storage[key] = Buffer.from(fontContainer.vfs[key].data, 'base64')
})
pdfmake.setFonts(fontContainer.fonts)
pdfmake.setUrlAccessPolicy(() => false)
pdfmake.setLocalAccessPolicy(() => false)

let combinedLogoB64 = ''
try {
  combinedLogoB64 = fs.readFileSync(path.join(__dirname, 'logo_combined.b64'), 'utf8')
} catch (err) {
  console.warn('PDF logo file not found, continuing without logo:', err.message)
}

const COLUMN_LABELS = {
  office: 'Office',
  total: 'Total',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  no_show: 'No Show',
  rescheduled: 'Rescheduled',
  pending: 'Pending',
  confirmed: 'Confirmed',
  concern_type: 'Concern Type',
  appointment_date: 'Date',
  week: 'Week',
  month: 'Month',
  date: 'Date',
  count: 'Count',
  name: 'Name',
}

function labelFor(col) {
  return COLUMN_LABELS[col] || col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function computeSummary(columns, data) {
  const numericCols = columns.filter(col =>
    data.length > 0 && (typeof data[0][col] === 'number' || typeof data[0][col] === 'bigint') && !['week', 'month', 'appointment_date', 'date'].includes(col)
  )
  if (!numericCols.length) return null

  const summary = {}
  numericCols.forEach(col => {
    summary[col] = data.reduce((sum, row) => sum + (Number(row[col]) || 0), 0)
  })
  return summary
}

function generateReportPDF(title, columns, data, dateRange) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  const labeledColumns = columns.map(labelFor)

  const summary = computeSummary(columns, data)

  const content = []

  content.push({
    columns: [
      {
        width: 'auto',
        stack: [
          {
            image: 'data:image/png;base64,' + combinedLogoB64,
            width: 200,
          },
        ],
      },
      {
        width: '*',
        stack: [
          { text: 'ZANECO Appointments System', alignment: 'right', fontSize: 16, bold: true, color: '#d97706', margin: [0, 0, 0, 2] },
          { text: title, alignment: 'right', fontSize: 13, margin: [0, 0, 0, 2] },
          { text: `Period: ${dateRange}`, alignment: 'right', fontSize: 9, color: '#666666' },
          { text: `Generated: ${dateStr} at ${timeStr}`, alignment: 'right', fontSize: 8, color: '#999999' },
        ],
      },
    ],
    margin: [0, 0, 0, 12],
  })

  if (summary) {
    const statRow = labeledColumns.map((label, i) => ({
      text: summary[columns[i]] != null ? String(summary[columns[i]]) : null,
    })).filter(c => c.text !== null)

    if (statRow.length) {
      const statLabels = labeledColumns.map((label, i) =>
        summary[columns[i]] != null ? { text: label, style: 'summaryLabel' } : null
      ).filter(c => c !== null)

      const statValues = labeledColumns.map((label, i) =>
        summary[columns[i]] != null
          ? { text: String(summary[columns[i]]), style: 'summaryValue', alignment: 'center' }
          : null
      ).filter(c => c !== null)

      content.push({
        table: {
          headerRows: 0,
          widths: statLabels.map(() => '*'),
          body: [statLabels, statValues],
        },
        layout: {
          fillColor: () => '#FFFBEB',
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#FDE68A',
          vLineColor: () => '#FDE68A',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 10],
      })
    }
  }

  const headerRow = labeledColumns.map(col => ({
    text: col,
    style: 'tableHeader',
    bold: true,
    fontSize: 9,
    fillColor: '#EEF4FF',
    alignment: 'center',
  }))

  const bodyRows = data.map((row, i) =>
    columns.map(col => ({
      text: row[col] != null ? String(row[col]) : '',
      fontSize: 8.5,
      fillColor: i % 2 === 0 ? '#F8F9FF' : '#FFFFFF',
      alignment: typeof row[col] === 'number' || typeof row[col] === 'bigint' ? 'right' : 'left',
    }))
  )

  const totalRows = labeledColumns.map((col, i) => {
    if (summary && summary[columns[i]] != null) {
      return { text: String(summary[columns[i]]), fontSize: 8.5, bold: true, alignment: 'center', fillColor: '#FEF3C7' }
    }
    return { text: '', fontSize: 8.5 }
  })

  content.push({
    table: {
      headerRows: 1,
      widths: columns.map(() => '*'),
      body: [headerRow, ...bodyRows, totalRows],
    },
    layout: {
      fillColor: (rowIndex, node, columnIndex) => {
        if (rowIndex === 0) return '#EEF4FF'
        if (rowIndex === node.table.body.length - 1) return '#FEF3C7'
        return rowIndex % 2 === 0 ? '#F8F9FF' : null
      },
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#CCCCCC',
      vLineColor: () => '#CCCCCC',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  })

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 30, 30, 50],
    content,
    footer: (currentPage, pageCount) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#999999',
      margin: [0, 20, 0, 0],
    }),
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
    },
    styles: {
      summaryLabel: {
        fontSize: 8,
        color: '#92400E',
        bold: true,
        alignment: 'center',
      },
      summaryValue: {
        fontSize: 16,
        color: '#D97706',
        bold: true,
      },
    },
  }

  const doc = pdfmake.createPdf(docDefinition)
  return doc.getBuffer()
}

module.exports = { generateReportPDF }
