/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Orquestador de validaciones
 */

import _ from 'lodash'
import getValidationsConfigsCollection from '../../../db/Collections/validationsConfigs.js'
import getValidationsRulesCollection from '../../../db/Collections/validationsRules.js'
import ruleRegistry from './ruleRegistry.js'

/**
 * Carga la configuración de validaciones para un contexto y tipo de objetivo
 * @param {string} context - Contexto de validación (p.ej. "catalogo_medicamentos")
 * @param {string} targetType - Tipo de objetivo (p.ej. "medicamento")
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object|null>} Configuración de validaciones o null si no existe
 */
export const loadConfig = async (context, targetType, organizationId) => {
  try {
    const collection = await getValidationsConfigsCollection('validationsConfigs')
    const config = await collection.findOne({
      context,
      targetType,
      enabled: true
    })

    return config
  } catch (error) {
    console.error('Error loading validation config:', error)
    throw error
  }
}

/**
 * Carga las reglas de validación por sus IDs
 * @param {Array<string>} validationIds - Array de IDs de validaciones
 * @returns {Promise<Array<Object>>} Array de reglas de validación
 */
export const loadRules = async (validationIds) => {
  try {
    if (!validationIds || validationIds.length === 0) {
      return []
    }

    const collection = await getValidationsRulesCollection('validationsRules')
    const rules = await collection.find({
      _id: { $in: validationIds },
      enabled: true
    }).toArray()

    return rules
  } catch (error) {
    console.error('Error loading validation rules:', error)
    throw error
  }
}

/**
 * Ejecuta el pipeline de validaciones para un item
 * @param {Object} item - Item del catálogo a validar
 * @param {Object} config - Configuración de validaciones
 * @param {Array<Object>} rules - Array de reglas de validación
 * @param {Object} cumDoc - Documento de referencia desde MST_CUM (opcional)
 * @returns {Object} Resultado de la validación con overallStatus y ruleResults
 */
export const runPipeline = (item, config, rules, cumDoc = null) => {
  if (!config || !config.validations || config.validations.length === 0) {
    return {
      overallStatus: 'pass',
      ruleResults: [],
      message: 'No hay validaciones configuradas'
    }
  }

  // Crear un mapa de reglas por validationId para acceso rápido
  const rulesMap = _.keyBy(rules, '_id')

  // Ordenar validaciones por priority (menor número = mayor prioridad)
  const sortedValidations = _.sortBy(
    config.validations.filter(v => v.enabled),
    'priority'
  )

  const ruleResults = []
  let hasBlockingFailure = false

  // Ejecutar validaciones en orden
  for (const validation of sortedValidations) {
    // Si ya hay un fallo bloqueante, podemos hacer short-circuit
    if (hasBlockingFailure && validation.blocking) {
      ruleResults.push({
        validationId: validation.validationId,
        status: 'skip',
        message: 'Saltado debido a fallo bloqueante previo',
        blocking: validation.blocking
      })
      continue
    }

    // Obtener la regla correspondiente
    const rule = rulesMap[validation.validationId]
    if (!rule) {
      ruleResults.push({
        validationId: validation.validationId,
        status: 'error',
        message: `Regla no encontrada: ${validation.validationId}`,
        blocking: validation.blocking || false
      })
      continue
    }

    // Obtener la función de regla del registry
    const ruleFunction = ruleRegistry[rule.ruleType]
    if (!ruleFunction) {
      ruleResults.push({
        validationId: validation.validationId,
        status: 'error',
        message: `Tipo de regla no soportado: ${rule.ruleType}`,
        blocking: validation.blocking || false
      })
      continue
    }

    // Preparar parámetros de la regla
    const ruleParams = {
      ...rule.params,
      ...validation,
      referenceSource: validation.referenceSource || rule.referenceSource
    }

    // Crear contexto para la regla
    const ctx = {
      item,
      cumDoc,
      validation,
      rule
    }

    // Ejecutar la regla
    const result = ruleFunction(ruleParams, ctx)

    // Agregar información adicional al resultado
    const ruleResult = {
      validationId: validation.validationId,
      status: result.status,
      message: result.message || rule.messages?.[result.status] || '',
      meta: result.meta,
      blocking: result.blocking !== undefined ? result.blocking : (validation.blocking || false)
    }

    ruleResults.push(ruleResult)

    // Si hay un fallo bloqueante, marcar para short-circuit
    if (result.status === 'fail' && ruleResult.blocking) {
      hasBlockingFailure = true
    }
  }

  // Determinar overallStatus
  let overallStatus = 'pass'
  if (hasBlockingFailure) {
    overallStatus = 'fail'
  } else {
    const hasFailures = ruleResults.some(r => r.status === 'fail')
    const hasErrors = ruleResults.some(r => r.status === 'error')
    if (hasErrors) {
      overallStatus = 'error'
    } else if (hasFailures) {
      overallStatus = 'fail'
    }
  }

  return {
    overallStatus,
    ruleResults
  }
}

export default {
  loadConfig,
  loadRules,
  runPipeline
}

