/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Middleware de validación de orquestadores - catálogos
 */

import Joi from 'joi'

const schema = Joi.object({
  catalogoId: Joi.string()
    .trim()
    .min(3)
    .required(),
})
.messages({
  'any.required': 'El campo {#label} es requerido',
  'string.empty': 'El campo {#label} no puede estar vacío',
  'string.min': 'El campo {#label} debe tener al menos {#limit} caracteres'
})

export default (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false
  })

  if (error) {
    error.statusCode = 400
    return next(error)
  }

  // Normalizamos el request
  req.body = value

  return next()
}
