/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Utilidad para normalizar códigos
 */

/**
 * Normaliza un código removiendo el cero inicial si existe
 * @param {string} codigo - Código a normalizar
 * @returns {string} Código normalizado
 */
const normalize = (codigo) => {
  if (!codigo || typeof codigo !== 'string') {
    return codigo
  }

  // Si empieza con '0', remover
  if (codigo.startsWith('0')) {
    return codigo.substring(1)
  }

  return codigo
}

export default normalize

