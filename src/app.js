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

// Cargar variables de entorno
dotenv.config()

// Inicializar aplicación
const startApp = async () => {
  try {
    // Conectar a MongoDB
    console.log('Connecting to MongoDB...')
    await dbConnection.connect()
    console.log('MongoDB connected successfully')

    // Iniciar servidor
    await startServer()

    // Manejo de cierre graceful
    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down...`)
      await dbConnection.close()
      server.close(() => {
        process.exit(0)
      })
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  } catch (error) {
    console.error('Error starting application:', error)
    process.exit(1)
  }
}

// Iniciar aplicación
startApp()

export default startApp

