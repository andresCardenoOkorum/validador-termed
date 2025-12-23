/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Punto de entrada principal de la aplicación
 */

import express, { json } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUI from 'swagger-ui-express'
import dotenv from 'dotenv'

import errorHandler from './errors/errorHandler.js'
import authzMiddleware from './server/authz.js'
import ipMiddleware from './server/ipMiddleware.js'
import validationsRouter from './server/validations/index.js'
import dbConnection from './db/MongoConnection.js'
import createValidationWorker from './server/validations/batch/validationWorker.js'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware de Express
app.use(json())
app.use(express.json({ limit: '2048kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(helmet({
  expectCt: {
    enforce: true
  }
}))
app.use(morgan('HTTP/:http-version :method :url :status :response-time ms'))

// Health check endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Validations Service is running',
    status: 'ok',
    timestamp: new Date()
  })
})

// Rutas de validaciones
app.use(
  '/io/validations/',
  authzMiddleware,
  ipMiddleware,
  validationsRouter
)

// Manejo de rutas no encontradas
app.use((_req, res) => res.status(404).json({
  message: 'Servicio no encontrado',
  status: 404,
  timestamp: new Date()
}))

// Manejo de errores (debe ser el último middleware)
app.use(errorHandler)

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
    app.listen(PORT, () => {
      console.log(`Validations Service listening at port ${PORT}`)
    })

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

export default app

