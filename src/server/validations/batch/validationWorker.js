/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Worker de BullMQ para procesamiento batch de validaciones
 */

import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { TermedInstance } from '@okorum/termed'
import { ObjectId } from 'mongodb'
import { loadConfig, loadRules, executeValidation } from '../../../orchestrators/validationOrchestrator.js'
import { normalize } from '../../../shared/utils.js'
import { REDIS_CONFIG, BATCH_SIZE, DEFAULT_TARGET_TYPE } from '../../../shared/constants.js'
import validationResultsRepository from '../../../persistence/validationResults.repository.js'

// Crear conexión Redis para BullMQ
const redisConnection = new Redis(REDIS_CONFIG)

/**
 * Procesa un job de validación batch
 * @param {Object} job - Job de BullMQ
 * @returns {Promise<void>}
 */
const processValidationJob = async (job) => {
  const { catalogoId, query, organizationId, requestId } = job.data

  try {
    console.log(`Processing validation job ${job.id} for catalogo ${catalogoId}`)

    // Obtener colección del catálogo
    const catalogoCollection = await TermedInstance.getDynamicCollectionByName(
      organizationId,
      catalogoId
    )

    if (!catalogoCollection) {
      throw new Error(`Catálogo ${catalogoId} no encontrado`)
    }

    const rawCollection = await catalogoCollection.rawCollection()

    // Contar total de documentos
    const total = await rawCollection.countDocuments(query || {})
    console.log(`Total items to validate: ${total}`)

    // Inicializar progreso
    await job.updateProgress({ processed: 0, total })

    // Determinar contexto y targetType
    const context = `catalogo_${catalogoId}`
    const targetType = DEFAULT_TARGET_TYPE

    // Cargar configuración de validaciones
    const config = await loadConfig(context, targetType, organizationId)
    if (!config) {
      throw new Error(`No hay configuración de validaciones para contexto ${context} y tipo ${targetType}`)
    }

    // Cargar reglas
    const validationIds = config.validations
      .filter(v => v.enabled)
      .map(v => v.validationId)
    const rules = await loadRules(validationIds)

    // Obtener colección MST_CUM para consultas
    const MST_CUM = await TermedInstance.getDynamicCollectionByName(organizationId, 'MST_CUM')
    const cumRawCollection = await MST_CUM.rawCollection()

    // Procesar en batches
    let processed = 0
    const batchSize = BATCH_SIZE

    // Crear cursor para paginar
    const cursor = rawCollection.find(query || {})

    let batch = []
    const bulkOps = []

    while (await cursor.hasNext()) {
      const item = await cursor.next()
      batch.push(item)

      // Cuando el batch está lleno, procesarlo
      if (batch.length >= batchSize) {
        await processBatch(batch, {
          catalogoId,
          jobId: job.id,
          config,
          rules,
          cumRawCollection,
          bulkOps
        })

        processed += batch.length
        await job.updateProgress({ processed, total })
        batch = []

        console.log(`Processed ${processed}/${total} items`)
      }
    }

    // Procesar batch restante
    if (batch.length > 0) {
      await processBatch(batch, {
        catalogoId,
        jobId: job.id,
        config,
        rules,
        cumRawCollection,
        bulkOps
      })
      processed += batch.length
    }

    // Ejecutar bulkWrite final
    if (bulkOps.length > 0) {
      await validationResultsRepository.bulkWrite(bulkOps)
      console.log(`BulkWrite completed: ${bulkOps.length} operations`)
    }

    await job.updateProgress({ processed, total })
    console.log(`Validation job ${job.id} completed: ${processed}/${total} items processed`)

    return { processed, total }
  } catch (error) {
    console.error(`Error processing validation job ${job.id}:`, error)
    throw error
  }
}

/**
 * Procesa un batch de items
 * @param {Array<Object>} batch - Array de items a procesar
 * @param {Object} options - Opciones de procesamiento
 */
const processBatch = async (batch, options) => {
  const {
    catalogoId,
    jobId,
    config,
    rules,
    cumRawCollection,
    bulkOps
  } = options

  // Normalizar códigos y obtener documentos CUM
  const codigosNorm = batch
    .filter(item => item.codigo)
    .map(item => normalize(item.codigo))
    .filter(codigo => codigo)

  // Consultar MST_CUM con $in
  const cumDocs = await cumRawCollection
    .find(
      { codigoNorm: { $in: codigosNorm } },
      { projection: { codigoNorm: 1, vigente: 1, muestra: 1, estadoRS: 1, modalidad: 1 } }
    )
    .toArray()

  // Crear mapa de documentos CUM por código normalizado
  const cumDocsMap = new Map()
  cumDocs.forEach(doc => {
    cumDocsMap.set(doc.codigoNorm, doc)
  })

  // Procesar cada item del batch
  for (const item of batch) {
    try {
      // Obtener documento CUM si existe
      let cumDoc = null
      if (item.codigo) {
        const codigoNorm = normalize(item.codigo)
        cumDoc = cumDocsMap.get(codigoNorm) || null
      }

      // Ejecutar pipeline de validaciones
      const result = executeValidation(item, config, rules, cumDoc)

      // Preparar operación de upsert
      const now = new Date()
      bulkOps.push({
        updateOne: {
          filter: {
            catalogoId,
            itemId: item._id || new ObjectId()
          },
          update: {
            $set: {
              catalogoId,
              itemId: item._id || new ObjectId(),
              jobId,
              overallStatus: result.overallStatus,
              ruleResults: result.ruleResults,
              updatedAt: now
            },
            $setOnInsert: {
              createdAt: now
            }
          },
          upsert: true
        }
      })
    } catch (error) {
      console.error(`Error processing item ${item._id}:`, error)
      // Agregar resultado de error para este item
      bulkOps.push({
        updateOne: {
          filter: {
            catalogoId,
            itemId: item._id || new ObjectId()
          },
          update: {
            $set: {
              catalogoId,
              itemId: item._id || new ObjectId(),
              jobId,
              overallStatus: 'error',
              ruleResults: [{
                validationId: 'system',
                status: 'error',
                message: `Error al procesar item: ${error.message}`,
                blocking: false
              }],
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      })
    }
  }
}

/**
 * Crea e inicializa el Worker de BullMQ
 * @returns {Worker} Instancia del Worker
 */
const createValidationWorker = () => {
  const worker = new Worker('validations', processValidationJob, {
    connection: redisConnection,
    concurrency: 1, // Procesar un job a la vez
    removeOnComplete: {
      count: 100, // Mantener últimos 100 jobs completados
      age: 24 * 3600 // 24 horas
    },
    removeOnFail: {
      count: 1000 // Mantener últimos 1000 jobs fallidos
    }
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  return worker
}

export default createValidationWorker

