import Sede from "../models/sede.model.js";

class SedeController {
  // Lista todas las sedes disponibles
  static async listar(req, reply) {
    try {
      const sedes = await Sede.find().lean();
      reply.send(sedes);
    } catch (error) {
      reply.code(500).send({ error: "Error al listar sedes" });
    }
  }
}

export default SedeController;
