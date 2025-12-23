/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Orquestador de validaciones
 */

import validationConfigRepository from '../persistence/validationConfig.repository.js'
import validationResultsRepository from '../persistence/validationResults.repository.js'
import { runPipeline } from '../core/engine/validationEngine.js'

/**
 * Carga la configuración de validaciones para un contexto y tipo de objetivo
 * @param {string} context - Contexto de validación (p.ej. "catalogo_medicamentos")
 * @param {string} targetType - Tipo de objetivo (p.ej. "medicamento")
 * @param {string} organizationId - ID de la organización
 * @returns {Promise<Object|null>} Configuración de validaciones o null si no existe
 */
export const loadConfig = async (context, targetType, organizationId) => {
  try {
    return await validationConfigRepository.findByContextAndTargetType(context, targetType)
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

    return await validationResultsRepository.findRulesByIds(validationIds)
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
export const executeValidation = (item, config, rules, cumDoc = null) => {
  return runPipeline(item, config, rules, cumDoc)
}

// Alias para compatibilidad con código existente
const runPipelineAlias = executeValidation

export default {
  loadConfig,
  loadRules,
  executeValidation,
  runPipeline: runPipelineAlias
}

