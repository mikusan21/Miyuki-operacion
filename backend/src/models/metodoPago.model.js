
import mongoose from "mongoose";

const MetodoPagoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
});

export default mongoose.model("MetodoPago", MetodoPagoSchema);
