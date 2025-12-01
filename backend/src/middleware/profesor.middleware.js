export default async function profesorOnly(request, reply) {
  if (!request.user) return reply.code(401).send({ message: 'No autenticado' });
  if (request.user.rol !== 'profesor') return reply.code(403).send({ message: 'Se requiere rol profesor' });
  return;
}