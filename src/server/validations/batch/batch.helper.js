/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Helper para batch directo (opcional)
 */

import { TermedInstance } from '@okorum/termed'
import { loadConfig, loadRules, executeValidation } from '../../../orchestrators/validationOrchestrator.js'
import { normalize } from '../../../shared/utils.js'
import validationResultsRepository from '../../../persistence/validationResults.repository.js'
import { DEFAULT_TARGET_TYPE } from '../../../shared/constants.js'
import { ObjectId } from 'mongodb'

/**
 * Procesa un batch directo de validaciones
 * @param {Object} params - Parámetros
 * @param {string} params.catalogoId - ID del catálogo
 * @param {Array<Object>} params.items - Array de items a validar
 * @param {Object} params.query - Query opcional
 * @param {string} params.organizationId - ID de la organización
 * @returns {Promise<Object>} Resultados de validación
 */
const processBatchDirect = async ({ catalogoId, items, query, organizationId }) => {
  try {
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

    // Obtener colección MST_CUM
    const MST_CUM = await TermedInstance.getDynamicCollectionByName(organizationId, 'MST_CUM')
    const cumRawCollection = await MST_CUM.rawCollection()

    // Normalizar códigos y obtener documentos CUM
    const codigosNorm = items
      .filter(item => item.codigo)
      .map(item => normalize(item.codigo))
      .filter(codigo => codigo)

    const cumDocs = await cumRawCollection
      .find(
        { codigoNorm: { $in: codigosNorm } },
        { projection: { codigoNorm: 1, vigente: 1, muestra: 1, estadoRS: 1, modalidad: 1 } }
      )
      .toArray()

    const cumDocsMap = new Map()
    cumDocs.forEach(doc => {
      cumDocsMap.set(doc.codigoNorm, doc)
    })

    // Procesar items
    const results = []
    const bulkOps = []
    const now = new Date()

    for (const item of items) {
      try {
        let cumDoc = null
        if (item.codigo) {
          const codigoNorm = normalize(item.codigo)
          cumDoc = cumDocsMap.get(codigoNorm) || null
        }

        const result = executeValidation(item, config, rules, cumDoc)
        results.push({
          itemId: item._id || item.id,
          ...result
        })

        // Preparar para guardar
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
                jobId: 'direct',
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
        results.push({
          itemId: item._id || item.id,
          overallStatus: 'error',
          ruleResults: [{
            validationId: 'system',
            status: 'error',
            message: `Error al procesar item: ${error.message}`,
            blocking: false
          }]
        })
      }
    }

    // Ejecutar bulkWrite
    if (bulkOps.length > 0) {
      await validationResultsRepository.bulkWrite(bulkOps)
    }

    return {
      data: {
        processed: results.length,
        results
      }
    }
  } catch (error) {
    console.error('Error in batch direct:', error)
    return {
      error: true,
      message: `Error al procesar batch: ${error.message}`
    }
  }
}

export default processBatchDirect

