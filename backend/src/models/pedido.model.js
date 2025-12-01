import mongoose from "mongoose";

const ItemPedidoSchema = new mongoose.Schema(
    {
        refId: { type: mongoose.Schema.Types.ObjectId, required: true },
        tipo: { type: String, enum: ["menu", "carta"], required: true },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnitario: { type: Number, required: true },
    },
    { _id: false }
);

const PedidoSchema = new mongoose.Schema(
    {
        usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
        sede: { type: mongoose.Schema.Types.ObjectId, ref: "Sede", required: true },
        items: { type: [ItemPedidoSchema], required: true },
        total: { type: Number, required: true },
        estado: { type: mongoose.Schema.Types.ObjectId, ref: "EstadoPedido", required: true },
        metodoPago: { type: mongoose.Schema.Types.ObjectId, ref: "MetodoPago", required: true },
    },
    {
        timestamps: { createdAt: "creadoEn", updatedAt: "actualizadoEn" },
    }
);

PedidoSchema.index({ creadoEn: -1 });

export default mongoose.model("Pedido", PedidoSchema);
