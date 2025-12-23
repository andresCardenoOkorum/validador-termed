/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Middleware de validación para endpoint de batch directo
 */

import Joi from 'joi'

/**
 * Middleware que valida los parámetros para batch directo
 * @param {Object} req Argumento de solicitud de HTTP
 * @param {Object} res Argumento de respuesta de HTTP
 * @param {Object} next Argumento de devolución para función middleware
 * @returns {Object} Retorna next() o error
 */
const middleware = (req, res, next) => {
  const schema = Joi.object({
    catalogoId: Joi.string().required(),
    items: Joi.array().items(Joi.object()).min(1).required(),
    query: Joi.object().optional()
  }).messages({
    'any.required': 'El campo {#label} es requerido',
    'string.empty': 'El campo {#label} no puede estar vacío',
    'array.min': 'El campo {#label} debe tener al menos un elemento'
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

export default middleware

