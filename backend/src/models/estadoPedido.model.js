
import mongoose from "mongoose";

const EstadoPedidoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }
});

export default mongoose.model("EstadoPedido", EstadoPedidoSchema);
