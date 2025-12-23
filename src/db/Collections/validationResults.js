/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición de colección para resultados de validaciones
 */

import dbConnection from '../MongoConnection.js'

const validationResultsCollections = {}

export const allCollections = () => validationResultsCollections

/**
* Se obtiene una colección a partir de un nombre
* @param {String} name Nombre de la colección de resultados de validaciones
* @return {Promise<import('mongodb').Collection>}
*/
const getCollection = async (name) => {
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

export default getCollection

