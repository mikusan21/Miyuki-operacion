import mongoose from "mongoose";

const UsuarioSchema = new mongoose.Schema(
  {
    // DNI del usuario (requerido para usuarios externos e internos)
    dni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dni",
      required: true,
    },

    password: {type: String, required: true},

    // Tipo de usuario: 'interno' o 'externo'
    tipo: {type: String, enum: ["interno", "externo"], required: true},

    // Código único del usuario (requerido para usuarios internos)
    codigoUsu: {
      type: String,
      required: function () {
        return this.tipo === "interno";
      },
    },

    // Rol del usuario
    rol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rol",
      required: true,
    }, // agregado profesor

    // Sede a la que pertenece el usuario (solo para usuarios internos)
    sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede" },

    // Lista de platos favoritos del usuario
    favoritos: [
      {
        refId: {type: mongoose.Schema.Types.ObjectId, required: true},
        tipo: {type: String, enum: ["menu", "carta"], required: true},
      },
    ],
    // Estado del usuario
    activo: {type: Boolean, default: true},
    mfa_enabled: {type: Boolean, default: false},
    mfa_secret: {type: String},
  },
  {timestamps: true}
);

export default mongoose.model("Usuario", UsuarioSchema);
