import mongoose from "mongoose";

const PlatoMenuSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, maxlength: 255 },
  tipo: { 
    type: String, 
    enum: ['entrada', 'segundo', 'postre', 'bebida', 'plato', 'piqueo'], 
    required: true 
  },
  imagenUrl: { type: String },
  sede: {type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },
  stock: { type: Number, default: 0, min: 0 },
  precio: { type: Number, default: 0, min: 0 },
  activo: { type: Boolean, default: true }
});

// Middleware: si el stock llega a 0, desactiva el plato automáticamente
PlatoMenuSchema.pre('save', function (next) {
  if (this.stock <= 0 && this.activo) {
    this.activo = false;
  } else if (this.stock > 0 && !this.activo) {
  // Si vuelve a haber stock, se reactiva automáticamente
    this.activo = true;
  }
  next();
});

export default mongoose.model('PlatoMenu', PlatoMenuSchema);
