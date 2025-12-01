import mongoose from "mongoose";

const MenuSchema = new mongoose.Schema({
// Fecha del menú
  fecha: { type: Date, required: true },

// Sede a la que pertenece el menú
  sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },

// Precios del menú
  precioNormal: { type: Number, required: true },
  precioEjecutivo: { type: Number, required: true },

// Platos que componen el menú
  // Opciones para armado del menú normal
  normal: {
    entrada: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu', required: true },
    segundo: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu', required: true },
    bebida: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu', required: true }
  },

// Opciones para armado del menú ejecutivo
  ejecutivo: {
    entradas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu' }],
    segundos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu' }],
    postres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu' }],
    bebidas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlatoMenu' }]
  },

// Estado del menú
  activo: { type: Boolean, default: true }
});

export default mongoose.model('Menu', MenuSchema);
