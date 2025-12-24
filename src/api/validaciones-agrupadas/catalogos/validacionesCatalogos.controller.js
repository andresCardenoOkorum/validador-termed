/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Controller HTTP para validaciónes agrupadas de catálogos
 */

import validarCatalogoCompletoOrchestrator from '../../../orchestrators/catalogos/validarCatalogoCompleto.orchestrator.js'

export default {
  async validarCatalogoCompleto(req, res, next) {
    try {
      const { catalogoId, query } = req.validated

      const resultado = await validarCatalogoCompletoOrchestrator({
        catalogoId,
        query
      })

      return res.status(200).json({
        message: 'Validación completada',
        catalogoId,
        resultado
      })
    } catch (error) {
      return next(error)
    }
  }
}
