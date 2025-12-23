/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Controlador de validaciones
 */

import helper from './validations.helper.js'
import getIOLogsCollection from '../../db/Collections/ioLogs.js'

/**
 * Controlador del endpoint de validaciones
 * @param {Object} req Argumento de solicitud de HTTP
 * @param {Object} res Argumento de respuesta de HTTP
 * @param {Object} next Argumento de devolución para función middleware
 * @returns {res} Retorna un status code y una respuesta con el JSON
 */
const controller = async (req, res, next) => {
  const { insertedIdLog, organizationId, _startTime } = req
  const initialTimeDate = new Date()
  try {
    const response = await helper({
      body: req.body,
      query: req.query,
      params: req.params,
      organizationId,
      method: req.method,
      path: req.path
    })

    if (response.error) {
      return res.status(400).json(response)
    }

    return res.status(200).json(response)
  } catch (error) {
    return next(error)
  } finally {
    if (insertedIdLog) {
      const finalTimeDate = new Date()
      const elapsedControllerTimeInMs = finalTimeDate - initialTimeDate
      const elapsedFullEndpointTimeInMs = finalTimeDate - new Date(_startTime)
      const ioLogsRawCollection = await getIOLogsCollection(`ioLogs_${organizationId}`)
      ioLogsRawCollection.updateOne(
        { _id: insertedIdLog },
        { $set: { elapsedControllerTimeInMs, elapsedFullEndpointTimeInMs } }
      )
    }
  }
}

export default controller

