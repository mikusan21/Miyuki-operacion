import MenuController from "../controllers/menu.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function menuRoutes(fastify) {
  fastify.post("/", {preHandler: [verifyToken]}, MenuController.crearMenu);
  // Listado público; el controlador ajusta filtros según rol si hay token
  fastify.get("/", MenuController.listarMenus);
  fastify.put(
    "/:id",
    {preHandler: [verifyToken]},
    MenuController.actualizarMenu
  );
  fastify.patch(
    "/:id/estado",
    {preHandler: [verifyToken]},
    MenuController.cambiarEstado
  );
  fastify.delete(
    "/:id",
    {preHandler: [verifyToken]},
    MenuController.eliminarMenu
  );
  fastify.post(
    "/:id/encuesta",
    {preHandler: [verifyToken]},
    MenuController.registrarEncuestaRapida
  );
  fastify.get(
    "/encuestas/resumen",
    {preHandler: [verifyToken]},
    MenuController.obtenerResultadosEncuestas
  );
}
