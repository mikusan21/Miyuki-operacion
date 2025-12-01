import mongoose from "mongoose";

const PlatoCartaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, maxlength: 255 },

// Categoría fija
  categoria: { 
    type: String, 
    enum: ['plato', 'bebida', 'postre', 'piqueo', 'entrada'], 
    required: true 
  },

// Precio por plato
  precio: { type: Number, required: true, default: 0.00 },

// Imagen opcional
  imagenUrl: { type: String },

// Para activarlo o desactivarlo sin eliminarlo
  activo: { type: Boolean, default: true },

// En qué sede está disponible
  sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },
});

export default mongoose.model('PlatoCarta', PlatoCartaSchema);
