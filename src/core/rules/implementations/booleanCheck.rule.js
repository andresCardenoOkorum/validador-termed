/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Regla de validación: Evalúa un campo booleano contra un valor esperado
 */

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

