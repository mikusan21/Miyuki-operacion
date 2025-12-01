//Conexión a MongoDB
import mongoose from "mongoose";

//Función para conectar a la base de datos
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión exitosa a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
    throw error;
  }
};
