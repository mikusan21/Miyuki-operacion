import SedeController from "../controllers/sede.controller.js";

export default async function sedeRoutes(fastify) {
  fastify.get("/", SedeController.listar);
}
