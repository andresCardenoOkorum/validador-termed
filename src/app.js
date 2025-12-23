/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Punto de entrada principal de la aplicación
 */

import dotenv from 'dotenv'
import dbConnection from './db/MongoConnection.js'
import { startServer } from './server.js'
import createValidationWorker from './server/validations/batch/validationWorker.js'

// Cargar variables de entorno
dotenv.config()

// Inicializar aplicación
const startApp = async () => {
  try {
    // Conectar a MongoDB
    console.log('Connecting to MongoDB...')
    await dbConnection.connect()
    console.log('MongoDB connected successfully')

    // Inicializar Worker de BullMQ
    console.log('Initializing BullMQ worker...')
    const worker = createValidationWorker()
    console.log('BullMQ worker initialized')

    // Iniciar servidor
    await startServer()

    // Manejo de cierre graceful
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing connections...')
      await worker.close()
      await dbConnection.close()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing connections...')
      await worker.close()
      await dbConnection.close()
      process.exit(0)
    })
  } catch (error) {
    console.error('Error starting application:', error)
    process.exit(1)
  }
}

// Iniciar aplicación
startApp()

export default startApp

