// Un solo jobs-worker maneja TODO el procesamiento en background
// (email + PDF + notificaciones), según lo definido. Si algún día
// el volumen de un tipo de evento justifica separarlo en su propio
// Worker, se mueve su `case` a un nuevo consumer sin tocar api-worker
// (el productor no sabe ni le importa cuántos consumers hay).
//
// El contrato de eventos se IMPORTA de @repo/shared/queue-events —
// única fuente de verdad compartida con el producer (api-worker).
// Si agregas un evento allí, el `switch` de dispatch() deja de ser
// exhaustivo y el typecheck te avisa acá.
import type { QueueEvent } from "@repo/shared/queue-events"

type Env = {
  FILES_BUCKET: R2Bucket
  RESEND_API_KEY: string
}

export default {
  async queue(batch: MessageBatch<QueueEvent>, env: Env) {
    for (const message of batch.messages) {
      try {
        await dispatch(message.body, env)
        message.ack()
      } catch (err) {
        console.error(`Fallo procesando ${message.body.type}:`, err)
        // No se llama ack() → Cloudflare reintenta automáticamente
        // (hasta max_retries, luego cae a la dead_letter_queue)
        message.retry()
      }
    }
  },
}

async function dispatch(event: QueueEvent, env: Env) {
  switch (event.type) {
    case "user.welcome_email":
      return sendWelcomeEmail(event, env)
    case "user.password_reset":
      return sendPasswordResetEmail(event, env)
    case "organization.created":
      return notifyOrganizationCreated(event, env)
  }
}

async function sendWelcomeEmail(
  event: Extract<QueueEvent, { type: "user.welcome_email" }>,
  env: Env
) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: event.email,
      subject: "¡Bienvenido!",
      html: `<p>Hola ${event.name ?? ""}, tu cuenta fue creada.</p>`,
    }),
  })
}

async function sendPasswordResetEmail(
  event: Extract<QueueEvent, { type: "user.password_reset" }>,
  env: Env
) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: event.email,
      subject: "Restablece tu contraseña",
      html: `<p>Hola ${event.name ?? ""}, sigue este enlace para restablecer tu contraseña: <a href="${event.url}">${event.url}</a></p>`,
    }),
  })
}

async function notifyOrganizationCreated(
  event: Extract<QueueEvent, { type: "organization.created" }>,
  env: Env
) {
  // Ejemplo: generar un PDF de bienvenida y subirlo a R2.
  // const pdfBytes = await generarPDF(event.organizationName)
  // await env.FILES_BUCKET.put(`org-${event.organizationId}/welcome.pdf`, pdfBytes)
  console.log(`Organización creada: ${event.organizationName}`)
}
