import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Usuario from "../models/usuario.model.js";
import Dni from "../models/dni.model.js";
import Rol from "../models/rol.model.js";
import Sede from "../models/sede.model.js";
import Menu from "../models/menu.model.js";
import PlatoCarta from "../models/platosCarta.model.js";
import { ROLES } from "../lib/utils.js";

class UsuarioController {
  // Crear usuario
  static async crearUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const { dni, nombres, apellidos, password, tipo, codigoUsu, rol, sede } = req.body;

      if (!usuarioLogueado) return reply.code(401).send({ error: "No autenticado" });

      // Determinar rol a asignar
      let roleToAssign = rol ? await Rol.findById(rol) : await Rol.findOne({ nombre: ROLES.USER });
      if (!roleToAssign) return reply.code(400).send({ error: "Rol no encontrado" });

      // Validaciones de permisos
      const currentUser = await Usuario.findById(usuarioLogueado.id).populate("rol");
      console.log(currentUser);
      if (!["admin", "coordinador", "usuario"].includes(currentUser.rol.nombre)) {
        return reply.code(403).send({ error: "No tienes permisos para crear usuarios" });
      }
      if (["admin", "coordinador"].includes(roleToAssign.nombre) && currentUser.rol.nombre !== "admin") {
        return reply.code(403).send({ error: "Solo un admin puede crear admins o coordinadores" });
      }
      if (roleToAssign.nombre === "profesor" && !["admin", "coordinador"].includes(currentUser.rol.nombre)) {
        return reply.code(403).send({ error: "Solo admin o coordinador pueden crear profesores" });
      }

      // Validar DNI duplicado
      const existingDni = await Dni.findOne({ numero: dni });
      if (existingDni) return reply.code(400).send({ error: "DNI ya existe" });

      // Crear registro de DNI
      const dniDoc = await Dni.create({ numero: dni, nombres, apellidos });

      // Validar sede si es interno
      let sedeDoc = null;
      if (tipo === "interno" && sede) {
        sedeDoc = await Sede.findById(sede);
        if (!sedeDoc) return reply.code(400).send({ error: "Sede no existe" });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const nuevoUsuario = await Usuario.create({
        dni: dniDoc._id,
        password: hashedPassword,
        tipo,
        codigoUsu: tipo === "interno" ? codigoUsu : undefined,
        rol: roleToAssign._id,
        sede: sedeDoc?._id || null,
        activo: true,
      });

      return reply.code(201).send({
        id: nuevoUsuario._id,
        dni: dniDoc.numero,
        nombres: dniDoc.nombres,
        apellidos: dniDoc.apellidos,
        rol: roleToAssign.nombre,
        tipo: nuevoUsuario.tipo,
        sede: nuevoUsuario.sede,
        codigoUsu: nuevoUsuario.codigoUsu,
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return reply.code(500).send({ error: "Error al crear usuario", detalle: error.message });
    }
  }

  // Listar usuarios
  static async listarUsuarios(req, reply) {
    try {
      const usuarioLogueado = req.user;
      if (!usuarioLogueado) return reply.code(401).send({ error: "No autenticado" });

      const filtros = {};
      if (req.query.activo !== undefined) filtros.activo = req.query.activo === "true";

      const currentUser = await Usuario.findById(usuarioLogueado.id).populate("rol");

      if ([ROLES.ADMIN, ROLES.COORD].includes(currentUser.rol.nombre)) {
        if (currentUser.rol.nombre === ROLES.COORD && filtros.activo === undefined) filtros.activo = true;
        const usuarios = await Usuario.find(filtros).populate("dni").populate("rol").populate("sede");
        return reply.send(usuarios);
      }

      const yo = await Usuario.findById(usuarioLogueado.id).populate("dni").populate("rol").populate("sede");
      return reply.send([yo]);
    } catch (error) {
      return reply.code(500).send({ error: "Error al listar usuarios", detalle: error.message });
    }
  }

  // Activar / desactivar usuario
  static async activarDesactivarUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const { userId } = req.params;
      const { activo } = req.body;

      const target = await Usuario.findById(userId);
      if (!target) return reply.code(404).send({ error: "Usuario no encontrado" });

      const currentUser = await Usuario.findById(usuarioLogueado.id).populate("rol");

      if (currentUser.rol.nombre === ROLES.ADMIN || (currentUser.rol.nombre === ROLES.COORD && target.rol !== ROLES.ADMIN)) {
        target.activo = activo;
        await target.save();
        return reply.send(target);
      }

      return reply.code(403).send({ error: "No puedes modificar este usuario" });
    } catch (error) {
      return reply.code(500).send({ error: "Error al actualizar estado", detalle: error.message });
    }
  }

  // Eliminar usuario
  static async eliminarUsuario(req, reply) {
    try {
      const usuarioLogueado = req.user;
      const { userId } = req.params;

      if (!usuarioLogueado || usuarioLogueado.rol !== ROLES.ADMIN)
        return reply.code(403).send({ error: "Solo un admin puede eliminar usuarios" });

      await Usuario.findByIdAndDelete(userId);
      return reply.send({ message: "Usuario eliminado" });
    } catch (error) {
      return reply.code(500).send({ error: "Error al eliminar usuario", detalle: error.message });
    }
  }

  // Obtener favoritos
  static async obtenerFavoritos(req, reply) {
    try {
      const usuario = await Usuario.findById(req.user.id).lean();
      if (!usuario) return reply.code(404).send({ error: "Usuario no encontrado" });

      const favoritos = Array.isArray(usuario.favoritos) ? usuario.favoritos : [];
      if (!favoritos.length) return reply.send([]);

      const menuIds = favoritos.filter(f => f.tipo === "menu").map(f => f.refId);
      const cartaIds = favoritos.filter(f => f.tipo === "carta").map(f => f.refId);

      const [menus, platosCarta] = await Promise.all([
        menuIds.length
          ? Menu.find({ _id: { $in: menuIds } })
              .populate("sede")
              .populate("normal.entrada")
              .populate("normal.segundo")
              .lean()
          : [],
        cartaIds.length ? PlatoCarta.find({ _id: { $in: cartaIds } }).lean() : [],
      ]);

      const menuMap = new Map(menus.map(m => [m._id.toString(), m]));
      const cartaMap = new Map(platosCarta.map(p => [p._id.toString(), p]));

      const favoritosDetallados = favoritos
        .map(fav => {
          if (!fav || !fav.refId) return null;
          const key = fav.refId.toString();
          if (fav.tipo === "menu") return menuMap.get(key) ? { tipo: "menu", refId: key, menu: menuMap.get(key) } : null;
          if (fav.tipo === "carta") return cartaMap.get(key) ? { tipo: "carta", refId: key, plato: cartaMap.get(key) } : null;
          return null;
        })
        .filter(Boolean);

      return reply.send(favoritosDetallados);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      return reply.code(500).send({ error: "Error al obtener favoritos", detalle: error.message });
    }
  }

  // Toggle favorito
  static async toggleFavorito(req, reply) {
    try {
      const { refId, tipo } = req.body;
      if (!refId || !tipo) return reply.code(400).send({ error: "refId y tipo son requeridos" });
      if (!["menu", "carta"].includes(tipo)) return reply.code(400).send({ error: "Tipo no válido" });

      const usuario = await Usuario.findById(req.user.id);
      if (!usuario) return reply.code(404).send({ error: "Usuario no encontrado" });
      if (!Array.isArray(usuario.favoritos)) usuario.favoritos = [];

      // Validar existencia del recurso
      if (tipo === "menu") {
        const menu = await Menu.findById(refId).select("_id");
        if (!menu) return reply.code(404).send({ error: "Menú no encontrado" });
      } else {
        const plato = await PlatoCarta.findById(refId).select("_id");
        if (!plato) return reply.code(404).send({ error: "Plato no encontrado" });
      }

      const index = usuario.favoritos.findIndex(f => f.refId.toString() === String(refId) && f.tipo === tipo);
      const action = index >= 0 ? "removed" : "added";
      if (index >= 0) usuario.favoritos.splice(index, 1);
      else usuario.favoritos.push({ refId, tipo });

      await usuario.save();
      return reply.send({ action, favoritos: usuario.favoritos });
    } catch (error) {
      console.error("Error al actualizar favoritos:", error);
      return reply.code(500).send({ error: "Error al actualizar favoritos", detalle: error.message });
    }
  }

  static async mfaSetup(req, reply) {}
  static async mfaConfirm(req, reply) {}
}

export default UsuarioController;
