/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Controlador de autorización
 */

import authorize from '../auth/authz.js'
import UnAuthorizedError from '../errors/UnAuthorizedError.js'

const authzMiddleware = async (req, res, next) => {
  const { authorization } = req.headers

  if (!authorization) {
    return next(new UnAuthorizedError())
  }

  const containsBearer = /^bearer/i
    .test(authorization)

  const token = containsBearer
    ? authorization.split(' ')[1]
    : authorization

  if (!token) {
    return next(new UnAuthorizedError())
  }

  try {
    const { id, orgType } = await authorize(token)

    Object.assign(req, {
      organizationId: id,
      orgType
    })

    return next()
  } catch (error) {
    return next(error)
  }
}

export default authzMiddleware

