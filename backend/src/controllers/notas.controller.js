import { Nota } from "../models/notas.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import PlatoMenu from "../models/platosMenu.model.js";
import Sede from "../models/sede.model.js";
import Usuario from "../models/usuario.model.js";
import { ROLES } from "../lib/utils.js";

class NotasController {
  // Crear nota
  static async crearNota(req, reply) {
    try {
      const usuario = req.user; // { id, rol, sede }
      let { productoId, descripcion, sede } = req.body;

      if (!usuario || ![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol)) {
        return reply.code(403).send({ error: "No tienes permisos para crear notas" });
      }

      if (!productoId || !descripcion) {
        return reply.code(400).send({ error: "productoId y descripcion son requeridos" });
      }

      // Validar sede: coordinador solo puede usar su propia sede
      if (usuario.rol === ROLES.COORD) sede = usuario.sede;

      // Validar que la sede exista si es admin
      const sedeDoc = await Sede.findById(sede);
      if (!sedeDoc) return reply.code(400).send({ error: "Sede no encontrada" });

      // Verificar que el producto exista en PlatoCarta o PlatoMenu
      const existeEnCarta = await PlatoCarta.findById(productoId);
      const existeEnMenu = await PlatoMenu.findById(productoId);

      if (!existeEnCarta && !existeEnMenu) {
        return reply.code(400).send({ error: "El productoId no existe en PlatoCarta ni en PlatoMenu" });
      }

      // Crear la nota
      const nuevaNota = await Nota.create({
        usuarioId: usuario.id,
        productoId,
        descripcion,
        sede
      });

      return reply.code(201).send(nuevaNota);

    } catch (error) {
      console.error("Error al crear nota:", error);
      reply.code(500).send({ error: "Error al crear nota" });
    }
  }

  // Listar notas
  static async listarNotas(req, reply) {
    try {
      const usuario = req.user;
      const { sede, fechaInicio, fechaFin } = req.query;
      const filtros = {};

      if (!usuario || ![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol)) {
        return reply.code(403).send({ error: "No tienes permisos para ver notas" });
      }

      // Filtro por rol
      if (usuario.rol === ROLES.COORD) filtros.sede = usuario.sede;
      else if (usuario.rol === ROLES.ADMIN && sede) filtros.sede = sede;

      // Filtro por rango de fechas
      if (fechaInicio || fechaFin) {
        filtros.creadoEn = {};
        if (fechaInicio) filtros.creadoEn.$gte = new Date(fechaInicio);
        if (fechaFin) filtros.creadoEn.$lte = new Date(fechaFin);
      }

      // Buscar notas y popular usuarioId y sede
      const notas = await Nota.find(filtros)
        .populate('usuarioId', 'dni rol tipo')
        .populate('sede', 'nombre direccion')
        .sort({ creadoEn: -1 })
        .lean();

      reply.send(notas);
    } catch (error) {
      console.error("Error al listar notas:", error);
      reply.code(500).send({ error: "Error al listar notas" });
    }
  }

  // Eliminar nota
  static async eliminarNota(req, reply) {
    try {
      const usuario = req.user;
      const { id } = req.params;

      if (!usuario || ![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol)) {
        return reply.code(403).send({ error: "No tienes permisos para eliminar notas" });
      }

      const nota = await Nota.findById(id);
      if (!nota) return reply.code(404).send({ error: "Nota no encontrada" });

      if (usuario.rol === ROLES.COORD && nota.sede.toString() !== usuario.sede.toString()) {
        return reply.code(403).send({ error: "Solo puedes eliminar notas de tu sede" });
      }

      await Nota.findByIdAndDelete(id);
      reply.send({ message: "Nota eliminada correctamente" });

    } catch (error) {
      console.error("Error al eliminar nota:", error);
      reply.code(500).send({ error: "Error al eliminar nota" });
    }
  }
}

export default NotasController;
