/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Validador de tokens JWT
 */

import UnAuthorizedError from '../errors/UnAuthorizedError.js'
import Utils from './utils.js'

/**
 * Validar token JWT codificado con claves privada/pública
 * @param {String} token Token codificado en base 64 JWT
 * @returns {Promise<Object>}
 * @throws {UnAuthorizedError}
 */
const authorize = async (token) => {
  try {
    const data = await Utils.validateToken(token)
    return data
  } catch (error) {
    throw new UnAuthorizedError()
  }
}

export default authorize

