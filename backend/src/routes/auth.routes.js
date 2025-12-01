import {
  register,
  login,
  logout,
  getPerfil,
  initiateMfaSetup,
  verifyMfaSetup,
  disableMfa,
  loginMfa,
} from "../controllers/auth.controller.js";
import verifyToken from "../middleware/verifyToken.js";

export default async function authRoutes(fastify) {
  fastify.post("/register", /*{preHandler: [verifyToken]},*/ register);
  fastify.post("/login", login);
  fastify.post("/logout", {preHandler: [verifyToken]}, logout);
  fastify.get("/verify", {preHandler: [verifyToken]}, async (req, reply) => {
    reply.send({valid: true, user: req.user});
  });
  fastify.get("/perfil", {preHandler: [verifyToken]}, getPerfil);
  fastify.post("/mfa/setup", {preHandler: [verifyToken]}, initiateMfaSetup);
  fastify.post("/mfa/verify", {preHandler: [verifyToken]}, verifyMfaSetup);
  fastify.post("/mfa/disable", {preHandler: [verifyToken]}, disableMfa);
  fastify.post("/login/mfa", loginMfa);
}
