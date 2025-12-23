/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición de errores tipo 400
 */

class BadRequestError extends Error {
  constructor () {
    super('Error en parámetros/cuerpo de la petición')
  }
}

export default BadRequestError

