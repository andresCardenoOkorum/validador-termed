/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Constructor de reportes CSV
 */

/**
 * Construye un CSV a partir de resultados de validación
 * @param {Array<Object>} results - Array de resultados de validación
 * @returns {string} CSV formateado
 */
export const buildCSV = (results) => {
  if (!results || results.length === 0) {
    return 'No hay resultados para exportar'
  }

  // Headers
  const headers = [
    'Item ID',
    'Catálogo ID',
    'Estado General',
    'Total Reglas',
    'Reglas Pasadas',
    'Reglas Fallidas',
    'Reglas con Error',
    'Fecha Validación'
  ]

  // Construir filas
  const rows = results.map(result => {
    const passed = result.ruleResults?.filter(r => r.status === 'pass').length || 0
    const failed = result.ruleResults?.filter(r => r.status === 'fail').length || 0
    const errors = result.ruleResults?.filter(r => r.status === 'error').length || 0
    const total = result.ruleResults?.length || 0

    return [
      result.itemId || '',
      result.catalogoId || '',
      result.overallStatus || '',
      total,
      passed,
      failed,
      errors,
      result.updatedAt ? new Date(result.updatedAt).toISOString() : ''
    ]
  })

  // Combinar headers y rows
  const csvRows = [headers, ...rows]

  // Convertir a CSV
  return csvRows.map(row => 
    row.map(cell => {
      const cellStr = String(cell)
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  ).join('\n')
}

export default {
  buildCSV
}

