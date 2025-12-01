import dotenv from "dotenv";
import mongoose from "mongoose";
import {connectDB} from "../config/db.js";
import PlatoMenu from "../models/platosMenu.model.js";
import Menu from "../models/menu.model.js";

dotenv.config();

const platosSeed = [
  // Lima Centro
  {
    sede: "Lima Centro",
    nombre: "Ensalada",
    descripcion: "Ensala de palta, tomate y lechuga.",
    tipo: "entrada",
    imagenUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    stock: 80,
  },
  {
    sede: "Lima Centro",
    nombre: "Causa",
    descripcion: "Clásica causa de papa amarilla con pollo deshilachado.",
    tipo: "entrada",
    imagenUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856",
    stock: 70,
  },
  {
    sede: "Lima Centro",
    nombre: "Lomo Saltado",
    descripcion: "Salteado de lomo con vegetales, papas fritas y arroz.",
    tipo: "segundo",
    imagenUrl: "https://images.unsplash.com/photo-1525755662778-989d0524087e",
    stock: 90,
  },
  {
    sede: "Lima Centro",
    nombre: "Ají de Gallina",
    descripcion: "Guiso cremoso de pollo con ají amarillo y queso.",
    tipo: "segundo",
    imagenUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    stock: 85,
  },
  {
    sede: "Lima Centro",
    nombre: "Mazamorra Morada",
    descripcion: "Postre tradicional de maíz morado y frutas.",
    tipo: "postre",
    imagenUrl: "https://images.unsplash.com/photo-1573878735868-8f9421364f34",
    stock: 60,
  },
  {
    sede: "Lima Centro",
    nombre: "Chicha Morada",
    descripcion: "Infusión de maíz morado con frutas y especias.",
    tipo: "bebida",
    imagenUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    stock: 120,
  },
  {
    sede: "Lima Centro",
    nombre: "Emoliente",
    descripcion: "Bebida caliente de cebada, linaza y hierbas.",
    tipo: "bebida",
    imagenUrl: "https://images.unsplash.com/photo-1510626176961-4b37d0be750c",
    stock: 100,
  },
  // Arequipa
  {
    sede: "Arequipa",
    nombre: "Crema de Zapallo",
    descripcion: "Sopa cremosa de zapallo loche y queso parmesano.",
    tipo: "entrada",
    imagenUrl: "https://images.unsplash.com/photo-1485921325833-c519f76c4927",
    stock: 65,
  },
  {
    sede: "Arequipa",
    nombre: "Ensalada",
    descripcion:
      "Vegetales frescos con aceitunas, queso feta y aderezo de limón.",
    tipo: "entrada",
    imagenUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
    stock: 70,
  },
  {
    sede: "Arequipa",
    nombre: "Salmón a la Plancha",
    descripcion: "Salmón fresco a la plancha con vegetales al vapor.",
    tipo: "segundo",
    imagenUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371",
    stock: 60,
  },
  {
    sede: "Arequipa",
    nombre: "Pollo a la Plancha",
    descripcion: "Pollo a la plancha con vegetales al vapor.",
    tipo: "segundo",
    imagenUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371",
    stock: 75,
  },
  {
    sede: "Arequipa",
    nombre: "Risotto de Quinoa",
    descripcion: "Risotto cremoso de quinoa con hongos y espárragos.",
    tipo: "segundo",
    imagenUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6",
    stock: 80,
  },
  {
    sede: "Arequipa",
    nombre: "Cheesecake de Maracuyá",
    descripcion: "Postre ligero de maracuyá con base crocante.",
    tipo: "postre",
    imagenUrl: "https://images.unsplash.com/photo-1505253216365-1dce4720e554",
    stock: 55,
  },
  {
    sede: "Arequipa",
    nombre: "Brownie con Helado",
    descripcion: "Brownie tibio acompañado de helado de vainilla.",
    tipo: "postre",
    imagenUrl: "https://images.unsplash.com/photo-1551024739-78e8d86d51a9",
    stock: 55,
  },
  {
    sede: "Arequipa",
    nombre: "Limonada de Hierba Luisa",
    descripcion: "Limonada macerada con hierba luisa.",
    tipo: "bebida",
    imagenUrl: "https://images.unsplash.com/photo-1497534446932-c925b458314e",
    stock: 110,
  },
  {
    sede: "Arequipa",
    nombre: "Agua Infusionada",
    descripcion: "Agua con frutas cítricas y hojas de menta fresca.",
    tipo: "bebida",
    imagenUrl: "https://images.unsplash.com/photo-1497534446932-c925b458314e",
    stock: 110,
  },
];

const menusSeed = [
  {
    sede: "Lima Centro",
    fecha: new Date(),
    precioNormal: 10,
    precioEjecutivo: 12,
    normal: {
      entrada: "Ensalada",
      segundo: "Lomo Saltado",
      bebida: "Chicha Morada",
    },
    ejecutivo: {
      entradas: ["Causa", "Ensalada"],
      segundos: ["Lomo Saltado", "Ají de Gallina"],
      postres: ["Mazamorra Morada"],
      bebidas: ["Chicha Morada", "Emoliente"],
    },
  },
  {
    sede: "Lima Centro",
    fecha: new Date(Date.now() + 24 * 60 * 60 * 1000),
    precioNormal: 10,
    precioEjecutivo: 12,
    normal: {
      entrada: "Causa",
      segundo: "Ají de Gallina",
      bebida: "Emoliente",
    },
    ejecutivo: {
      entradas: ["Ensalada"],
      segundos: ["Ají de Gallina", "Lomo Saltado"],
      postres: ["Mazamorra Morada"],
      bebidas: ["Chicha Morada", "Emoliente"],
    },
  },
  {
    sede: "Arequipa",
    fecha: new Date(),
    precioNormal: 10,
    precioEjecutivo: 12,
    normal: {
      entrada: "Crema de Zapallo",
      segundo: "Salmón a la Plancha",
      bebida: "Limonada de Hierba Luisa",
    },
    ejecutivo: {
      entradas: ["Ensalada", "Crema de Zapallo"],
      segundos: ["Pollo a la Plancha", "Risotto de Quinoa"],
      postres: ["Cheesecake de Maracuyá", "Brownie con Helado"],
      bebidas: ["Limonada de Hierba Luisa", "Agua Infusionada"],
    },
  },
  {
    sede: "Arequipa",
    fecha: new Date(Date.now() + 24 * 60 * 60 * 1000),
    precioNormal: 10,
    precioEjecutivo: 12,
    normal: {
      entrada: "Ensalada",
      segundo: "Risotto de Quinoa",
      bebida: "Agua Infusionada",
    },
    ejecutivo: {
      entradas: ["Crema de Zapallo", "Ensalada"],
      segundos: ["Risotto de Quinoa"],
      postres: ["Cheesecake de Maracuyá"],
      bebidas: ["Agua Infusionada", "Limonada de Hierba Luisa"],
    },
  },
];

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

(async () => {
  try {
    await connectDB();

    const platoMap = new Map();

    for (const platoData of platosSeed) {
      const {sede, nombre} = platoData;
      const existing = await PlatoMenu.findOne({sede, nombre});
      let plato = existing;

      if (!plato) {
        plato = await PlatoMenu.create(platoData);
        console.log(`✔️  Plato creado: ${nombre} (${sede})`);
      } else {
        plato.descripcion = platoData.descripcion;
        plato.tipo = platoData.tipo;
        plato.imagenUrl = platoData.imagenUrl;
        plato.stock = Math.max(plato.stock, platoData.stock);
        plato.activo = true;
        await plato.save();
        console.log(`ℹ️  Plato actualizado: ${nombre} (${sede})`);
      }

      platoMap.set(`${sede}|${nombre}`, plato);
    }

    for (const menuData of menusSeed) {
      const fecha = startOfDay(menuData.fecha);
      const normal = {
        entrada: platoMap.get(`${menuData.sede}|${menuData.normal.entrada}`)
          ?._id,
        segundo: platoMap.get(`${menuData.sede}|${menuData.normal.segundo}`)
          ?._id,
        bebida: platoMap.get(`${menuData.sede}|${menuData.normal.bebida}`)?._id,
      };

      const ejecutivo = {
        entradas: menuData.ejecutivo.entradas.map((nombre) => {
          const plato = platoMap.get(`${menuData.sede}|${nombre}`);
          if (!plato)
            throw new Error(
              `No se encontró la entrada ejecutiva '${nombre}' para ${menuData.sede}`
            );
          return plato._id;
        }),
        segundos: menuData.ejecutivo.segundos.map((nombre) => {
          const plato = platoMap.get(`${menuData.sede}|${nombre}`);
          if (!plato)
            throw new Error(
              `No se encontró el segundo ejecutivo '${nombre}' para ${menuData.sede}`
            );
          return plato._id;
        }),
        postres: menuData.ejecutivo.postres.map((nombre) => {
          const plato = platoMap.get(`${menuData.sede}|${nombre}`);
          if (!plato)
            throw new Error(
              `No se encontró el postre ejecutivo '${nombre}' para ${menuData.sede}`
            );
          return plato._id;
        }),
        bebidas: menuData.ejecutivo.bebidas.map((nombre) => {
          const plato = platoMap.get(`${menuData.sede}|${nombre}`);
          if (!plato)
            throw new Error(
              `No se encontró la bebida ejecutiva '${nombre}' para ${menuData.sede}`
            );
          return plato._id;
        }),
      };

      if (!normal.entrada || !normal.segundo || !normal.bebida) {
        throw new Error(
          `Faltan platos normales para el menú de ${menuData.sede}`
        );
      }

      const update = {
        fecha,
        sede: menuData.sede,
        precioNormal: menuData.precioNormal,
        precioEjecutivo: menuData.precioEjecutivo,
        normal,
        ejecutivo,
        activo: true,
      };

      const result = await Menu.findOneAndUpdate(
        {sede: menuData.sede, fecha},
        update,
        {upsert: true, new: true, setDefaultsOnInsert: true}
      );

      console.log(
        `✔️  Menú registrado para ${menuData.sede} (${fecha
          .toISOString()
          .slice(0, 10)})`
      );
    }

    console.log("✅ Siembra de menús completada");
  } catch (error) {
    console.error("❌ Error durante la siembra de datos:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Conexión a MongoDB cerrada");
  }
})();
