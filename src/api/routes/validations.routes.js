/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Router de validaciones
 */

import express from 'express'
import validationsController from '../controllers/validations.controller.js'
import validationsMiddleware from '../../server/validations/validations.middleware.js'

const validationsRouter = express.Router()

// POST /catalogo - Crea un job de validación batch
validationsRouter.post('/catalogo', validationsMiddleware, validationsController)

// GET /catalogo/:jobId - Consulta el estado de un job
validationsRouter.get('/catalogo/:jobId', validationsMiddleware, validationsController)

// POST / - Validación single
validationsRouter.post('/', validationsMiddleware, validationsController)

export default validationsRouter

