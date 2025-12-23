/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Helper de validaciones
 */

import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { TermedInstance } from '@okorum/termed'
import { loadConfig, loadRules, runPipeline } from './utils/orchestrator.js'
import normalize from './utils/normalize.js'

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = 6379
} = process.env

// Crear conexión Redis para BullMQ
const redisConnection = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  maxRetriesPerRequest: null
})

// Crear Queue de BullMQ
const validationsQueue = new Queue('validations', {
  connection: redisConnection
})

/**
 * Helper para crear un job de validación batch
 * @param {Object} params - Parámetros
 * @param {string} params.catalogoId - ID del catálogo
 * @param {Object} params.query - Query opcional para filtrar el catálogo
 * @param {string} params.requestId - ID de la petición (opcional)
 * @param {string} params.organizationId - ID de la organización
 * @returns {Promise<Object>} Objeto con jobId
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
 * @param {Object} params - Parámetros
 * @param {string} params.jobId - ID del job
 * @returns {Promise<Object>} Estado del job
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
 * @param {Object} params - Parámetros
 * @param {string} params.catalogoId - ID del catálogo
 * @param {string} params.itemId - ID del item
 * @param {Object} params.item - Datos del item (opcional, si no se proporciona se busca por itemId)
 * @param {string} params.organizationId - ID de la organización
 * @returns {Promise<Object>} Resultado de la validación
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

    // Determinar contexto y targetType (por ahora usar valores por defecto)
    // TODO: Esto debería venir de la configuración del catálogo
    const context = `catalogo_${catalogoId}`
    const targetType = 'medicamento' // Por defecto, debería ser configurable

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
    const result = runPipeline(item, config, rules, cumDoc)

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
 * Helper principal que enruta según el método y path
 * @param {Object} params - Parámetros
 * @param {Object} params.body - Body de la petición
 * @param {Object} params.query - Query de la petición
 * @param {Object} params.params - Params de la petición
 * @param {string} params.organizationId - ID de la organización
 * @param {string} params.method - Método HTTP
 * @param {string} params.path - Path de la petición
 * @returns {Promise<Object>} Resultado
 */
const helper = async ({ body, query, params, organizationId, method, path }) => {
  // POST /catalogo - Crear job
  if (method === 'POST' && path.endsWith('/catalogo')) {
    return createValidationJob({
      catalogoId: body.catalogoId,
      query: body.query,
      requestId: body.requestId,
      organizationId
    })
  }

  // GET /catalogo/:jobId - Estado del job
  if (method === 'GET' && path.includes('/catalogo/')) {
    return getJobStatus({
      jobId: params.jobId
    })
  }

  // POST / - Validación single
  if (method === 'POST' && !path.endsWith('/catalogo')) {
    return validateSingle({
      catalogoId: body.catalogoId,
      itemId: body.itemId,
      item: body,
      organizationId
    })
  }

  return {
    error: true,
    message: 'Endpoint no reconocido'
  }
}

export default helper

