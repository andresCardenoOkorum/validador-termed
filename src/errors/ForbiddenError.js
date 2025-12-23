/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición error 403
 */

class ForbiddenError extends Error {
  constructor (message) {
    super()
    this.message = message || 'Sin autorización para acceder al recurso'
    this.status = 403
  }
}

export default ForbiddenError

