/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Clase para conectarse a MongoDB
 */
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()
const {
  MONGODB_TERMED_URI,
  MONGODB_TERMED_DB_NAME = 'terminologia',
  CREATE_MONGO_INDEX = false,
  ALWAYS_CREATE_MONGO_INDEX = ''
} = process.env

/**
 * Clase que maneja la conexión a la base de datos MongoDB.
 */
class DatabaseConnection {
  constructor () {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance
    }
    /**
     * @type {MongoClient|null}
     * @private
     */
    this.client = null

    /**
     * @type {import('mongodb').Db|null}
     * @private
     */
    this.db = null

    /**
     * @type {Object<string, import('mongodb').Collection>}
     * @private
     */
    this.collections = {}

    DatabaseConnection.instance = this
    return this
  }

  /**
   * Conecta a la base de datos MongoDB.
   * @returns {Promise<import('mongodb').Db>} La instancia de la base de datos conectada.
   * @throws Error si ocurre un problema al conectar a la base de datos.
   */
  async connect () {
    if (this.db) return this.db

    const uri = MONGODB_TERMED_URI
    const db = MONGODB_TERMED_DB_NAME

    try {
      this.client = new MongoClient(uri, {
        readPreference: 'secondaryPreferred',
        readPreferenceTags: 'nodeType:ANALYTICS' // preferencia de nodo para operaciones de lectura
      })
      await this.client.connect()
      this.db = this.client.db(db)
      return this.db
    } catch (error) {
      console.error('Error connecting to database:', error)
      throw error
    }
  }

  /**
   * Obtiene una colección de la base de datos, creando índices si se proporcionan.
   * @param {string} name - El nombre de la colección.
   * @param {Array<{index: Object, options?: Object}>} [indexes=[]] - Una lista de índices a crear en la colección.
   * @returns {Promise<import('mongodb').Collection>} La colección de la base de datos.
   * @throws Error si ocurre un problema al conectar a la base de datos o al crear índices.
   */
  async getCollection (name, indexes = []) {
    if (!this.db) {
      await this.connect()
    }

    if (this.collections[name]) {
      return this.collections[name]
    }

    const collection = this.db.collection(name)
    this.collections[name] = collection

    const createMongoIndex = CREATE_MONGO_INDEX === 'true'
    const alwaysCreateMongoIndex = ALWAYS_CREATE_MONGO_INDEX.split(',')
    // Crear índices si se proporcionan
    if ((createMongoIndex || (!createMongoIndex && alwaysCreateMongoIndex.includes(name))) && indexes.length > 0) {
      await Promise.all(
        indexes
          .filter(({ index }) => index && typeof index === 'object' && Object.keys(index).length > 0)
          .map(async ({ index, options = {} }) => {
            try {
              await collection.createIndex(index, options)
            } catch (error) {
              console.error('ERROR', JSON.stringify(index, null, 2))
              console.error(`Error creating index on collection ${name}:`, error)
            }
          })
      )
    }

    return collection
  }

  /**
   * Cierra la conexión a la base de datos.
   * @returns {Promise<void>}
   * @throws Error si ocurre un problema al cerrar la conexión a la base de datos.
   */
  async close () {
    if (this.client) {
      try {
        await this.client.close()
      } catch (error) {
        console.error('Error closing database connection:', error)
      }
      this.client = null
      this.db = null
      this.collections = {}
    }
  }
}

/**
 * Instancia única de DatabaseConnection.
 * @type {DatabaseConnection}
 */
const dbConnection = new DatabaseConnection()

export default dbConnection

