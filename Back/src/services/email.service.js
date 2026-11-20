import nodemailer from "nodemailer";

// Correos con el estilo de Descubre Córdoba. SMTP sigue configurándose en el .env existente.
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const base = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const enlaceCompra = (id) =>
  `${base()}/perfil?seccion=reservas&compra=${encodeURIComponent(id)}`;
const enlaceDetalle = (id) =>
  `${base()}/perfil?seccion=reservas&detalle=${encodeURIComponent(id)}`;
const dinero = (value) => Number(value || 0).toLocaleString("es-AR");
const smtpListo = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM,
  );
const transporte = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
function correo({
  saludo,
  titulo,
  estado,
  contenido,
  url,
  boton = "Ver mi reserva y responder",
}) {
  const accion = url
    ? `<a href="${esc(url)}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700">${esc(boton)}</a>`
    : "";
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f1f5f9;padding:24px 10px;font-family:Arial,sans-serif;color:#17243b">
 <div style="max-width:580px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
 <div style="padding:25px;background:#17243b;text-align:center;color:#fff"><h1 style="margin:0;font-size:25px">Descubre Córdoba</h1><p style="margin:8px 0 0;color:#fed7aa">Tu próxima aventura comienza acá</p></div>
 <div style="padding:25px"><h2 style="margin:0 0 12px;font-size:22px">${esc(titulo)}</h2>
 <p>¡Hola, ${esc(saludo || "viajero")}!</p>${estado ? `<p style="display:inline-block;padding:7px 12px;background:#fff7ed;border-radius:20px;color:#9a3412;font-weight:bold">${esc(estado)}</p>` : ""}
 ${contenido}<p style="margin:25px 0;text-align:center">${accion}</p><p style="color:#64748b;font-size:13px">Para consultar tus mensajes y reservas, ingresá con tu cuenta. Si el enlace no funciona, entrá a Descubre Córdoba desde tu navegador.</p></div>
 <div style="padding:16px;background:#f8fafc;text-align:center;color:#64748b;font-size:12px">Descubre Córdoba · Información sobre tus excursiones</div></div></body></html>`;
}
function resumen(detalles, compra) {
  const filas = (detalles || [])
    .map(
      (d) =>
        `<div style="margin:12px 0"><strong>${esc(d.nombre || "Excursión")}</strong><br><span style="color:#475569">Salida: ${esc(String(d.fecha || "").slice(0, 10))} · ${esc(d.cantidad)} persona(s)</span></div>`,
    )
    .join("");
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px">${filas}<div style="border-top:1px solid #cbd5e1;padding-top:12px"><strong>Total: $${dinero(compra.total)}</strong></div></div>`;
}
export async function enviarConfirmacionReserva({
  destinatario,
  nombre,
  compra,
  detalles,
  empresa,
}) {
  if (!destinatario || !smtpListo()) return false;
  const vencimiento = compra.venceEn
    ? new Date(compra.venceEn).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      })
    : null;
  const contenido = `<p>Recibimos tu solicitud de reserva. Te compartimos los datos:</p>${resumen(detalles, compra)}
 <p><strong>El pago todavía está pendiente.</strong> ${vencimiento ? `Plazo indicado: ${esc(vencimiento)}.` : "Consultá el plazo de pago con la agencia."}</p>
 <p>Para coordinarlo, comunicate con la agencia${empresa?.whatsapp ? ` al ${esc(empresa.whatsapp)}` : ""}${empresa?.email ? ` o a ${esc(empresa.email)}` : ""}. Este mensaje no confirma que el pago se haya realizado.</p>`;
  await transporte().sendMail({
    from: process.env.SMTP_FROM,
    to: destinatario,
    subject: "Descubre Córdoba | Recibimos tu reserva",
    html: correo({
      saludo: nombre,
      titulo: "¡Recibimos tu reserva!",
      estado: "Pendiente de pago",
      contenido,
      url: enlaceCompra(compra.id),
    }),
  });
  return true;
}
export async function enviarReservaConfirmada({
  destinatario,
  nombre,
  compra,
  detalles,
}) {
  if (!destinatario || !smtpListo()) return false;
  const contenido = `<p>Tu pago fue verificado y tu reserva está confirmada.</p>${resumen(detalles, compra)}<p>Podés ver los detalles de tu viaje y escribirle a la agencia desde tu cuenta.</p>`;
  await transporte().sendMail({
    from: process.env.SMTP_FROM,
    to: destinatario,
    subject: "Descubre Córdoba | ¡Tu reserva está confirmada!",
    html: correo({
      saludo: nombre,
      titulo: "¡Tu reserva está confirmada!",
      estado: "Confirmada",
      contenido,
      url: enlaceCompra(compra.id),
    }),
  });
  return true;
}
export async function enviarAvisoMensaje({ destinatario, idDetalle }) {
  if (!destinatario || !smtpListo()) return false;
  try {
    await transporte().sendMail({
      from: process.env.SMTP_FROM,
      to: destinatario,
      subject: "Descubre Córdoba | Tenés una novedad en tu reserva",
      html: correo({
        titulo: "Tenés una novedad en tu reserva",
        contenido:
          "<p>La agencia dejó una actualización o mensaje en tu reserva. Ingresá para leerlo y responder.</p>",
        url: enlaceDetalle(idDetalle),
      }),
    });
    return true;
  } catch (e) {
    console.error("Falló aviso de mensaje:", e.message);
    return false;
  }
}
export const enviarCambioEstado = async ({ destinatario, idDetalle }) =>
  enviarAvisoMensaje({ destinatario, idDetalle });



