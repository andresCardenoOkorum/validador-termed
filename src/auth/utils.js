/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Utilidades de servicios REST
 */

import JWT from 'jsonwebtoken'

const {
  algorithm = 'HS256',
  expiresIn = 300,
  issuer = 'termed.io',
  privateKey: secretKey = ['mysecret'],
  publicKey: pubKey = ['mysecret'],
  subject = 'io'
} = (process.env.JWT || {})

const privateKey = secretKey
  .join('\n')

const publicKey = pubKey
  .join('\n')

/**
 * Generar token JWT
 * @param {Object} payload Datos a codificar en token JWT
 * @returns {Promise<Object>}
 */
const signToken = async payload => new Promise((resolve, reject) =>
  JWT.sign(payload, privateKey, {
    algorithm, expiresIn, issuer, subject
  }, (error, accessToken) => {
    if (error) {
      return reject(error)
    }

    return resolve({
      accessToken,
      expiresIn,
      type: 'bearer'
    })
  }))

/**
 * Validación de tokens JWT generados
 * @param {String} token Token JWT
 * @returns {Promise<Object>}
 */
const validateToken = async token => new Promise((resolve, reject) => JWT
  .verify(token, publicKey, {
    algorithms: [algorithm],
    issuer,
    subject
  }, (error, data) => {
    if (error) {
      return reject(error)
    }

    return resolve(data)
  }))

/**
 * @constant
 * @type {String}
 * @default
 */
export const CLIENT_IP_ADDRESS_HEADER = 'x-forwarded-for'

/**
 * Obtener la dirección IP desde la cual un cliente/sistema llama los servicios
 * @param {Object} headers Express request headers
 * @returns {String} Dirección IP del cliente llamando el servicio
 */
export const getClientIpAddress = (headers) => {
  const { [CLIENT_IP_ADDRESS_HEADER]: forwardedIpAddresses } = headers

  console.log('> Direcciones IP petición', forwardedIpAddresses)

  const ipAddress = (forwardedIpAddresses || '')
    .split(',')[0]

  console.log('> Dirección IP Cliente', ipAddress)

  return ipAddress
}

export default {
  signToken,
  validateToken
}

