/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Repositorio para resultados de validaciones y reglas
 */

import dbConnection from '../db/MongoConnection.js'
import { ObjectId } from 'mongodb'

const validationResultsCollections = {}
const validationsRulesCollections = {}

/**
 * Obtiene una colección de resultados de validaciones
 * @param {String} name Nombre de la colección
 * @return {Promise<import('mongodb').Collection>}
 */
const getResultsCollection = async (name) => {
  if (validationResultsCollections[name]) {
    return validationResultsCollections[name]
  }

  const indexes = [
    {
      index: {
        catalogoId: 1,
        itemId: 1
      },
      options: {
        unique: true,
        background: true
      }
    },
    {
      index: {
        jobId: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        catalogoId: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        overallStatus: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        createdAt: 1
      },
      options: {
        background: true
      }
    }
  ]

  const collection = await dbConnection.getCollection(name, indexes)
  validationResultsCollections[name] = collection
  return collection
}

/**
 * Obtiene una colección de reglas de validaciones
 * @param {String} name Nombre de la colección
 * @return {Promise<import('mongodb').Collection>}
 */
const getRulesCollection = async (name) => {
  if (validationsRulesCollections[name]) {
    return validationsRulesCollections[name]
  }

  const indexes = [
    {
      index: {
        _id: 1
      },
      options: {
        unique: true,
        background: true
      }
    },
    {
      index: {
        enabled: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        ruleType: 1
      },
      options: {
        background: true
      }
    }
  ]

  const collection = await dbConnection.getCollection(name, indexes)
  validationsRulesCollections[name] = collection
  return collection
}

/**
 * Busca reglas por sus IDs
 * @param {Array<string>} validationIds - Array de IDs de validaciones
 * @returns {Promise<Array<Object>>} Array de reglas
 */
export const findRulesByIds = async (validationIds) => {
  const collection = await getRulesCollection('validationsRules')
  const objectIds = validationIds.map(id => {
    try {
      return typeof id === 'string' ? new ObjectId(id) : id
    } catch {
      return id
    }
  })
  
  return await collection.find({
    _id: { $in: objectIds },
    enabled: true
  }).toArray()
}

/**
 * Guarda o actualiza un resultado de validación
 * @param {Object} result - Resultado de validación
 * @returns {Promise<Object>} Resultado guardado
 */
export const saveResult = async (result) => {
  const collection = await getResultsCollection('validationResults')
  const now = new Date()
  
  const filter = {
    catalogoId: result.catalogoId,
    itemId: result.itemId
  }
  
  const update = {
    $set: {
      ...result,
      updatedAt: now
    },
    $setOnInsert: {
      createdAt: now
    }
  }
  
  await collection.updateOne(filter, update, { upsert: true })
  return await collection.findOne(filter)
}

/**
 * Busca resultados por jobId
 * @param {string} jobId - ID del job
 * @returns {Promise<Array<Object>>} Array de resultados
 */
export const findByJobId = async (jobId) => {
  const collection = await getResultsCollection('validationResults')
  return await collection.find({ jobId }).toArray()
}

/**
 * Busca un resultado por catalogoId e itemId
 * @param {string} catalogoId - ID del catálogo
 * @param {string} itemId - ID del item
 * @returns {Promise<Object|null>} Resultado o null
 */
export const findByCatalogoAndItem = async (catalogoId, itemId) => {
  const collection = await getResultsCollection('validationResults')
  return await collection.findOne({ catalogoId, itemId })
}

/**
 * Ejecuta operaciones bulk de resultados
 * @param {Array<Object>} operations - Operaciones bulk
 * @returns {Promise<Object>} Resultado del bulkWrite
 */
export const bulkWrite = async (operations) => {
  const collection = await getResultsCollection('validationResults')
  return await collection.bulkWrite(operations, { ordered: false })
}

export default {
  findRulesByIds,
  saveResult,
  findByJobId,
  findByCatalogoAndItem,
  bulkWrite
}

