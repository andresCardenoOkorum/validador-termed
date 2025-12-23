/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Repositorio para configuraciones de validaciones
 */

import dbConnection from '../db/MongoConnection.js'

const validationsConfigsCollections = {}

/**
 * Obtiene una colección de configuraciones de validaciones
 * @param {String} name Nombre de la colección
 * @return {Promise<import('mongodb').Collection>}
 */
const getCollection = async (name) => {
  if (validationsConfigsCollections[name]) {
    return validationsConfigsCollections[name]
  }

  const indexes = [
    {
      index: {
        context: 1,
        targetType: 1,
        enabled: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        context: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        targetType: 1
      },
      options: {
        background: true
      }
    }
  ]

  const collection = await dbConnection.getCollection(name, indexes)
  validationsConfigsCollections[name] = collection
  return collection
}

/**
 * Busca una configuración por contexto y tipo de objetivo
 * @param {string} context - Contexto de validación
 * @param {string} targetType - Tipo de objetivo
 * @returns {Promise<Object|null>} Configuración o null si no existe
 */
export const findByContextAndTargetType = async (context, targetType) => {
  const collection = await getCollection('validationsConfigs')
  return await collection.findOne({
    context,
    targetType,
    enabled: true
  })
}

/**
 * Crea una nueva configuración
 * @param {Object} config - Configuración a crear
 * @returns {Promise<Object>} Configuración creada
 */
export const create = async (config) => {
  const collection = await getCollection('validationsConfigs')
  const result = await collection.insertOne(config)
  return await collection.findOne({ _id: result.insertedId })
}

/**
 * Actualiza una configuración
 * @param {string} id - ID de la configuración
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object|null>} Configuración actualizada o null
 */
export const update = async (id, updates) => {
  const collection = await getCollection('validationsConfigs')
  await collection.updateOne(
    { _id: id },
    { $set: updates }
  )
  return await collection.findOne({ _id: id })
}

export default {
  findByContextAndTargetType,
  create,
  update
}

