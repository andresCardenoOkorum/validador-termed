/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Middleware de validaciones agrupadas de catálogos
 */

import Joi from 'joi'

const schemaValidarCatalogoCompleto = Joi.object({
  catalogoId: Joi.string().min(2).required(),
  query: Joi.object().unknown(false).optional()
})

export default {
  validarCatalogoCompleto: (req, res, next) => {
    const data = { ...req.params, ...req.body }
    const { error, value } = schemaValidarCatalogoCompleto.validate(data, {
      abortEarly: false,
      allowUnknown: false
    })

    if (error) {
      error.statusCode = 400
      return next(error)
    }

    req.validated = value // dejamos la data limpia
    next()
  }
}
