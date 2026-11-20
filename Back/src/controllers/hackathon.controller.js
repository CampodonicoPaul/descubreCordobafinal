// Hackathon Grupo 9 — operaciones por DetalleCompra, no por compra completa.
import sequelize from "../config/database.js";
import {
  DetalleCompra,
  Compra,
  FechaExcursion,
  Mensaje,
  SolicitudCancelacion,
  Excursion,
  Usuario,
} from "../models/index.js";
import {
  enviarAvisoMensaje,
  enviarCambioEstado,
} from "../services/email.service.js";
const activo = (d) =>
  ["PENDIENTE", "CONFIRMADA", "REPROGRAMADA"].includes(
    d.estado || d.compra?.estado,
  );
const error = (msg, status = 400) => Object.assign(new Error(msg), { status });
async function correoDetalle(detalle, texto) {
  try {
    const compra = await Compra.findByPk(detalle.idCompra);
    const cliente = compra && (await Usuario.findByPk(compra.idUsuario));
    if (cliente?.email)
      await enviarAvisoMensaje({
        destinatario: cliente.email,
        texto,
        idDetalle: detalle.id,
      });
  } catch (e) {
    console.error("Email no enviado:", e.message);
  }
}
// CLIENTE — solicita, pero NO cambia el estado de la reserva.
export async function solicitar(req, res) {
  try {
    const detalle = await DetalleCompra.findByPk(req.params.idDetalle, {
      include: [{ model: Compra, as: "compra" }],
    });
    if (
      !detalle ||
      Number(detalle.compra?.idUsuario) !== Number(req.usuario.id)
    )
      throw error("Reserva no encontrada", 404);
    if (!activo(detalle)) throw error("La reserva no está vigente");
    const motivo = String(req.body.motivo || "").trim();
    if (motivo.length < 10 || motivo.length > 2000)
      throw error("Indicá un motivo entre 10 y 2000 caracteres");
    const abierta = await SolicitudCancelacion.findOne({
      where: { idDetalleCompra: detalle.id, estado: "EN_EVALUACION" },
    });
    if (abierta) throw error("Ya tenés una solicitud en evaluación", 409);
    const solicitud = await SolicitudCancelacion.create({
      idDetalleCompra: detalle.id,
      motivo,
    });
    await Mensaje.create({
      idDetalleCompra: detalle.id,
      emisorTipo: "CLIENTE",
      emisorId: req.usuario.id,
      contenido: `Solicitud de cancelación: ${motivo}`,
    });
    res.status(201).json({ estado: true, data: solicitud });
  } catch (e) {
    res.status(e.status || 500).json({ estado: false, mensaje: e.message });
  }
}
export async function misSolicitudes(req, res) {
  try {
    const datos = await SolicitudCancelacion.findAll({
      include: [
        {
          model: DetalleCompra,
          as: "detalle",
          required: true,
          include: [
            {
              model: Compra,
              as: "compra",
              where: { idUsuario: req.usuario.id },
              required: true,
            },
          ],
        },
      ],
      order: [["fechaSolicitud", "DESC"]],
    });
    res.json({ estado: true, data: datos });
  } catch (e) {
    res.status(500).json({ estado: false, mensaje: e.message });
  }
}
export async function listarSolicitudes(req, res) {
  try {
    res.json({
      estado: true,
      data: await SolicitudCancelacion.findAll({
        order: [["fechaSolicitud", "DESC"]],
        limit: 200,
      }),
    });
  } catch (e) {
    res.status(500).json({ estado: false, mensaje: e.message });
  }
}
// ADMIN — acepta/rechaza/reprograma. Cambios de cupos dentro de una transacción.
export async function resolver(req, res) {
  const t = await sequelize.transaction();
  let detalle;
  try {
    const s = await SolicitudCancelacion.findByPk(req.params.id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!s || s.estado !== "EN_EVALUACION")
      throw error("Solicitud inexistente o ya resuelta", 409);
    const decision = String(req.body.decision || "").toUpperCase();
    if (!["ACEPTADA", "RECHAZADA", "REPROGRAMADA"].includes(decision))
      throw error("Resolución inválida");
    const resolucion = String(req.body.resolucion || "").trim();
    if (resolucion.length < 5) throw error("Escribí la resolución");
    detalle = await DetalleCompra.findByPk(s.idDetalleCompra, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!detalle) throw error("Reserva inexistente", 404);
    const compra = await Compra.findByPk(detalle.idCompra, { transaction: t });
    if (!activo({ ...detalle.dataValues, compra }))
      throw error("Reserva no vigente", 409);
    if (decision === "ACEPTADA") {
      if (detalle.idFechaExcursion) {
        const salida = await FechaExcursion.findByPk(detalle.idFechaExcursion, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (salida)
          await salida.update(
            {
              cupos: Math.min(
                Number(salida.cupoMaximo ?? Infinity),
                Number(salida.cupos) + Number(detalle.cantidad),
              ),
            },
            { transaction: t },
          );
      } else {
        const e = await Excursion.findByPk(detalle.idExcursion, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (e)
          await e.increment("cupos", {
            by: Number(detalle.cantidad),
            transaction: t,
          });
      }
      await detalle.update({ estado: "CANCELADA" }, { transaction: t });
    }
    if (decision === "REPROGRAMADA") {
      const nueva = await FechaExcursion.findByPk(
        Number(req.body.idNuevaFecha),
        { transaction: t, lock: t.LOCK.UPDATE },
      );
      if (
        !nueva ||
        Number(nueva.idExcursion) !== Number(detalle.idExcursion) ||
        nueva.estadoSalida === "CANCELADA" ||
        Number(nueva.cupos) < Number(detalle.cantidad)
      )
        throw error("Nueva fecha no disponible");
      if (detalle.idFechaExcursion) {
        const anterior = await FechaExcursion.findByPk(
          detalle.idFechaExcursion,
          { transaction: t, lock: t.LOCK.UPDATE },
        );
        if (anterior)
          await anterior.increment("cupos", {
            by: Number(detalle.cantidad),
            transaction: t,
          });
      }
      await nueva.decrement("cupos", {
        by: Number(detalle.cantidad),
        transaction: t,
      });
      await detalle.update(
        { idFechaExcursion: nueva.id, estado: "REPROGRAMADA" },
        { transaction: t },
      );
    }
    await s.update(
      {
        estado: decision,
        resolucion,
        fechaResolucion: new Date(),
        idAdminResolutor: req.usuarioAdmin.id,
      },
      { transaction: t },
    );
    await Mensaje.create(
      {
        idDetalleCompra: detalle.id,
        emisorTipo: "ADMIN",
        emisorId: req.usuarioAdmin.id,
        contenido: `Resolución de solicitud: ${decision}. ${resolucion}`,
      },
      { transaction: t },
    );
    await t.commit();
    await correoDetalle(detalle, resolucion);
    res.json({ estado: true, data: s });
  } catch (e) {
    if (!t.finished) await t.rollback();
    res.status(e.status || 500).json({ estado: false, mensaje: e.message });
  }
}
// ADMIN — suspende una sola salida y envía un mensaje por reserva afectada.
export async function cancelarSalida(req, res) {
  const t = await sequelize.transaction();
  let ids = [];
  try {
    const motivo = String(req.body.motivo || "").trim();
    if (motivo.length < 10) throw error("Indicá el motivo de suspensión");
    const salida = await FechaExcursion.findByPk(req.params.fechaId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!salida || salida.estadoSalida === "CANCELADA")
      throw error("Salida inexistente o ya cancelada", 409);
    const detalles = await DetalleCompra.findAll({
      where: { idFechaExcursion: salida.id },
      include: [{ model: Compra, as: "compra" }],
      transaction: t,
    });
    const vigentes = detalles.filter(activo);
    await salida.update(
      { estadoSalida: "CANCELADA", motivoSuspension: motivo },
      { transaction: t },
    );
    for (const d of vigentes) {
      await Mensaje.create(
        {
          idDetalleCompra: d.id,
          emisorTipo: "ADMIN",
          emisorId: req.usuarioAdmin.id,
          contenido: `La salida del ${salida.fecha} fue suspendida. Motivo: ${motivo}. Comunicate por este chat para coordinar reintegro o reprogramación.`,
        },
        { transaction: t },
      );
      ids.push(d.id);
    }
    await t.commit();
    for (const d of vigentes) await correoDetalle(d, motivo);
    res.json({
      estado: true,
      data: { reservasAvisadas: ids.length, idsDetalle: ids },
    });
  } catch (e) {
    if (!t.finished) await t.rollback();
    res.status(e.status || 500).json({ estado: false, mensaje: e.message });
  }
}
