import Usuario from "../models/usuario.model.js";
import Rol from "../models/rol.model.js";
import Dni from "../models/dni.model.js";
import Sede from "../models/sede.model.js";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { createAccessToken, createMfaToken, verifyJwt } from "../lib/jwt.js";

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//   REGISTER COMPLETO Y FINAL
export const register = async (req, reply) => {
  const {
    numero: dni,
    nombres,
    apellidos,
    password,
    tipo,
    codigoUsu,
    rol,
    sede
  } = req.body;

  const codigoUsuNormalizado = codigoUsu?.trim().toLowerCase();
  const dniNormalizado = dni?.trim().toLowerCase();

  try {
// 1. Validar duplicados (dni o codigoUsu)
    const duplicateFilters = [codigoUsuNormalizado ? { codigoUsu: codigoUsuNormalizado } : null].filter(Boolean);
    const existingUser = duplicateFilters.length
      ? await Usuario.findOne({ $or: duplicateFilters })
      : null;

    const existingDni = await Dni.findOne({ numero: dniNormalizado });

    if (existingUser || existingDni) {
      return reply.status(400).send({
        message: "El usuario ya existe (DNI o código duplicado)",
      });
    }
// 2. Crear DNI
    const dniDoc = await Dni.create({
      numero: dniNormalizado,
      nombres,
      apellidos
    });

// 3. Resolver rol a asignar según permisos

    let roleToAssign = null;

    // Caso 1: Si no hay token → solo puede crear usuarios con rol "usuario"
    if (!req.user) {
      roleToAssign = await Rol.findOne({ nombre: "usuario" });
    } else {
      // Usuario autenticado
      const currentUser = await Usuario.findById(req.user.id).populate("rol");
      const currentRole = currentUser.rol.nombre;

      if (!rol) {
        // Si no indica rol, asignar usuario
        roleToAssign = await Rol.findOne({ nombre: "usuario" });
      } else {
        const requestedRole = await Rol.findById(rol);
        if (!requestedRole)
          return reply.status(400).send({ message: "El rol enviado no existe." });

        // Regla: solo un admin crea admin o coordinador
        if (["admin", "coordinador"].includes(requestedRole.nombre)) {
          if (currentRole !== "admin") {
            return reply.status(403).send({
              message: "Solo un admin puede crear admins o coordinadores.",
            });
          }
        }

        // Regla: profesor solo lo crea admin o coordinador
        if (requestedRole.nombre === "profesor") {
          if (!["admin", "coordinador"].includes(currentRole)) {
            return reply.status(403).send({
              message: "Solo admin o coordinador pueden crear profesores.",
            });
          }
        }

        roleToAssign = requestedRole;
      }
    }
// 4. Validaciones propias del tipo

    if (tipo === "interno") {
      if (!codigoUsu)
        return reply.status(400).send({
          message: "codigoUsu es obligatorio para usuarios internos.",
        });

      if (sede) {
        const sedeDoc = await Sede.findById(sede);
        if (!sedeDoc)
          return reply.status(400).send({ message: "La sede enviada no existe." });
      }
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Crear usuario
    const newUser = await Usuario.create({
      dni: dniDoc._id,
      password: hashedPassword,
      tipo,
      codigoUsu: tipo === "interno" ? codigoUsuNormalizado : undefined,
      rol: roleToAssign._id,
      sede: sede ?? null
    });

    // 7. Token si no estaba logueado
    let token = null;
    if (!req.user) {
      token = await createAccessToken({
        id: newUser._id,
        rol: roleToAssign.nombre,
      });
    }

    // 8. Respuesta
    reply.send({
      id: newUser._id,
      dni: dniDoc.numero,
      nombres: dniDoc.nombres,
      apellidos: dniDoc.apellidos,
      rol: roleToAssign.nombre,
      tipo: newUser.tipo,
      sede: newUser.sede,
      codigoUsu: newUser.codigoUsu,
      token
    });

  } catch (error) {
    console.error("Error en register:", error);
    reply.status(500).send({ message: "Error en el servidor", error });
  }
};


//  LOGIN

export const login = async (req, reply) => {
  const { identificador, password } = req.body;
  const normalizedId = (identificador ?? "").trim().toLowerCase();

  try {
    if (!normalizedId || !password?.trim()) {
      return reply.status(400).send({ message: "Identificador y contraseña son obligatorios" });
    }

    let userFound = null;

    // Código interno (normalizado y case-insensitive)
    const escaped = escapeRegex(normalizedId);
    userFound = await Usuario.findOne({ codigoUsu: normalizedId })
      .populate("dni")
      .populate("rol");
    // Intentar por DNI si no es interno
    if (!userFound) {
      userFound = await Usuario.findOne({ codigoUsu: { $regex: `^${escaped}$`, $options: "i" } })
        .populate("dni")
        .populate("rol");
    }

    if (!userFound) {
      const dniDoc = await Dni.findOne({
        $or: [
          { numero: normalizedId },
          { numero: { $regex: `^${escaped}$`, $options: "i" } }
        ]
      });
      if (dniDoc) {
        userFound = await Usuario.findOne({ dni: dniDoc._id })
          .populate("dni")
          .populate("rol");
      }
    }

    if (!userFound)
      return reply.status(400).send({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch)
      return reply.status(400).send({ message: "Contraseña incorrecta" });

    if (!userFound.activo)
      return reply.status(403).send({
        message: "Usuario inactivo. Contacte al administrador",
      });

    // MFA activado: devolver token parcial
    if (userFound.mfa_enabled && userFound.mfa_secret) {
      const mfaToken = await createMfaToken({
        id: userFound._id,
        rol: userFound.rol.nombre,
        mfa: true,
      });

      return reply.send({
        id: userFound._id,
        identificador,
        rol: userFound.rol.nombre,
        mfaRequired: true,
        mfaToken,
      });
    }

    const token = await createAccessToken({
      id: userFound._id,
      rol: userFound.rol.nombre,
    });

    reply.send({
      id: userFound._id,
      identificador,
      rol: userFound.rol.nombre,
      token,
    });
  } catch (error) {
    reply.status(500).send({ message: "Error en el servidor", error });
  }
};


//  LOGOUT

export const logout = async (req, reply) => {
  reply.clearCookie("token");
  reply.send({ message: "Sesión cerrada" });
};

//  PERFIL

export const getPerfil = async (req, reply) => {
  try {
    const user = await Usuario.findById(req.user.id)
      .select("-password")
      .populate("dni")
      .populate("rol")
      .populate("sede");

    if (!user)
      return reply.status(404).send({ message: "Usuario no encontrado" });

    const nombreCompleto = [user?.dni?.nombres, user?.dni?.apellidos]
      .filter(Boolean)
      .join(" ")
      .trim();

    reply.send({
      id: user._id,
      nombre: nombreCompleto || user?.dni?.nombres || user?.codigoUsu || user?.dni?.numero,
      rol: user.rol?.nombre,
      codigoUsu: user.codigoUsu,
      dni: user.dni?.numero,
      tipo: user.tipo,
      sede: user.sede?._id ?? user.sede ?? null,
      sedeNombre: user.sede?.nombre ?? null,
      mfaEnabled: Boolean(user.mfa_enabled && user.mfa_secret),
    });
  } catch (error) {
    reply.status(500).send({ message: "Error obteniendo perfil", error });
  }
};


//  MFA
export const initiateMfaSetup = async (req, reply) => {
  try {
    const user = await Usuario.findById(req.user.id);

    if (!user) return reply.status(404).send({ message: "Usuario no encontrado" });

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Sistema Reserva Menu (${user.nombre})`,
      issuer: "Sistema Reserva Menu",
    });

    user.mfa_secret = secret.base32;
    user.mfa_enabled = false;
    await user.save();

    reply.send({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    reply.status(500).send({ message: "Error generando configuración 2FA", error });
  }
};


export const verifyMfaSetup = async (req, reply) => {
  const { code } = req.body;

  if (!code)
    return reply.status(400).send({ message: "El código es requerido" });

  try {
    const user = await Usuario.findById(req.user.id);

    if (!user || !user.mfa_secret)
      return reply.status(400).send({ message: "No hay configuración 2FA pendiente" });

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid)
      return reply.status(400).send({ message: "Código inválido" });

    user.mfa_enabled = true;
    await user.save();

    reply.send({ message: "Autenticación de dos factores activada" });
  } catch (error) {
    reply.status(500).send({ message: "Error validando 2FA", error });
  }
};


export const disableMfa = async (req, reply) => {
  const { code } = req.body;

  try {
    const user = await Usuario.findById(req.user.id);

    if (!user)
      return reply.status(404).send({ message: "Usuario no encontrado" });

    if (!user.mfa_enabled || !user.mfa_secret)
      return reply.status(400).send({ message: "2FA no está habilitado" });

    if (!code)
      return reply.status(400).send({ message: "El código es requerido" });

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid)
      return reply.status(400).send({ message: "Código inválido" });

    user.mfa_enabled = false;
    user.mfa_secret = undefined;
    await user.save();

    reply.send({ message: "Autenticación de dos factores desactivada" });
  } catch (error) {
    reply.status(500).send({ message: "Error deshabilitando 2FA", error });
  }
};

// Completar login con MFA
export const loginMfa = async (req, reply) => {
  const { mfaToken, code } = req.body;
  if (!mfaToken || !code) {
    return reply.status(400).send({ message: "Token MFA y código son requeridos" });
  }

  try {
    const decoded = await verifyJwt(mfaToken);
    if (!decoded?.mfa || !decoded?.id) {
      return reply.status(400).send({ message: "Token MFA inválido" });
    }

    const user = await Usuario.findById(decoded.id).populate("rol");
    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return reply.status(400).send({ message: "No hay MFA habilitado para este usuario" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: String(code).trim(),
      window: 1,
    });

    if (!isValid) {
      return reply.status(400).send({ message: "Código MFA inválido" });
    }

    const token = await createAccessToken({
      id: user._id,
      rol: user.rol?.nombre,
    });

    reply.send({
      id: user._id,
      identificador: user.codigoUsu ?? user.dni?.numero,
      rol: user.rol?.nombre,
      token,
    });
  } catch (error) {
    console.error("Error en login MFA:", error);
    reply.status(500).send({ message: "Error al validar MFA", error });
  }
};
