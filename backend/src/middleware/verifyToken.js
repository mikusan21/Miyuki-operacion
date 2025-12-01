import jwt from "jsonwebtoken";

// reemplazo: export named -> export default y mantener firma Fastify
export default async function verifyToken(request, reply) {
  try {
    const token = request.cookies?.token || (request.headers?.authorization ? request.headers.authorization.split(" ")[1] : null);
    if (!token) {
      return reply.code(401).send({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded; // importante: request.user será usado por otros handlers
    return; // continuar al handler
  } catch (err) {
    return reply.code(401).send({ error: "Token inválido o expirado" });
  }
}
