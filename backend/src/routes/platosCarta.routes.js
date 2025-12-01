import PlatoCartaController from "../controllers/platosCarta.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function platoCartaRoutes(fastify) {
  fastify.post("/", { preHandler: [verifyToken] }, PlatoCartaController.crearPlato);
  fastify.get("/", { preHandler: [verifyToken] }, PlatoCartaController.listarPlatos);
  fastify.patch("/:id", { preHandler: [verifyToken] }, PlatoCartaController.actualizarPlato);
  fastify.delete("/:id", { preHandler: [verifyToken] }, PlatoCartaController.eliminarPlato);
}
