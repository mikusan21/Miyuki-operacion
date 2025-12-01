import PlatoMenuController from "../controllers/platosMenu.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function platoMenuRoutes(fastify) {

  fastify.post("/", { preHandler: [verifyToken] }, PlatoMenuController.crearPlato);
  fastify.get("/", { preHandler: [verifyToken] }, PlatoMenuController.listarPlatos);
  fastify.patch("/:platoId", { preHandler: [verifyToken] }, PlatoMenuController.actualizarPlato);
  fastify.delete("/:platoId", { preHandler: [verifyToken] }, PlatoMenuController.eliminarPlato);
}
