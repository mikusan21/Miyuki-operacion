import mongoose from "mongoose";

const notasSchema = new mongoose.Schema({
// Usuario que crea la nota
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },

// Puede ser ID de PlatoMenu, Menú, o cualquier otro producto
  productoId: { type: mongoose.Schema.Types.ObjectId, required: true },

//Descripción de la nota
  descripcion: { type: String, required: true, maxlength: 1000 },
  creadoEn: { type: Date, default: Date.now }
});
export const Nota = mongoose.model("Nota", notasSchema);