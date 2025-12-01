import PlatoCarta from "../models/platosCarta.model.js";
import Sede from "../models/sede.model.js";
import { ROLES } from "../lib/utils.js";

class PlatoCartaController {
  // Crear plato
  static async crearPlato(req, reply) {
    try {
      const usuario = req.user;
      const { sede: sedeId, nombre, descripcion, categoria, precio, imagenUrl } = req.body;

      if (!usuario) return reply.code(401).send({ error: "No autenticado" });
      if (![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol))
        return reply.code(403).send({ error: "No tienes permisos para crear platos" });

      // Validar sede
      let sedeDoc = null;
      if (usuario.rol === ROLES.COORD) {
        sedeDoc = await Sede.findById(usuario.sede);
        if (!sedeDoc) return reply.code(400).send({ error: "Sede del coordinador no encontrada" });
      } else if (sedeId) {
        sedeDoc = await Sede.findById(sedeId);
        if (!sedeDoc) return reply.code(400).send({ error: "Sede indicada no existe" });
      } else {
        return reply.code(400).send({ error: "Debe indicar una sede" });
      }

      const nuevoPlato = await PlatoCarta.create({
        nombre,
        descripcion,
        categoria,
        precio,
        imagenUrl,
        sede: sedeDoc._id,
      });

      return reply.code(201).send(nuevoPlato);
    } catch (error) {
      console.error("Error al crear plato carta:", error);
      reply.code(500).send({ error: "Error al crear plato", detalle: error.message });
    }
  }

  // Listar platos
  static async listarPlatos(req, reply) {
    try {
      const usuario = req.user;
      const { sede: querySede } = req.query || {};

      if (!usuario) return reply.code(401).send({ error: "No autenticado" });

      let filtros = { activo: true };

      if (usuario.rol === ROLES.ADMIN) {
        if (querySede) filtros.sede = querySede;
      } else if (usuario.rol === ROLES.COORD) {
        filtros.sede = usuario.sede;
      } else {
        if (!querySede) return reply.code(403).send({ error: "Debes indicar una sede" });
        filtros.sede = querySede;
      }

      const platos = await PlatoCarta.find(filtros).populate("sede");
      return reply.send(platos);
    } catch (error) {
      reply.code(500).send({ error: "Error al listar platos", detalle: error.message });
    }
  }

  // Actualizar plato
  static async actualizarPlato(req, reply) {
    try {
      const usuario = req.user;
      const { id: platoId } = req.params;

      if (![ROLES.ADMIN, ROLES.COORD].includes(usuario.rol))
        return reply.code(403).send({ error: "No autorizado" });

      const plato = await PlatoCarta.findById(platoId);
      if (!plato) return reply.code(404).send({ error: "Plato no encontrado" });

      if (usuario.rol === ROLES.COORD && plato.sede.toString() !== usuario.sede)
        return reply.code(403).send({ error: "No puedes modificar platos de otra sede" });

      Object.assign(plato, req.body);
      await plato.save();

      return reply.send(plato);
    } catch (error) {
      reply.code(500).send({ error: "Error al actualizar plato", detalle: error.message });
    }
  }

  // Eliminar plato
  static async eliminarPlato(req, reply) {
    try {
      const usuario = req.user;
      const { id: platoId } = req.params;

      const plato = await PlatoCarta.findById(platoId);
      if (!plato) return reply.code(404).send({ error: "Plato no encontrado" });

      if (usuario.rol === ROLES.ADMIN || (usuario.rol === ROLES.COORD && plato.sede.toString() === usuario.sede)) {
        await PlatoCarta.findByIdAndDelete(platoId);
        return reply.send({ message: "Plato eliminado" });
      }

      return reply.code(403).send({ error: "No tienes permisos para eliminar este plato" });
    } catch (error) {
      reply.code(500).send({ error: "Error al eliminar plato", detalle: error.message });
    }
  }
}

export default PlatoCartaController;
