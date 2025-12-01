import NotasController from "../controllers/notas.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function notasRoutes(fastify) {

  fastify.post("/", { preHandler: [verifyToken] }, NotasController.crearNota);
  fastify.get("/", { preHandler: [verifyToken] }, NotasController.listarNotas);
  fastify.delete("/:id", { preHandler: [verifyToken] }, NotasController.eliminarNota);

}
