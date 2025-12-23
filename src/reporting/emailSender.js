/**
 * @author Okorum Technologies
 * @copyright Derechos reservados. Se deberá mantener el crédito al autor dados
 * los derechos de propiedad intelectual que le corresponden
 *
 * @description Enviador de emails para reportes de validación
 */

/**
 * Envía un email con los resultados de validación
 * @param {Object} options - Opciones de envío
 * @param {string} options.to - Email destinatario
 * @param {string} options.subject - Asunto del email
 * @param {string} options.body - Cuerpo del email
 * @param {string} options.attachment - Archivo adjunto (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendEmail = async ({ to, subject, body, attachment = null }) => {
  // TODO: Implementar integración con servicio de email
  // Por ahora solo loguea la acción
  console.log('Email would be sent:', {
    to,
    subject,
    bodyLength: body?.length || 0,
    hasAttachment: !!attachment
  })

  return {
    success: true,
    message: 'Email enviado (simulado)'
  }
}

/**
 * Envía un reporte de validación por email
 * @param {Object} options - Opciones
 * @param {string} options.to - Email destinatario
 * @param {string} options.jobId - ID del job
 * @param {Object} options.summary - Resumen de la validación
 * @param {string} options.csvContent - Contenido CSV del reporte
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendValidationReport = async ({ to, jobId, summary, csvContent }) => {
  const subject = `Reporte de Validación - Job ${jobId}`
  const body = `
    <h2>Reporte de Validación</h2>
    <p><strong>Job ID:</strong> ${jobId}</p>
    <p><strong>Total procesados:</strong> ${summary.total || 0}</p>
    <p><strong>Pasados:</strong> ${summary.passed || 0}</p>
    <p><strong>Fallidos:</strong> ${summary.failed || 0}</p>
    <p><strong>Con errores:</strong> ${summary.errors || 0}</p>
  `

  return await sendEmail({
    to,
    subject,
    body,
    attachment: csvContent ? {
      filename: `validation-report-${jobId}.csv`,
      content: csvContent
    } : null
  })
}

export default {
  sendEmail,
  sendValidationReport
}

