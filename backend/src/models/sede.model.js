import mongoose from "mongoose";

const SedeSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  direccion: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Sede", SedeSchema);
