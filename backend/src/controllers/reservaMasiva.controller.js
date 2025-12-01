import ReservaMasiva from '../models/reservaMasiva.model.js';
import PlatoCarta from '../models/platosCarta.model.js';

export const crearReservaMasiva = async (request, reply) => {
  try {
    const profesorId = request.user?._id || request.user?.id;
    const { items, fechaEvento, notas } = request.body;

    if (!profesorId) return reply.code(401).send({ message: 'No autenticado' });
    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ message: 'Debe enviar al menos un item para reservar' });
    }
    if (!fechaEvento) return reply.code(400).send({ message: 'fechaEvento es requerido' });

    const idsPlatos = items.map(i => i.plato);
    const uniqueIds = [...new Set(idsPlatos.map(String))];
    const platosExistentes = await PlatoCarta.find({ _id: { $in: uniqueIds } }).select('_id');
    if (platosExistentes.length !== uniqueIds.length) {
      return reply.code(400).send({ message: 'Alguno de los platos no existe' });
    }

    const reserva = new ReservaMasiva({
      profesor: profesorId,
      items,
      fechaEvento,
      notas
    });

    await reserva.save();

    return reply.code(201).send({ message: 'Reserva masiva creada', reserva });
  } catch (err) {
    request.log?.error(err);
    return reply.code(500).send({ message: 'Error al crear reserva masiva' });
  }
};

export const listarReservasPorProfesor = async (request, reply) => {
  try {
    const profesorId = request.user?._id || request.user?.id;
    if (!profesorId) return reply.code(401).send({ message: 'No autenticado' });

    const reservas = await ReservaMasiva.find({ profesor: profesorId })
      .populate('items.plato')
      .sort({ fechaEvento: -1 });

    return reply.send(reservas);
  } catch (err) {
    request.log?.error(err);
    return reply.code(500).send({ message: 'Error al listar reservas' });
  }
};