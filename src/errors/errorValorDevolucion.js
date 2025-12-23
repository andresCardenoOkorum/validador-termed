/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición error de valor de devolución
 */

class ErrorValorDevolucion extends Error {
  constructor (message) {
    super()
    this.message = message || 'Error en valor de devolución'
  }
}

export default ErrorValorDevolucion

