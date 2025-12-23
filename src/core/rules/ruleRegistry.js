/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Registry de funciones puras de reglas de validación
 */

import { referenceExistence } from './implementations/existence.rule.js'
import { booleanCheck } from './implementations/booleanCheck.rule.js'
import { enumWhitelist } from './implementations/enumWhitelist.rule.js'

/**
 * Registry de funciones de reglas disponibles
 */
const ruleRegistry = {
  REFERENCE_EXISTENCE: referenceExistence,
  BOOLEAN_CHECK: booleanCheck,
  ENUM_WHITELIST: enumWhitelist
}

export default ruleRegistry

