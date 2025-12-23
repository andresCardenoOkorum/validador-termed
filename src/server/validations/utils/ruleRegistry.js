/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Registry de funciones puras de reglas de validación
 */

/**
 * Verifica la existencia y vigencia de una referencia en un documento CUM
 * @param {Object} ruleParams - Parámetros de la regla
 * @param {Object} ruleParams.sourceAttribute - Atributo fuente en el documento CUM
 * @param {Object} ruleParams.targetAttributes - Atributos objetivo a validar
 * @param {Object} ctx - Contexto con item y cumDoc
 * @param {Object} ctx.item - Item del catálogo a validar
 * @param {Object} ctx.cumDoc - Documento de referencia desde MST_CUM
 * @returns {Object} Resultado de la validación
 */
export const referenceExistence = (ruleParams, ctx) => {
  const { sourceAttribute, targetAttributes } = ruleParams
  const { item, cumDoc } = ctx

  try {
    // Si no hay documento CUM, la validación falla
    if (!cumDoc) {
      return {
        status: 'fail',
        message: `Referencia no encontrada en ${ruleParams.referenceSource || 'MST_CUM'}`,
        blocking: ruleParams.blocking || false
      }
    }

    // Verificar vigencia si el documento tiene campo vigente
    if (cumDoc.vigente !== undefined && !cumDoc.vigente) {
      return {
        status: 'fail',
        message: 'Referencia encontrada pero no vigente',
        blocking: ruleParams.blocking || false,
        meta: { vigente: false }
      }
    }

    // Verificar que los atributos objetivo coincidan con los del documento CUM
    if (targetAttributes && targetAttributes.length > 0) {
      const mismatches = targetAttributes.filter(attr => {
        const itemValue = item[attr]
        const cumValue = cumDoc[sourceAttribute || attr]
        return itemValue !== cumValue
      })

      if (mismatches.length > 0) {
        return {
          status: 'fail',
          message: `Atributos no coinciden: ${mismatches.join(', ')}`,
          blocking: ruleParams.blocking || false,
          meta: { mismatches }
        }
      }
    }

    return {
      status: 'pass',
      message: 'Referencia válida y vigente',
      blocking: false
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Error al validar existencia: ${error.message}`,
      blocking: ruleParams.blocking || false,
      meta: { error: error.message }
    }
  }
}

/**
 * Evalúa un campo booleano contra un valor esperado
 * @param {Object} ruleParams - Parámetros de la regla
 * @param {boolean} ruleParams.expectedValue - Valor booleano esperado
 * @param {string} ruleParams.targetAttribute - Atributo objetivo a validar
 * @param {Object} ctx - Contexto con item
 * @param {Object} ctx.item - Item del catálogo a validar
 * @returns {Object} Resultado de la validación
 */
export const booleanCheck = (ruleParams, ctx) => {
  const { expectedValue, targetAttribute } = ruleParams
  const { item } = ctx

  try {
    if (targetAttribute === undefined || targetAttribute === null) {
      return {
        status: 'skip',
        message: 'Atributo objetivo no especificado',
        blocking: false
      }
    }

    const itemValue = item[targetAttribute]

    // Si el valor no existe, considerar como skip
    if (itemValue === undefined || itemValue === null) {
      return {
        status: 'skip',
        message: `Atributo ${targetAttribute} no presente en el item`,
        blocking: false
      }
    }

    const itemBoolValue = Boolean(itemValue)
    const expectedBoolValue = Boolean(expectedValue)

    if (itemBoolValue === expectedBoolValue) {
      return {
        status: 'pass',
        message: `Valor booleano correcto: ${targetAttribute} = ${expectedValue}`,
        blocking: false
      }
    }

    return {
      status: 'fail',
      message: `Valor booleano incorrecto: ${targetAttribute} esperado ${expectedValue}, encontrado ${itemValue}`,
      blocking: ruleParams.blocking || false,
      meta: { expected: expectedValue, actual: itemValue }
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Error al validar booleano: ${error.message}`,
      blocking: ruleParams.blocking || false,
      meta: { error: error.message }
    }
  }
}

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

/**
 * Registry de funciones de reglas disponibles
 */
const ruleRegistry = {
  REFERENCE_EXISTENCE: referenceExistence,
  BOOLEAN_CHECK: booleanCheck,
  ENUM_WHITELIST: enumWhitelist
}

export default ruleRegistry

