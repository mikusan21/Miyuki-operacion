import UsuarioController from "../controllers/usuario.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function usuarioRoutes(fastify) {
  fastify.post(
    "/",
    {preHandler: [verifyToken]},
    UsuarioController.crearUsuario
  );
  fastify.get(
    "/",
    {preHandler: [verifyToken]},
    UsuarioController.listarUsuarios
  );
  fastify.patch(
    "/:userId/estado",
    {preHandler: [verifyToken]},
    UsuarioController.activarDesactivarUsuario
  );
  fastify.delete(
    "/:userId",
    {preHandler: [verifyToken]},
    UsuarioController.eliminarUsuario
  );
  fastify.get(
    "/me/favoritos",
    {preHandler: [verifyToken]},
    UsuarioController.obtenerFavoritos
  );
  fastify.post(
    "/me/favoritos",
    {preHandler: [verifyToken]},
    UsuarioController.toggleFavorito
  );
  fastify.get(
    "/mfa/setup",
    {preHandler: [verifyToken]},
    UsuarioController.mfaSetup
  );
  fastify.post(
    "/mfa/confirm",
    {preHandler: [verifyToken]},
    UsuarioController.mfaConfirm
  );
}
