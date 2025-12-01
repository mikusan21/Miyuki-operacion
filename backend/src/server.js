//Llamada hacia el servidor Web
import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { connectDB } from "./config/db.js";

//Llamada hacia la base de datos
const PORT = process.env.PORT || 4000;

try {
  await connectDB();
  await app.listen({ port: PORT });
  console.log(`Web server running on port: ${PORT}`);
} catch (err) {
  console.error("Error real al iniciar el servidor:", err);
  process.exit(1);
}

