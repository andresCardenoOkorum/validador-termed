/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Controlador de validaciones
 */

import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { TermedInstance } from '@okorum/termed'
import { loadConfig, loadRules, executeValidation } from '../../orchestrators/validationOrchestrator.js'
import { normalize } from '../../shared/utils.js'
import { REDIS_CONFIG, DEFAULT_TARGET_TYPE } from '../../shared/constants.js'
import getIOLogsCollection from '../../db/Collections/ioLogs.js'

// Crear conexión Redis para BullMQ
const redisConnection = new Redis(REDIS_CONFIG)

// Crear Queue de BullMQ
const validationsQueue = new Queue('validations', {
  connection: redisConnection
})

/**
 * Helper para crear un job de validación batch
 */
const createValidationJob = async ({ catalogoId, query, requestId, organizationId }) => {
  try {
    // Verificar que el catálogo existe
    const catalogoCollection = await TermedInstance.getDynamicCollectionByName(
      organizationId,
      catalogoId
    )

    if (!catalogoCollection) {
      return {
        error: true,
        message: `Catálogo ${catalogoId} no encontrado`
      }
    }

    // Crear job en BullMQ
    const job = await validationsQueue.add('validate-catalogo', {
      catalogoId,
      query: query || {},
      organizationId,
      requestId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    })

    return {
      data: {
        jobId: job.id
      }
    }
  } catch (error) {
    console.error('Error creating validation job:', error)
    return {
      error: true,
      message: `Error al crear job de validación: ${error.message}`
    }
  }
}

/**
 * Helper para obtener el estado de un job
 */
const getJobStatus = async ({ jobId }) => {
  try {
    const job = await validationsQueue.getJob(jobId)

    if (!job) {
      return {
        error: true,
        message: `Job ${jobId} no encontrado`
      }
    }

    const state = await job.getState()
    const progress = job.progress || { processed: 0, total: 0 }

    return {
      data: {
        jobId: job.id,
        state,
        progress
      }
    }
  } catch (error) {
    console.error('Error getting job status:', error)
    return {
      error: true,
      message: `Error al obtener estado del job: ${error.message}`
    }
  }
}

/**
 * Helper para validación single
 */
const validateSingle = async ({ catalogoId, itemId, item: itemData, organizationId }) => {
  try {
    // Obtener colección del catálogo
    const catalogoCollection = await TermedInstance.getDynamicCollectionByName(
      organizationId,
      catalogoId
    )

    if (!catalogoCollection) {
      return {
        error: true,
        message: `Catálogo ${catalogoId} no encontrado`
      }
    }

    // Obtener el item si no se proporcionó
    let item = itemData
    if (!item) {
      const rawCollection = await catalogoCollection.rawCollection()
      item = await rawCollection.findOne({ _id: itemId })
      if (!item) {
        return {
          error: true,
          message: `Item ${itemId} no encontrado en catálogo ${catalogoId}`
        }
      }
    }

    // Determinar contexto y targetType
    const context = `catalogo_${catalogoId}`
    const targetType = DEFAULT_TARGET_TYPE

    // Cargar configuración de validaciones
    const config = await loadConfig(context, targetType, organizationId)
    if (!config) {
      return {
        error: true,
        message: `No hay configuración de validaciones para contexto ${context} y tipo ${targetType}`
      }
    }

    // Cargar reglas
    const validationIds = config.validations
      .filter(v => v.enabled)
      .map(v => v.validationId)
    const rules = await loadRules(validationIds)

    // Obtener documento CUM si es necesario
    let cumDoc = null
    if (item.codigo) {
      const codigoNorm = normalize(item.codigo)
      const MST_CUM = await TermedInstance.getDynamicCollectionByName(organizationId, 'MST_CUM')
      const cumRawCollection = await MST_CUM.rawCollection()
      cumDoc = await cumRawCollection.findOne(
        { codigoNorm },
        { projection: { codigoNorm: 1, vigente: 1, muestra: 1, estadoRS: 1, modalidad: 1 } }
      )
    }

    // Ejecutar pipeline de validaciones
    const result = executeValidation(item, config, rules, cumDoc)

    return {
      data: result
    }
  } catch (error) {
    console.error('Error in single validation:', error)
    return {
      error: true,
      message: `Error al validar item: ${error.message}`
    }
  }
}

/**
 * Controlador principal que enruta según el método y path
 */
const controller = async (req, res, next) => {
  const { insertedIdLog, organizationId, _startTime } = req
  const initialTimeDate = new Date()
  
  try {
    const { method, path } = req
    let response

    // POST /catalogo - Crear job
    if (method === 'POST' && path.endsWith('/catalogo')) {
      response = await createValidationJob({
        catalogoId: req.body.catalogoId,
        query: req.body.query,
        requestId: req.body.requestId,
        organizationId
      })
    }
    // POST / - Validación single
    else if (method === 'POST' && !path.endsWith('/catalogo')) {
      response = await validateSingle({
        catalogoId: req.body.catalogoId,
        itemId: req.body.itemId,
        item: req.body,
        organizationId
      })
    }
    else {
      response = {
        error: true,
        message: 'Endpoint no reconocido'
      }
    }

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

