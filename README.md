# Validations Service

Microservicio de validaciones para catálogos de TerMed. Este servicio permite validar elementos de catálogos contra reglas configuradas, utilizando procesamiento batch asíncrono con BullMQ y Redis.

## Estructura del Proyecto

```
validations-service/
├── src/
│   ├── app.js                    # Punto de entrada principal
│   ├── server/
│   │   └── validations/
│   │       ├── index.js          # Router de Express
│   │       ├── validations.controller.js
│   │       ├── validations.middleware.js
│   │       ├── validations.helper.js
│   │       ├── batch/
│   │       │   ├── batch.controller.js
│   │       │   ├── batch.middleware.js
│   │       │   ├── batch.helper.js
│   │       │   └── validationWorker.js  # Worker de BullMQ
│   │       └── utils/
│   │           ├── ruleRegistry.js      # Funciones puras de reglas
│   │           ├── orchestrator.js      # Orquestación de validaciones
│   │           └── normalize.js        # Normalización de códigos
│   ├── db/
│   │   ├── MongoConnection.js    # Singleton de conexión MongoDB
│   │   └── Collections/
│   │       ├── validationsConfigs.js
│   │       ├── validationsRules.js
│   │       └── validationResults.js
│   ├── errors/
│   │   └── (errores personalizados)
│   └── auth/
│       └── (middleware de autenticación)
├── package.json
├── .env.example
└── README.md
```

## Endpoints

### POST /io/validations/catalogo
Crea un job de validación batch para un catálogo.

**Body:**
```json
{
  "catalogoId": "string",
  "query": {},
  "requestId": "string (opcional)"
}
```

**Response:**
```json
{
  "jobId": "string"
}
```

### GET /io/validations/catalogo/:jobId
Consulta el estado de un job de validación.

**Response:**
```json
{
  "jobId": "string",
  "state": "completed|active|waiting|failed",
  "progress": {
    "processed": 100,
    "total": 1000
  }
}
```

### POST /io/validations/
Valida un elemento individual (opcional).

**Body:**
```json
{
  "catalogoId": "string",
  "itemId": "string",
  ...
}
```

## Variables de Entorno

- `MONGODB_TERMED_URI`: URI de conexión a MongoDB
- `MONGODB_TERMED_DB_NAME`: Nombre de la base de datos (default: terminologia)
- `REDIS_HOST`: Host de Redis (default: localhost)
- `REDIS_PORT`: Puerto de Redis (default: 6379)
- `BATCH_SIZE`: Tamaño del batch para procesamiento (default: 1000)
- `PORT`: Puerto del servidor (default: 3000)

## Modelos de Datos

### validationsConfigs
Configuración de validaciones por contexto y tipo de objetivo.

```javascript
{
  context: string,           // p.ej. "catalogo_medicamentos"
  targetType: string,        // p.ej. "medicamento"
  enabled: boolean,
  validations: [
    {
      validationId: string,
      ruleType: string,      // "REFERENCE_EXISTENCE", "BOOLEAN_CHECK", "ENUM_WHITELIST"
      referenceSource: string, // "MST_CUM"
      targetAttributes: [string],
      sourceAttribute: string,
      params: object,
      blocking: boolean,
      enabled: boolean,
      priority: number
    }
  ]
}
```

### validationsRules
Metadatos de reglas de validación.

```javascript
{
  _id: string,               // validationId
  ruleType: string,
  referenceSource: string,
  params?: object,
  messages: { success?: string, failure?: string },
  recommendations?: { failure?: string },
  enabled: boolean
}
```

### validationResults
Resultados de validación por item.

```javascript
{
  catalogoId: string,
  itemId: ObjectId,
  jobId: string,
  overallStatus: 'pass' | 'fail' | 'error',
  ruleResults: [
    { 
      validationId: string, 
      status: 'pass'|'fail'|'skip'|'error', 
      message?: string, 
      meta?: any, 
      blocking?: boolean 
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm start
```

Para desarrollo con auto-reload:

```bash
npm run start:dev
```

## Autor

Okorum Technologies

