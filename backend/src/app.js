import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

// Importar rutas
import authRoutes from "./routes/auth.routes.js";
import notasRoutes from "./routes/notas.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import pedidoRoutes from "./routes/pedido.routes.js";
import platosCartaRoutes from "./routes/platosCarta.routes.js";
import platosMenuRoutes from "./routes/platosMenu.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import reservaMasivaRoutes from "./routes/reservaMasiva.routes.js";
import sedeRoutes from "./routes/sede.routes.js";

const app = Fastify({logger: true});

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Configurar cookies y CORS
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || "supersecret",
});

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }

    cb(new Error("Not allowed"), false);
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Registrar las rutas
await app.register(authRoutes, {prefix: "/api/auth"});
await app.register(notasRoutes, {prefix: "/api/notas"});
await app.register(menuRoutes, {prefix: "/api/menus"});
await app.register(pedidoRoutes, {prefix: "/api/pedidos"});
await app.register(platosCartaRoutes, {prefix: "/api/platos-carta"});
await app.register(platosMenuRoutes, {prefix: "/api/platos-menu"});
await app.register(usuarioRoutes, {prefix: "/api/usuarios"});
app.register(reservaMasivaRoutes, {prefix: "/api"});
await app.register(sedeRoutes, {prefix: "/api/sedes"});

// Ruta base de prueba
app.get("/", async () => ({message: "Servidor Fastify operativo"}));

export default app;
