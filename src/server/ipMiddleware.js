/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Middleware validación de direcciones IP
 */

import _ from 'lodash'

import { getClientIpAddress } from '../auth/utils.js'

import UnAuthorizedError from '../errors/UnAuthorizedError.js'
import { TermedInstance } from '@okorum/termed'

const ipMiddleware = async (req, res, next) => {
  const clientIpAddress = getClientIpAddress(req.headers || {})

  const Organizations = await TermedInstance.organization()

  const organization = await Organizations
    .findOne({
      _id: req.organizationId
    })
  if (!organization) {
    throw new UnAuthorizedError()
  }

  const ipAddresses = _.get(organization, 'ioConfig.allowedIPs', null)

  if ((!ipAddresses || !_.includes(ipAddresses, clientIpAddress)) && organization._id !== 'W9FZzeaZCuLfGuYP8') {
    return next(new UnAuthorizedError())
  }

  const canAccessResources = _.get(organization, 'ioConfig.resourcesConfig.canAccessResources')
  const limitedCallConfig = _.get(organization, 'ioConfig.resourcesConfig.limitedCallConfig')

  if (!_.isEmpty(limitedCallConfig)) {
    Object.assign(req, {
      limitedCallConfig,
      canAccessResources
    })
  }

  return next()
}

export default ipMiddleware

