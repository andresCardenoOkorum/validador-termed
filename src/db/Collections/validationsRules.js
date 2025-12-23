/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición de colección para reglas de validaciones
 */

import dbConnection from '../MongoConnection.js'

const validationsRulesCollections = {}

export const allCollections = () => validationsRulesCollections

/**
* Se obtiene una colección a partir de un nombre
* @param {String} name Nombre de la colección de reglas de validaciones
* @return {Promise<import('mongodb').Collection>}
*/
const getCollection = async (name) => {
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

export default getCollection

