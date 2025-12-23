/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Constantes compartidas del servicio
 */

export const VALIDATION_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  ERROR: 'error',
  SKIP: 'skip'
}

export const OVERALL_STATUS = {
  PASS: 'pass',
  FAIL: 'fail',
  ERROR: 'error'
}

export const RULE_TYPES = {
  REFERENCE_EXISTENCE: 'REFERENCE_EXISTENCE',
  BOOLEAN_CHECK: 'BOOLEAN_CHECK',
  ENUM_WHITELIST: 'ENUM_WHITELIST'
}

export const DEFAULT_TARGET_TYPE = 'medicamento'

export const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || '1000', 10)

export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null
}

