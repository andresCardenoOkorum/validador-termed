/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición error 401
 */

class UnAuthorizedError extends Error {
  constructor () {
    super('No autorizado para ejecutar la operación o el token ya no es válido')
  }
}

export default UnAuthorizedError

