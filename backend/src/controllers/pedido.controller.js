import mongoose from "mongoose";
import Pedido from "../models/pedido.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import Menu from "../models/menu.model.js";
import Sede from "../models/sede.model.js";
import EstadoPedido from "../models/estadoPedido.model.js";
import MetodoPago from "../models/metodoPago.model.js";
import Usuario from "../models/usuario.model.js";
import Dni from "../models/dni.model.js";
import { ROLES } from "../lib/utils.js";

const { Types } = mongoose;

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toObjectIdString(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return Types.ObjectId.isValid(trimmed) ? trimmed : trimmed || null;
  }
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }
  if (typeof value === "object" && "_id" in value) {
    return toObjectIdString(value._id);
  }
  if (typeof value === "object" && typeof value.toString === "function") {
    const result = value.toString();
    return result ? result : null;
  }
  return null;
}

function extractUserInfo(usuario) {
  if (!usuario) {
    return { id: null, nombre: null, codigo: null, documento: null, correo: null };
  }

  if (typeof usuario === "string") {
    const id = Types.ObjectId.isValid(usuario) ? usuario : null;
    return { id, nombre: null, codigo: null, documento: null, correo: null };
  }

  const id = toObjectIdString(usuario._id) ?? null;
  const codigo = usuario.codigoUsu ?? null;
  const correo = usuario.correo ?? usuario.email ?? null;

  let documento = null;
  let nombre = codigo ?? id;
  const dni = usuario.dni;
  if (dni && typeof dni === "object") {
    documento = dni.numero ?? null;
    const partes = [dni.nombres, dni.apellidos].filter(Boolean);
    const fullName = partes.join(" ").trim();
    if (fullName) {
      nombre = fullName;
    } else if (documento) {
      nombre = documento;
    }
  }

  if (!nombre && documento) {
    nombre = documento;
  }

  return { id, nombre, codigo, documento, correo };
}

function extractSedeInfo(sede) {
  if (!sede) {
    return { value: null, nombre: null };
  }

  if (typeof sede === "string") {
    const trimmed = sede.trim();
    if (!trimmed) {
      return { value: null, nombre: null };
    }
    return {
      value: trimmed,
      nombre: Types.ObjectId.isValid(trimmed) ? null : trimmed,
    };
  }

  return {
    value: {
      _id: toObjectIdString(sede._id),
      nombre: sede.nombre ?? null,
      direccion: sede.direccion ?? null,
    },
    nombre: sede.nombre ?? toObjectIdString(sede._id),
  };
}

function extractEstadoInfo(estado) {
  if (!estado) {
    return { id: null, nombre: null, slug: null };
  }

  if (typeof estado === "string") {
    const nombre = estado.trim();
    const slug = nombre.toLowerCase();
    return { id: null, nombre, slug };
  }

  const nombre = estado.nombre?.trim() ?? null;
  const id = toObjectIdString(estado._id) ?? null;
  const slug = nombre ? nombre.toLowerCase() : null;
  return { id, nombre, slug };
}

function extractMetodoInfo(metodo) {
  if (!metodo) {
    return { value: null, id: null, nombre: null };
  }

  if (typeof metodo === "string") {
    const trimmed = metodo.trim();
    const nombre = trimmed || null;
    return {
      value: trimmed || null,
      id: Types.ObjectId.isValid(trimmed) ? trimmed : null,
      nombre,
    };
  }

  const id = toObjectIdString(metodo._id) ?? null;
  const nombre = metodo.nombre ?? null;
  return {
    value: { _id: id, nombre },
    id,
    nombre,
  };
}

async function attachItemMetadata(pedidos) {
  if (!Array.isArray(pedidos) || pedidos.length === 0) return;

  const cartaIds = new Set();
  const menuIds = new Set();

  for (const pedido of pedidos) {
    if (!Array.isArray(pedido.items)) continue;
    for (const item of pedido.items) {
      const normalizedId = Types.ObjectId.isValid(item?.refId)
        ? toObjectIdString(item.refId)
        : null;
      if (normalizedId) {
        item.refId = normalizedId;
        if (item.tipo === "carta") cartaIds.add(normalizedId);
        else if (item.tipo === "menu") menuIds.add(normalizedId);
      } else if (item?.refId) {
        item.refId = String(item.refId);
      }
    }
  }

  const [platosCarta, menus] = await Promise.all([
    cartaIds.size
      ? PlatoCarta.find({ _id: { $in: [...cartaIds] } })
          .select("nombre imagenUrl categoria")
          .lean()
      : [],
    menuIds.size
      ? Menu.find({ _id: { $in: [...menuIds] } })
          .populate({ path: "normal.segundo", select: "nombre imagenUrl" })
          .select("normal")
          .lean()
      : [],
  ]);

  const cartaMap = new Map();
  for (const plato of platosCarta) {
    const key = toObjectIdString(plato._id);
    if (key) cartaMap.set(key, plato);
  }

  const menuMap = new Map();
  for (const menu of menus) {
    const key = toObjectIdString(menu._id);
    if (key) menuMap.set(key, menu);
  }

  for (const pedido of pedidos) {
    if (!Array.isArray(pedido.items)) continue;
    for (const item of pedido.items) {
      const refId = toObjectIdString(item.refId) ?? (item.refId ? String(item.refId) : null);
      if (!refId) {
        item.nombre = item.nombre ?? (item.tipo === "menu" ? "Menú del día" : "Plato de carta");
        item.imagenUrl = item.imagenUrl ?? null;
        continue;
      }

      if (item.tipo === "carta") {
        const plato = cartaMap.get(refId);
        if (plato) {
          item.nombre = plato.nombre ?? item.nombre ?? "Plato de carta";
          item.imagenUrl = plato.imagenUrl ?? item.imagenUrl ?? null;
          item.categoria = plato.categoria ?? item.categoria ?? null;
        } else {
          item.nombre = item.nombre ?? "Plato de carta";
          item.imagenUrl = item.imagenUrl ?? null;
        }
      } else if (item.tipo === "menu") {
        const menu = menuMap.get(refId);
        const segundo =
          menu?.normal?.segundo && typeof menu.normal.segundo === "object"
            ? menu.normal.segundo
            : null;
        if (segundo) {
          item.nombre = segundo.nombre ?? item.nombre ?? "Menú del día";
          item.imagenUrl = segundo.imagenUrl ?? item.imagenUrl ?? null;
        } else {
          item.nombre = item.nombre ?? "Menú del día";
          item.imagenUrl = item.imagenUrl ?? null;
        }
      }

      item.refId = refId;
    }
  }
}

function buildPedidoResponse(pedido) {
  const usuarioInfo = extractUserInfo(pedido.usuarioId);
  const sedeInfo = extractSedeInfo(pedido.sede);
  const estadoInfo = extractEstadoInfo(pedido.estado);
  const metodoInfo = extractMetodoInfo(pedido.metodoPago);

  const items = Array.isArray(pedido.items)
    ? pedido.items.map((item) => ({
        refId: toObjectIdString(item.refId) ?? (item.refId ? String(item.refId) : ""),
        tipo: item.tipo,
        cantidad: Number(item.cantidad ?? 0),
        precioUnitario: Number(item.precioUnitario ?? 0),
        nombre: item.nombre ?? null,
        imagenUrl: item.imagenUrl ?? null,
        categoria: item.categoria ?? null,
      }))
    : [];

  return {
    _id: toObjectIdString(pedido._id) ?? String(pedido._id ?? ""),
    usuarioId: usuarioInfo.id,
    usuarioNombre: usuarioInfo.nombre,
    usuarioCodigo: usuarioInfo.codigo,
    usuarioDocumento: usuarioInfo.documento,
    usuarioCorreo: usuarioInfo.correo ?? usuarioInfo.documento ?? null,
    sede: sedeInfo.value,
    sedeNombre: sedeInfo.nombre,
    items,
    total: Number(pedido.total ?? 0),
    estado: estadoInfo.slug ?? estadoInfo.nombre ?? null,
    estadoNombre: estadoInfo.nombre,
    estadoId: estadoInfo.id,
    metodoPago: metodoInfo.value,
    metodoPagoNombre: metodoInfo.nombre,
    metodoPagoId: metodoInfo.id,
    creadoEn: pedido.creadoEn ?? pedido.createdAt ?? null,
    actualizadoEn: pedido.actualizadoEn ?? pedido.updatedAt ?? null,
  };
}

function basePedidoQuery(query) {
  return query
    .populate({
      path: "usuarioId",
      select: "codigoUsu tipo sede",
      populate: { path: "dni", select: "nombres apellidos numero" },
    })
    .populate("sede", "nombre direccion")
    .populate("estado", "nombre")
    .populate("metodoPago", "nombre");
}

async function fetchPedidoResponseById(id) {
  if (!Types.ObjectId.isValid(id)) return null;
  const pedido = await basePedidoQuery(Pedido.findById(id)).lean({ virtuals: true });
  if (!pedido) return null;
  await attachItemMetadata([pedido]);
  return buildPedidoResponse(pedido);
}

async function normalizeSedeFilter(value) {
  if (!value) return null;

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "object" && "_id" in value) {
    return normalizeSedeFilter(value._id);
  }

  const strValue = String(value).trim();
  if (!strValue) return null;

  if (Types.ObjectId.isValid(strValue)) {
    return strValue;
  }

  const sedeDoc = await Sede.findOne({
    nombre: { $regex: `^${escapeRegex(strValue)}$`, $options: "i" },
  })
    .select("_id")
    .lean();

  return sedeDoc ? sedeDoc._id.toString() : null;
}

async function sanitizePedidosSede() {
  const pedidosInconsistentes = await Pedido.find({ sede: { $type: "string" } })
    .select("_id sede")
    .lean();

  if (!pedidosInconsistentes.length) return;

  const updates = [];
  for (const pedido of pedidosInconsistentes) {
    const sedeNormalizada = await normalizeSedeFilter(pedido.sede);
    if (sedeNormalizada) {
      updates.push(
        Pedido.updateOne({ _id: pedido._id }, { $set: { sede: sedeNormalizada } })
      );
    } else {
      updates.push(
        Pedido.updateOne({ _id: pedido._id }, { $set: { sede: null } })
      );
    }
  }

  if (updates.length) {
    await Promise.allSettled(updates);
  }
}

async function sanitizeUsuariosSede() {
  const usuariosInconsistentes = await Usuario.find({ sede: { $type: "string" } })
    .select("_id sede")
    .lean();

  if (!usuariosInconsistentes.length) return;

  const updates = [];
  for (const usuario of usuariosInconsistentes) {
    const sedeNormalizada = await normalizeSedeFilter(usuario.sede);
    if (sedeNormalizada) {
      updates.push(
        Usuario.updateOne({ _id: usuario._id }, { $set: { sede: sedeNormalizada } })
      );
    } else {
      updates.push(
        Usuario.updateOne({ _id: usuario._id }, { $set: { sede: null } })
      );
    }
  }

  if (updates.length) {
    await Promise.allSettled(updates);
  }
}

async function sanitizePedidosEstado() {
  const pedidosInconsistentes = await Pedido.find({ estado: { $type: "string" } })
    .select("_id estado")
    .lean();

  if (!pedidosInconsistentes.length) return;

  const updates = [];
  for (const pedido of pedidosInconsistentes) {
    const strEstado = String(pedido.estado).trim();
    let estadoNormalizado = null;
    if (Types.ObjectId.isValid(strEstado)) {
      estadoNormalizado = strEstado;
    } else if (strEstado) {
      const estadoDoc = await EstadoPedido.findOne({
        nombre: { $regex: `^${escapeRegex(strEstado)}$`, $options: "i" },
      })
        .select("_id")
        .lean();
      estadoNormalizado = estadoDoc ? estadoDoc._id.toString() : null;
    }

    updates.push(
      Pedido.updateOne(
        { _id: pedido._id },
        { $set: { estado: estadoNormalizado } }
      )
    );
  }

  if (updates.length) {
    await Promise.allSettled(updates);
  }
}

async function sanitizePedidosMetodoPago() {
  const pedidosInconsistentes = await Pedido.find({ metodoPago: { $type: "string" } })
    .select("_id metodoPago")
    .lean();

  if (!pedidosInconsistentes.length) return;

  const updates = [];
  for (const pedido of pedidosInconsistentes) {
    const rawMetodo = String(pedido.metodoPago).trim();
    let metodoNormalizado = null;

    if (Types.ObjectId.isValid(rawMetodo)) {
      metodoNormalizado = rawMetodo;
    } else if (rawMetodo) {
      const metodoDoc = await MetodoPago.findOne({
        nombre: { $regex: `^${escapeRegex(rawMetodo)}$`, $options: "i" },
      })
        .select("_id")
        .lean();

      metodoNormalizado = metodoDoc ? metodoDoc._id.toString() : null;
    }

    updates.push(
      Pedido.updateOne(
        { _id: pedido._id },
        { $set: { metodoPago: metodoNormalizado } }
      )
    );
  }

  if (updates.length) {
    await Promise.allSettled(updates);
  }
}

async function sanitizeUsuariosDni() {
  const usuariosInconsistentes = await Usuario.find({
    $expr: { $ne: [{ $type: "$dni" }, "objectId"] },
  })
    .select("_id dni")
    .lean();

  if (!usuariosInconsistentes.length) return;

  const updates = [];
  for (const usuario of usuariosInconsistentes) {
    const rawDni = usuario.dni == null ? null : String(usuario.dni).trim();
    let dniNormalizado = null;

    if (rawDni && Types.ObjectId.isValid(rawDni)) {
      dniNormalizado = rawDni;
    } else if (rawDni) {
      const dniDoc = await Dni.findOne({
        numero: { $regex: `^${escapeRegex(rawDni)}$`, $options: "i" },
      })
        .select("_id")
        .lean();

      dniNormalizado = dniDoc ? dniDoc._id.toString() : null;
    }

    updates.push(
      Usuario.updateOne(
        { _id: usuario._id },
        { $set: { dni: dniNormalizado } }
      )
    );
  }

  if (updates.length) {
    await Promise.allSettled(updates);
  }
}

class PedidoController {
  static async crearPedido(req, reply) {
    try {
      const usuario = req.user;
      if (!usuario || usuario.rol !== ROLES.USER)
        return reply.code(403).send({ error: "Solo los usuarios pueden crear pedidos" });

      const { sede, items, metodoPago, estado } = req.body;
      if (!sede || !items?.length)
        return reply.code(400).send({ error: "Datos de pedido incompletos" });

      const sedeDoc = await Sede.findById(sede);
      if (!sedeDoc) return reply.code(400).send({ error: "Sede no existe" });

      let estadoDoc = estado ? await EstadoPedido.findById(estado) : null;
      if (!estadoDoc) {
        estadoDoc =
          (await EstadoPedido.findOne({ nombre: /pendiente/i })) ||
          (await EstadoPedido.create({ nombre: "Pendiente" }));
      }

      let metodoPagoDoc = metodoPago ? await MetodoPago.findById(metodoPago) : null;
      if (!metodoPagoDoc) {
        metodoPagoDoc =
          (await MetodoPago.findOne({ nombre: /efectivo/i })) ||
          (await MetodoPago.create({ nombre: "Efectivo" }));
      }

      let total = 0;
      const itemsValidados = [];

      for (const item of items) {
        const { refId, tipo, cantidad, precioUnitario } = item;
        if (!refId || !tipo || !cantidad || !precioUnitario)
          return reply.code(400).send({ error: "Faltan campos en un item" });

        let producto;
        if (tipo === "carta") producto = await PlatoCarta.findById(refId);
        else if (tipo === "menu") producto = await Menu.findById(refId);
        else return reply.code(400).send({ error: "Tipo de producto inválido" });

        if (!producto || !producto.activo)
          return reply.code(404).send({ error: `Producto no disponible: ${refId}` });

        total += cantidad * precioUnitario;
        itemsValidados.push({ refId, tipo, cantidad, precioUnitario });
      }

      const nuevoPedido = await Pedido.create({
        usuarioId: usuario.id,
        sede: sedeDoc._id,
        estado: estadoDoc._id,
        metodoPago: metodoPagoDoc._id,
        items: itemsValidados,
        total,
      });

      const respuesta = await fetchPedidoResponseById(nuevoPedido._id);
      reply.code(201).send(respuesta ?? { _id: nuevoPedido._id });
    } catch (error) {
      console.error("Error al crear pedido:", error);
      reply.code(500).send({ error: "Error al crear pedido" });
    }
  }

  static async listarPedidos(req, reply) {
    try {
      const usuario = req.user;
      if (!usuario) {
        return reply.code(401).send({ error: "Autenticación requerida" });
      }

      const { sede, estado, fechaInicio, fechaFin } = req.query ?? {};
      const filtros = {};

      await sanitizeUsuariosDni();
      await sanitizeUsuariosSede();
      await sanitizePedidosSede();
      await sanitizePedidosEstado();
      await sanitizePedidosMetodoPago();

      if (usuario.rol === ROLES.USER) {
        filtros.usuarioId = usuario.id;
      } else if (usuario.rol === ROLES.COORD) {
        const candidatos = [];
        if (usuario.sede) candidatos.push(usuario.sede);
        const usuarioDoc = await Usuario.findById(usuario.id).select("sede").lean();
        if (usuarioDoc?.sede) candidatos.push(usuarioDoc.sede);

        let sedeFiltrada = null;
        for (const candidato of candidatos) {
          sedeFiltrada = await normalizeSedeFilter(candidato);
          if (sedeFiltrada) break;
        }

        if (!sedeFiltrada) {
          return reply.code(400).send({ error: "No se pudo determinar la sede asociada al coordinador" });
        }

        filtros.sede = sedeFiltrada;
      } else if (usuario.rol === ROLES.ADMIN && sede) {
        const sedeFiltrada = await normalizeSedeFilter(sede);
        if (!sedeFiltrada) {
          return reply.code(400).send({ error: "Sede no válida" });
        }
        filtros.sede = sedeFiltrada;
      }

      if (estado) {
        let estadoFiltrado = estado;
        if (!Types.ObjectId.isValid(estado)) {
          const estadoDoc = await EstadoPedido.findOne({
            nombre: { $regex: `^${escapeRegex(String(estado))}$`, $options: "i" },
          })
            .select("_id")
            .lean();
          estadoFiltrado = estadoDoc ? estadoDoc._id.toString() : null;
        }

        if (estadoFiltrado) filtros.estado = estadoFiltrado;
      }
      if (fechaInicio || fechaFin) {
        const inicio = fechaInicio ? new Date(fechaInicio) : null;
        const fin = fechaFin ? new Date(fechaFin) : null;
        const rango = {};
        if (inicio && !Number.isNaN(inicio.getTime())) rango.$gte = inicio;
        if (fin && !Number.isNaN(fin.getTime())) rango.$lte = fin;
        if (Object.keys(rango).length) filtros.creadoEn = rango;
      }

      const pedidos = await basePedidoQuery(Pedido.find(filtros))
        .sort({ creadoEn: -1 })
        .lean({ virtuals: true });

      await attachItemMetadata(pedidos);
      const respuesta = pedidos.map(buildPedidoResponse);

      reply.send(respuesta);
    } catch (error) {
      console.error("Error al listar pedidos:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      reply.code(500).send({
        error: "Error al listar pedidos",
        detail: error?.message ?? null,
      });
    }
  }

  static async actualizarEstado(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;
      const { estado } = req.body;

      if (!usuario || ![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol))
        return reply.code(403).send({ error: "No tienes permisos para actualizar pedidos" });

      const pedido = await Pedido.findById(id);
      if (!pedido) return reply.code(404).send({ error: "Pedido no encontrado" });

      if (usuario.rol === ROLES.COORD && pedido.sede.toString() !== String(usuario.sede))
        return reply.code(403).send({ error: "No puedes modificar pedidos de otra sede" });

      // Buscar el estado por su nombre. Si no existe, lo crea.
      let estadoDoc = await EstadoPedido.findOne({
        nombre: { $regex: `^${escapeRegex(String(estado))}$`, $options: "i" },
      });

      if (!estadoDoc) {
        // Capitaliza la primera letra para guardarlo de forma consistente
        const nombreEstado = estado.charAt(0).toUpperCase() + estado.slice(1);
        estadoDoc = await EstadoPedido.create({ nombre: nombreEstado });
      }
      if (!estadoDoc) return reply.code(400).send({ error: "Estado no válido" });

      pedido.estado = estadoDoc._id;
      await pedido.save();

      const respuesta = await fetchPedidoResponseById(pedido._id);
      reply.send(respuesta ?? { _id: pedido._id });
    } catch (error) {
      console.error("Error al actualizar estado del pedido:", error);
      reply.code(500).send({ error: "Error al actualizar pedido" });
    }
  }

  static async eliminarPedido(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;
      if (usuario.rol !== ROLES.ADMIN)
        return reply.code(403).send({ error: "Solo el admin puede eliminar pedidos" });

      const pedido = await Pedido.findByIdAndDelete(id);
      if (!pedido) return reply.code(404).send({ error: "Pedido no encontrado" });

      reply.send({ message: "Pedido eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      reply.code(500).send({ error: "Error al eliminar pedido" });
    }
  }
}

export default PedidoController;
