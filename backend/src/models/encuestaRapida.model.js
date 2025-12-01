import mongoose from "mongoose";

const EncuestaRapidaSchema = new mongoose.Schema(
  {
    menuId: {type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true},
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    opciones: {
      type: [String],
      required: true,
      validate: {
        validator: (val) => Array.isArray(val) && val.length > 0,
        message: "Debe seleccionar al menos una opción",
      },
    },
  },
  {timestamps: true}
);

EncuestaRapidaSchema.index({menuId: 1, usuarioId: 1}, {unique: true});

export default mongoose.model("EncuestaRapida", EncuestaRapidaSchema);
