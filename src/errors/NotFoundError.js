/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición error 404
 */

/**
 * Opciones para no encontrado
 * @type {Object}
 */
const errorsID = {
  1: 'Organización no encontrada',
  2: 'No se encontró ordenamientos asociados a los parámetros usados',
  3: 'Configuración de interoperabilidad de la organización para este recurso no encontrada',
  4: 'No se encontró la APP con los datos proporcionados'
}

class NotFoundError extends Error {
  constructor (idError) {
    super()
    this.codeError = idError || 0
    this.message = errorsID[idError] || 'No se encontró entidad para los parámetros proporcionados'
  }
}

export default NotFoundError

