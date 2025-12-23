/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Middleware manejo de errores
 */

/* eslint-disable no-console */

import Joi from 'joi'

import BadRequestError from './BadRequestError.js'
import CredentialsNotFoundError from './CredentialsNotFound.js'
import NoFoundError from './NotFoundError.js'
import UnAuthorizedError from './UnAuthorizedError.js'
import ErrorValorDevolucion from './errorValorDevolucion.js'
import ForbiddenError from './ForbiddenError.js'

import getIOLogsCollection from '../db/Collections/ioLogs.js'

/**
 * Código para error de sintaxis inválida
 * @constant
 * @type {String}
 */
const SINTAX_ERROR = 'entity.parse.failed'

/**
 * Construir respuesta de error
 * @param {Joi.ValidationError} validationError Error de validación
 */

const buildValidationErrorResponse = (validationError) => {
  const errors = validationError
    .details
    .map(({ message, path }) => ({
      message,
      path: path.join('.')
    }))

  return {
    errors,
    status: 400,
    timestamp: new Date()
  }
}

// eslint-disable-next-line no-unused-vars
const errorHandler = async (error, _req, res, _next) => {
  const { insertedIdLog, organizationId, _startTime } = _req
  const errorObject = {
    ...error
  }
  try {
    if (error instanceof BadRequestError) {
      errorObject.status = 400
      return res
        .status(400)
        .json({
          message: error.message,
          status: 400,
          timestamp: new Date()
        })
    }

    if (error.type === SINTAX_ERROR) {
      errorObject.status = 400
      return res
        .status(400)
        .json({
          message: 'Error de sintaxis en el body',
          status: 400,
          timestamp: new Date()
        })
    }

    if (error instanceof CredentialsNotFoundError ||
    error instanceof UnAuthorizedError) {
      errorObject.status = 401
      return res
        .status(401)
        .json({
          message: error.message,
          status: 401,
          timestamp: new Date()
        })
    }

    if (error instanceof Joi.ValidationError) {
      const response = buildValidationErrorResponse(error)

      errorObject.status = response.status

      return res
        .status(response.status)
        .json(response)
    }

    if (error instanceof NoFoundError ||
      error instanceof ErrorValorDevolucion) {
      errorObject.status = 404

      return res
        .status(404)
        .json({
          message: error.message,
          status: 404,
          timestamp: new Date()
        })
    }

    if (error instanceof ForbiddenError) {
      errorObject.status = 403
      return res
        .status(403)
        .json({
          message: error.message,
          status: 403,
          timestamp: new Date()
        })
    }

    console.error(error)

    errorObject.status = 500

    return res
      .status(500)
      .json({
        message: 'Error interno del servidor',
        status: 500,
        timestamp: new Date()
      })
  } finally {
    // if (insertedIdLog) {
    //   const finalTimeDate = new Date()

    //   // @ts-ignore
    //   const elapsedFullEndpointTimeInMs = finalTimeDate - new Date(_startTime)

    //   const ioLogsRawCollection = await getIOLogsCollection(`ioLogs_${organizationId}`)

    //   ioLogsRawCollection.updateOne(
    //     { _id: insertedIdLog },
    //     {
    //       $set: {
    //         withError: true,
    //         elapsedFullEndpointTimeInMs,
    //         errorData: errorObject
    //       }
    //     }
    //   )
    // }
  }
}

export default errorHandler

