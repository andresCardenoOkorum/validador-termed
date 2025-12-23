/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Regla de validación: Verifica la existencia y vigencia de una referencia
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

