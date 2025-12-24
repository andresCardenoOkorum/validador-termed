/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Servidor HTTP de la aplicación
 */

import express, { json } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import errorHandler from './errors/errorHandler.js'
import authzMiddleware from './server/authz.js'
import ipMiddleware from './server/ipMiddleware.js'
import engineRouter from './api/engine/engine.routes.js'
import orchestratorsRouter from './api/orchestrators/orchestrators.routes.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware de Express
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(helmet({ expectCt: { enforce: true } }))
app.use(morgan('HTTP/:http-version :method :url :status :response-time ms'))

// Health check endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Validador TerMed funcionando',
    status: 'ok',
    timestamp: new Date()
  })
})

// Rutas de validaciones
app.use(
  '/api/engine/',
  authzMiddleware,
  ipMiddleware,
  engineRouter
)
app.use(
  '/api/validaciones-catalogos/',
  authzMiddleware,
  ipMiddleware,
  orchestratorsRouter
)

// Manejo de rutas no encontradas
app.use((_req, res) => res.status(404).json({
  message: 'Servicio no encontrado',
  status: 404,
  timestamp: new Date()
}))

// Manejo de errores (debe ser el último middleware)
app.use(errorHandler)

export default app

export const startServer = (port = PORT) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Validador escuchando en el puerto ${port}`)
      resolve(server)
    })
    server.on('error', (error) => { reject(error) })
  })
}

