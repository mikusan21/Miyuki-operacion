import mongoose from "mongoose";

const DniSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Dni", DniSchema);
