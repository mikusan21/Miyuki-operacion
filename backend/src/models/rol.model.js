import mongoose from "mongoose";

const RolSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    descripcion: {
      type: String,
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Rol", RolSchema);
