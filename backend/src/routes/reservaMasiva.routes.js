import verifyToken from '../middleware/verifyToken.js';
import profesorOnly from '../middleware/profesor.middleware.js';
import * as reservaCtrl from '../controllers/reservaMasiva.controller.js';

export default async function reservaMasivaRoutes(fastify, opts) {
  fastify.post('/reservas-masivas', { preHandler: [verifyToken, profesorOnly] }, reservaCtrl.crearReservaMasiva);
  fastify.get('/reservas-masivas/mias', { preHandler: [verifyToken, profesorOnly] }, reservaCtrl.listarReservasPorProfesor);
}