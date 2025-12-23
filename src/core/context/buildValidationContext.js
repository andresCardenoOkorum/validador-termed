/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Constructor de contexto de validación
 */

/**
 * Construye el contexto de validación para una regla
 * @param {Object} item - Item del catálogo a validar
 * @param {Object} cumDoc - Documento de referencia desde MST_CUM (opcional)
 * @param {Object} validation - Configuración de la validación
 * @param {Object} rule - Regla de validación
 * @returns {Object} Contexto de validación
 */
export const buildValidationContext = (item, cumDoc = null, validation = null, rule = null) => {
  return {
    item,
    cumDoc,
    validation,
    rule
  }
}

export default buildValidationContext

