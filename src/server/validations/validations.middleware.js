/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Middleware de validación para endpoints de validaciones
 */

import Joi from 'joi'

/**
 * Middleware que valida los parámetros según el endpoint
 * @param {Object} req Argumento de solicitud de HTTP
 * @param {Object} res Argumento de respuesta de HTTP
 * @param {Object} next Argumento de devolución para función middleware
 * @returns {Object} Retorna next() o error
 */
const middleware = (req, res, next) => {
  const { method, path } = req

  // Validación para POST /catalogo
  if (method === 'POST' && path.endsWith('/catalogo')) {
    const schema = Joi.object({
      catalogoId: Joi.string().required(),
      query: Joi.object().optional(),
      requestId: Joi.string().optional()
    }).messages({
      'any.required': 'El campo {#label} es requerido',
      'string.empty': 'El campo {#label} no puede estar vacío'
    })

    const { error, value: rawQuery } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    })

    if (error) {
      return next(error)
    }

    Object.assign(req, { body: rawQuery })
    return next()
  }

  // Validación para GET /catalogo/:jobId
  if (method === 'GET' && path.includes('/catalogo/')) {
    const schema = Joi.object({
      jobId: Joi.string().required()
    }).messages({
      'any.required': 'El campo {#label} es requerido',
      'string.empty': 'El campo {#label} no puede estar vacío'
    })

    const { error, value: rawParams } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false
    })

    if (error) {
      return next(error)
    }

    Object.assign(req, { params: rawParams })
    return next()
  }

  // Validación para POST / (single validation)
  if (method === 'POST' && !path.endsWith('/catalogo')) {
    const schema = Joi.object({
      catalogoId: Joi.string().required(),
      itemId: Joi.string().required()
    }).messages({
      'any.required': 'El campo {#label} es requerido',
      'string.empty': 'El campo {#label} no puede estar vacío'
    })

    const { error, value: rawQuery } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true // Permitir campos adicionales para el item
    })

    if (error) {
      return next(error)
    }

    Object.assign(req, { body: rawQuery })
    return next()
  }

  return next()
}

export default middleware

