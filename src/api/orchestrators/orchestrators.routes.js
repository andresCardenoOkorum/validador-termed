/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Router de orquestadores
 */

import express from 'express'
import catalogosController from './catalogos/catalogos.controller.js'
import catalogosMiddleware from './catalogos/catalogos.middleware.js'

const orchestratorsRouter = express.Router()

// POST /catalogo
orchestratorsRouter.post('/catalogos', catalogosMiddleware, catalogosController)

export default orchestratorsRouter
