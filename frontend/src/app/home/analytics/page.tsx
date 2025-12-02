"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  ClipboardList,
  Package,
} from "lucide-react";
import {
  getPedidos,
  getResultadosEncuestas,
  type EncuestaMenuResultado,
  type PedidoResponse,
} from "@/lib/api";
import HorizontalBars from "@/components/analytics/HorizontalBars";
import CycleBars from "@/components/analytics/CycleBars";

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-foreground-secondary">Cargando...</p>
      </div>
    </div>
  );
}

const MetricCard = ({ title, value, icon: Icon, color, subValue }: { title: string, value: string, icon: React.ElementType, color: string, subValue?: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-border flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-foreground-secondary">{title}</p>
      <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
      {subValue && <p className="text-xs text-foreground-secondary mt-1">{subValue}</p>}
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);


function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PEN_FORMATTER = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return PEN_FORMATTER.format(0);
  }
  return PEN_FORMATTER.format(value);
}

type DailyMetrics = {
  hasOrders: boolean;
  topSede: {sede: string; total: number} | null;
  topDish: {nombre: string; cantidad: number; revenue: number} | null;
  topUser: {id: string; displayName: string; total: number} | null;
  ranking: Array<{
    sede: string;
    total: number;
    categories: Array<{category: string; total: number}>;
  }>;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<EncuestaMenuResultado[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!stored) {
      router.replace("/");
      setCheckingAuth(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (parsed?.rol !== "admin") {
        router.replace("/home/menu");
        return;
      }
      setAuthorized(true);
    } catch (err) {
      console.error("Error parsing stored user:", err);
      router.replace("/");
      return;
    } finally {
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [encuestas, pedidosResponse] = await Promise.all([
          getResultadosEncuestas(),
          getPedidos(),
        ]);
        setResultados(encuestas);
        setPedidos(pedidosResponse);
      } catch (err) {
        console.error("Error al cargar analíticas:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar la información analítica"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authorized]);

  const resumenGlobal = useMemo(() => {
    if (resultados.length === 0) {
      return {totalMenus: 0, totalEncuestas: 0};
    }
    const totalMenus = resultados.length;
    const totalEncuestas = resultados.reduce(
      (acc, item) => acc + (item.totalEncuestas ?? 0),
      0
    );
    return {totalMenus, totalEncuestas};
  }, [resultados]);

  const todayKey = useMemo(() => new Date().toDateString(), []);

  const pedidosHoy = useMemo(() => {
    if (!pedidos.length) {
      return [] as PedidoResponse[];
    }

    return pedidos.filter((pedido) => {
      if (!pedido.creadoEn) {
        return false;
      }
      const createdAt = new Date(pedido.creadoEn);
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }
      return createdAt.toDateString() === todayKey;
    });
  }, [pedidos, todayKey]);

  const dailyMetrics = useMemo<DailyMetrics>(() => {
    if (!pedidosHoy.length) {
      return {
        hasOrders: false,
        topSede: null,
        topDish: null,
        topUser: null,
        ranking: [],
      };
    }

    const sedeTotals = new Map<string, number>();
    const dishTotals = new Map<
      string,
      {nombre: string; cantidad: number; revenue: number}
    >();
    const userTotals = new Map<string, {displayName: string; total: number}>();
    const categoryRevenue = new Map<string, Map<string, number>>();

    pedidosHoy.forEach((pedido) => {
      const sedeNombre =
        (typeof pedido.sede === "object" && pedido.sede !== null && "nombre" in pedido.sede)
          ? (pedido.sede as { nombre: string }).nombre
          : (typeof pedido.sede === "string" ? pedido.sede : "Sede desconocida");
      const sedeKey = sedeNombre ?? "Sin sede";
      const pedidoTotal = Number(pedido.total) || 0;
      sedeTotals.set(sedeKey, (sedeTotals.get(sedeKey) ?? 0) + pedidoTotal);

      const baseDisplayName =
        pedido.usuarioNombre ??
        pedido.usuarioCorreo ??
        pedido.usuarioId ??
        "Usuario no identificado";
      const displayName =
        typeof baseDisplayName === "string"
          ? baseDisplayName.trim() || "Usuario no identificado"
          : "Usuario no identificado";
      const userKey = pedido.usuarioId ?? displayName;
      const existingUser = userTotals.get(userKey);
      if (existingUser) {
        existingUser.total += pedidoTotal;
      } else {
        userTotals.set(userKey, {displayName, total: pedidoTotal});
      }

      pedido.items.forEach((item) => {
        const quantity = Math.max(0, Number(item.cantidad) || 0);
        const unitPrice = Number(item.precioUnitario) || 0;
        const revenue = quantity * unitPrice;
        const dishKey = String(item.refId ?? item.nombre ?? "sin-referencia");
        const dishName =
          (typeof item.nombre === "string" && item.nombre.trim()) ||
          (typeof item.refId === "string"
            ? `Plato ${item.refId.slice(-6)}`
            : "Plato sin nombre");

        const existingDish = dishTotals.get(dishKey);
        if (existingDish) {
          existingDish.cantidad += quantity;
          existingDish.revenue += revenue;
          if (!existingDish.nombre && dishName) {
            existingDish.nombre = dishName;
          }
        } else {
          dishTotals.set(dishKey, {
            nombre: dishName,
            cantidad: quantity,
            revenue,
          });
        }

        const categoryKey = item.tipo ? String(item.tipo) : "Sin categoría";
        let sedeCategories = categoryRevenue.get(sedeKey);
        if (!sedeCategories) {
          sedeCategories = new Map<string, number>();
          categoryRevenue.set(sedeKey, sedeCategories);
        }
        sedeCategories.set(
          categoryKey,
          (sedeCategories.get(categoryKey) ?? 0) + revenue
        );
      });
    });

    const topSedeEntry = [...sedeTotals.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topDishEntry = [...dishTotals.entries()].sort((a, b) => {
      if (b[1].cantidad !== a[1].cantidad) {
        return b[1].cantidad - a[1].cantidad;
      }
      return b[1].revenue - a[1].revenue;
    })[0];
    const topUserEntry = [...userTotals.entries()].sort(
      (a, b) => b[1].total - a[1].total
    )[0];

    const ranking = [...categoryRevenue.entries()]
      .map(([sede, categories]) => {
        const categoryList = [...categories.entries()]
          .map(([category, total]) => ({category, total}))
          .sort((a, b) => b.total - a.total);
        const total = categoryList.reduce((acc, item) => acc + item.total, 0);
        return {sede, total, categories: categoryList};
      })
      .sort((a, b) => b.total - a.total);

    return {
      hasOrders: true,
      topSede: topSedeEntry
        ? {sede: topSedeEntry[0], total: topSedeEntry[1]}
        : null,
      topDish: topDishEntry
        ? {
            nombre: topDishEntry[1].nombre,
            cantidad: topDishEntry[1].cantidad,
            revenue: topDishEntry[1].revenue,
          }
        : null,
      topUser: topUserEntry
        ? {
            id: topUserEntry[0],
            displayName: topUserEntry[1].displayName,
            total: topUserEntry[1].total,
          }
        : null,
      ranking,
    };
  }, [pedidosHoy]);

  const totalVentas = dailyMetrics.ranking.map(sedeData => ({
    sede: sedeData.sede,
    monto: formatCurrency(sedeData.total),
    // Mapeamos las categorías al formato que espera HorizontalBars ({ label, value })
    categories: sedeData.categories.map(cat => ({
      label: cat.category,
      value: cat.total,
    })),
  }));

  // Datos de ejemplo para el gráfico de ciclos. Reemplazar con datos reales.
  const cicloReservas = [{label: "2024-1", value: 120}, {label: "2024-2", value: 150}];

  if (checkingAuth) {
    return <LoadingView />;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Analíticas</h1>
          <p className="text-sm text-foreground-secondary">
            Análisis de métricas
          </p>
        </header>

        {/* Métricas del Día */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard 
            title="Sede más popular (hoy)" 
            value={dailyMetrics.topSede?.sede ?? "N/A"} 
            subValue={dailyMetrics.topSede ? `Ingresos: ${formatCurrency(dailyMetrics.topSede.total)}` : "Sin pedidos hoy"}
            icon={DollarSign} 
            color="bg-emerald-500" 
          />
          <MetricCard 
            title="Plato más pedido (hoy)" 
            value={dailyMetrics.topDish?.nombre ?? "N/A"} 
            subValue={dailyMetrics.topDish ? `${dailyMetrics.topDish.cantidad} uds · ${formatCurrency(dailyMetrics.topDish.revenue)}` : "Sin pedidos hoy"}
            icon={Package} 
            color="bg-blue-500" 
          />
          <MetricCard 
            title="Usuario más activo (hoy)" 
            value={dailyMetrics.topUser?.displayName ?? "N/A"} 
            subValue={dailyMetrics.topUser ? `Consumo: ${formatCurrency(dailyMetrics.topUser.total)}` : "Sin pedidos hoy"}
            icon={Users} 
            color="bg-orange-500" 
          />
        </div>

        {/* Gráficos de Ventas y Ciclos */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border border-border">
            <h3 className="text-lg font-semibold mb-4">Ranking de Ventas por Sede</h3>
            {totalVentas.length > 0 ? (
              <div className="space-y-6">
                {totalVentas.map((sedeBox) => (
                  <div key={sedeBox.sede}>
                    <div className="flex justify-between items-baseline mb-2">
                      <h4 className="font-medium">{sedeBox.sede}</h4>
                      <p className="text-sm font-bold text-primary">{sedeBox.monto}</p>
                    </div>
                    <HorizontalBars items={sedeBox.categories} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-secondary text-center py-8">No hay datos de ventas para mostrar.</p>
            )}
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-border">
            <h3 className="text-lg font-semibold mb-4">Reservas por Ciclos</h3>
            <p className="text-sm text-foreground-secondary mb-6">Visualización de interacciones a lo largo de los ciclos académicos.</p>
            <CycleBars data={cicloReservas} />
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Encuestas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              title="Menús Evaluados" 
              value={resumenGlobal.totalMenus.toString()} 
              icon={ClipboardList} 
              color="bg-purple-500" 
            />
            <MetricCard 
              title="Respuestas Totales" 
              value={resumenGlobal.totalEncuestas.toString()} 
              icon={BarChart3} 
              color="bg-pink-500" 
            />
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : resultados.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            Aún no hay encuestas registradas.
          </div>
        ) : (
          <div className="space-y-6">
            {resultados.map((resultado) => (
              <section
                key={resultado.menuId}
                className="rounded-xl border border-border bg-white p-6 shadow-sm"
              >
                <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {resultado.sede}
                    </h2>
                    <p className="text-sm text-foreground-secondary">
                      {formatDate(resultado.fecha)} · {resultado.totalEncuestas}{" "}
                      respuesta
                      {resultado.totalEncuestas === 1 ? "" : "s"}
                    </p>
                  </div>
                </header>
                <div className="space-y-2">
                  {resultado.opciones.length === 0 ? (
                    <p className="text-sm text-foreground-secondary">
                      Este menú aún no tiene votos registrados.
                    </p>
                  ) : (
                    resultado.opciones.map((opcion) => {
                      const porcentaje = resultado.totalEncuestas
                        ? Math.round(
                            (opcion.votos / resultado.totalEncuestas) * 100
                          )
                        : 0;
                      return (
                        <div
                          key={opcion.opcionId}
                          className="rounded-lg border border-border/60 bg-muted/30 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-foreground">
                                {opcion.nombre}
                              </p>
                              {opcion.tipo && (
                                <p className="text-xs uppercase text-foreground-secondary">
                                  {opcion.tipo}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-foreground-secondary">
                              <p className="font-semibold text-foreground">
                                {opcion.votos} voto
                                {opcion.votos === 1 ? "" : "s"}
                              </p>
                              <p>{porcentaje}%</p>
                            </div>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{width: `${Math.min(porcentaje, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
