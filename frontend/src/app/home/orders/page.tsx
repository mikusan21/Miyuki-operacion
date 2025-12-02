"use client";

import {useEffect, useMemo, useState} from "react";
import OrderCard from "@/components/orders/order-cards";
import {getPedidos, type PedidoResponse} from "@/lib/api";

interface UIOrder {
  id: string;
  status: string;
  dish: string;
  category: string;
  menu: string;
  sede: string;
  date: string;
  time: string;
  image?: string | null;
}

const STATUS_MAP: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Confirmado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Finalizado",
  cancelado: "Cancelado",
};

// Helper para obtener siempre el estado como un string
function getStatusString(estado: PedidoResponse["estado"]): string {
  if (typeof estado === "string") {
    return estado;
  }
  if (typeof estado === "object" && estado !== null && "nombre" in estado) {
    return estado.nombre ?? "pendiente";
  }
  return "pendiente"; // Fallback por si acaso
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const response = await getPedidos();
        setOrders(response);
      } catch (error) {
        console.error("Error al obtener reservas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  const {currentOrders, pastOrders} = useMemo(() => {
    const transform = (pedido: PedidoResponse): UIOrder => {
      const primerItem = pedido.items[0];
      const fecha = new Date(pedido.creadoEn);

      const estadoRaw =
        typeof pedido.estado === "string"
          ? pedido.estado
          : pedido.estado?.nombre ?? "pendiente";
      const status = STATUS_MAP[estadoRaw.toLowerCase?.() ?? estadoRaw] ?? estadoRaw;

      const isObjectId = (value: string) =>
        /^[a-f\d]{24}$/i.test(value.trim());

      const sedeLabel =
        typeof pedido.sede === "string"
          ? isObjectId(pedido.sede) ? "Sede no disponible" : pedido.sede
          : pedido.sede?.nombre ?? "Sin sede";

      return {
        id: `#${pedido._id.slice(-6)}`,
        status,
        dish: primerItem?.nombre ?? "Menú reservado",
        category: primerItem?.tipo === "menu" ? "Menú" : "Carta",
        menu: `Reserva ${pedido.items.length > 1 ? "múltiple" : "individual"}`,
        sede: sedeLabel,
        date: fecha.toLocaleDateString(),
        time: fecha.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        image: primerItem?.imagenUrl ?? null,
      };
    };

    const partitioned = orders.reduce(
      (acc, pedido) => {
        const uiOrder = transform(pedido);
        const orderDate = new Date(pedido.creadoEn);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar a la medianoche

        const statusString = getStatusString(pedido.estado);
        // Un pedido es pasado si su estado es final o si su fecha es anterior a hoy.
        if (statusString === "entregado" || statusString === "cancelado" || orderDate < today) {
          acc.past.push(uiOrder);
        } else {
          acc.current.push(uiOrder);
        }
        return acc;
      },
      {current: [] as UIOrder[], past: [] as UIOrder[]}
    );

    return {
      currentOrders: partitioned.current,
      pastOrders: partitioned.past,
    };
  }, [orders]);

  return (
  <div className="min-h-screen bg-[#EFF6FF] p-8 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Mis reservas
        </h1>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length: 3}).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-lg bg-background-secondary animate-pulse"
              />
            ))}
          </div>
        ) : currentOrders.length ? (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <p className="text-foreground-secondary">
            Aún no tienes reservas activas.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Mis reservas pasadas
        </h2>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length: 2}).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-lg bg-background-secondary animate-pulse"
              />
            ))}
          </div>
        ) : pastOrders.length ? (
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} isPast />
            ))}
          </div>
        ) : (
          <p className="text-foreground-secondary">
            No registras reservas pasadas.
          </p>
        )}
      </div>
    </div>
  );
}
