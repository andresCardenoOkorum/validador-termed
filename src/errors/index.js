/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Módulo de errores
 */

import BadRequestError from './BadRequestError.js'
import CredentialsNotFound from './CredentialsNotFound.js'
import NoFoundError from './NotFoundError.js'
import UnAuthorizedError from './UnAuthorizedError.js'
import ForbiddenError from './ForbiddenError.js'

export default {
  BadRequestError,
  CredentialsNotFound,
  NoFoundError,
  UnAuthorizedError,
  ForbiddenError
}

