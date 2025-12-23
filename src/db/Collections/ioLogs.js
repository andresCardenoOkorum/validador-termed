/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Definición de colección para los logs de IO de una organización
 */

import dbConnection from '../MongoConnection.js'

const ioLogsCollections = {}

export const allCollections = () => ioLogsCollections

/**
* Se obtiene una colección a partir de un nombre
* @param {String} name Nombre de la colección de logs
* @return {Mongo.Collection}
*/
const getCollection = async (name) => {
  if (ioLogsCollections[name]) {
    return ioLogsCollections[name]
  }

  const indexes = [
    {
      index: {
        endUrl: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        baseUrl: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        clientIpAddress: 1
      },
      options: {
        background: true
      }
    },
    {
      index: {
        method: 1
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
    },
    {
      index: {
        withError: 1
      },
      options: {
        background: true
      }
    }
  ]

  const collection = await dbConnection.getCollection(name, indexes)

  ioLogsCollections[name] = collection

  return collection
}

export default getCollection

