/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Router de validaciones
 */

import express from 'express'
import validationsController from './engine.controller.js'
import validationsMiddleware from '../../server/validations/validations.middleware.js'

const engineRouter = express.Router()

// POST /catalogo - Crea un job de validación batch
engineRouter.post('/catalogo', validationsMiddleware, validationsController)

// POST / - Validación single
engineRouter.post('/', validationsMiddleware, validationsController)

export default engineRouter

