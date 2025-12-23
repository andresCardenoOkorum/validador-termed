/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición error de credenciales no encontradas
 */

class CredentialsNotFoundError extends Error {
  constructor () {
    super('Credenciales no encontradas')
  }
}

export default CredentialsNotFoundError

