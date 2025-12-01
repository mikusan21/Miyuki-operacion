import mongoose from "mongoose";

const ItemReservaSchema = new mongoose.Schema({
  // { cambiado: ref correcto 'PlatoCarta' }
  plato: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatoCarta', required: true },
  cantidad: { type: Number, required: true, min: 1 }
}, { _id: false });

const ReservaMasivaSchema = new mongoose.Schema({
  profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  items: { type: [ItemReservaSchema], required: true },
  fechaEvento: { type: Date, required: true },
  notas: { type: String },
  estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'], default: 'pendiente' }
}, { timestamps: true });

export default mongoose.model('ReservaMasiva', ReservaMasivaSchema);