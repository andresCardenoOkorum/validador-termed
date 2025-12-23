/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición de colección para configuraciones de validaciones
 */

import dbConnection from '../MongoConnection.js'

const validationsConfigsCollections = {}

export const allCollections = () => validationsConfigsCollections

/**
* Se obtiene una colección a partir de un nombre
* @param {String} name Nombre de la colección de configuraciones de validaciones
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

export default getCollection

