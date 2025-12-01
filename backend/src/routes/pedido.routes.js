import PedidoController from "../controllers/pedido.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function pedidoRoutes(fastify) {
  fastify.post("/", { preHandler: [verifyToken] }, PedidoController.crearPedido);
  fastify.get("/", { preHandler: [verifyToken] }, PedidoController.listarPedidos);
  fastify.patch("/:id/estado", { preHandler: [verifyToken] }, PedidoController.actualizarEstado);
  fastify.delete("/:id", { preHandler: [verifyToken] }, PedidoController.eliminarPedido);
}
