/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Regla de validación: Evalúa si un valor está en una lista blanca de valores permitidos
 */

/**
 * Evalúa si un valor está en una lista blanca de valores permitidos
 * @param {Object} ruleParams - Parámetros de la regla
 * @param {Array} ruleParams.allowedValues - Lista de valores permitidos
 * @param {string} ruleParams.targetAttribute - Atributo objetivo a validar
 * @param {Object} ctx - Contexto con item y cumDoc
 * @param {Object} ctx.item - Item del catálogo a validar
 * @param {Object} ctx.cumDoc - Documento de referencia desde MST_CUM (opcional)
 * @returns {Object} Resultado de la validación
 */
export const enumWhitelist = (ruleParams, ctx) => {
  const { allowedValues, targetAttribute, sourceAttribute } = ruleParams
  const { item, cumDoc } = ctx

  try {
    // Determinar de dónde obtener el valor a validar
    let valueToCheck

    if (sourceAttribute && cumDoc) {
      // Si hay sourceAttribute y cumDoc, usar el valor del documento de referencia
      valueToCheck = cumDoc[sourceAttribute]
    } else if (targetAttribute) {
      // Usar el valor del item
      valueToCheck = item[targetAttribute]
    } else {
      return {
        status: 'skip',
        message: 'Atributo objetivo o fuente no especificado',
        blocking: false
      }
    }

    if (valueToCheck === undefined || valueToCheck === null) {
      return {
        status: 'skip',
        message: `Valor no presente para validación de enum`,
        blocking: false
      }
    }

    if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
      return {
        status: 'error',
        message: 'Lista de valores permitidos no válida',
        blocking: ruleParams.blocking || false
      }
    }

    // Normalizar valores para comparación (convertir a string y hacer case-insensitive)
    const normalizedAllowed = allowedValues.map(v => String(v).toLowerCase().trim())
    const normalizedValue = String(valueToCheck).toLowerCase().trim()

    if (normalizedAllowed.includes(normalizedValue)) {
      return {
        status: 'pass',
        message: `Valor permitido: ${valueToCheck}`,
        blocking: false
      }
    }

    return {
      status: 'fail',
      message: `Valor no permitido: ${valueToCheck}. Valores permitidos: ${allowedValues.join(', ')}`,
      blocking: ruleParams.blocking || false,
      meta: { value: valueToCheck, allowedValues }
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Error al validar enum: ${error.message}`,
      blocking: ruleParams.blocking || false,
      meta: { error: error.message }
    }
  }
}

