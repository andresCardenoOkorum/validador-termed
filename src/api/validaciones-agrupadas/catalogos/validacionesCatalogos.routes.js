/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Rutas para validaciones agrupadas de catálogos
 */

import { Router } from 'express'
import catalogosMiddleware from './catalogos.middleware.js'
import catalogosController from './catalogos.controller.js'

const router = Router()

// Validar todo un catálogo
router.post(
  '/:catalogoId/validar',
  catalogosMiddleware.validarCatalogoCompleto,
  catalogosController.validarCatalogoCompleto
)

export default router
