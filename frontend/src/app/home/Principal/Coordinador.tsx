"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPedidos, type PedidoResponse } from "@/lib/api";
import { BarChart3, ClipboardList, Package, DollarSign, ShoppingCart, BarChart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DashboardMetricCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-border flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-foreground-secondary">{title}</p>
      <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);

const QuickActions = () => {
  const router = useRouter();
  const actions = [
    { label: "Gestionar Productos", href: "/home/products", icon: Package },
    { label: "Gestión de Pedidos", href: "/home/pedidos", icon: ClipboardList },
    { label: "Ver Analíticas", href: "/home/analytics", icon: BarChart3 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
      <h3 className="text-lg font-semibold mb-4">Accesos Directos</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map(({ label, href, icon: Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex flex-col items-center justify-center p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon className="h-8 w-8 text-primary mb-2" />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const RecentOrdersTable = ({ orders }: { orders: PedidoResponse[] }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
    <h3 className="text-lg font-semibold mb-4">Últimos Pedidos</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-foreground-secondary">
          <tr>
            <th className="p-2 font-medium">N° Pedido</th>
            <th className="p-2 font-medium">Usuario</th>
            <th className="p-2 font-medium">Total</th>
            <th className="p-2 font-medium">Fecha</th>
            <th className="p-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 5).map((order) => (
            <tr key={order._id} className="border-t border-border">
              <td className="p-2 font-mono text-primary">#{order._id.slice(-6).toUpperCase()}</td>
              <td className="p-2">{order.usuarioNombre ?? "N/A"}</td>
              <td className="p-2 font-medium">S/ {Number(order.total).toFixed(2)}</td>
              <td className="p-2 text-foreground-secondary">{format(new Date(order.creadoEn), "dd MMM, HH:mm", { locale: es })}</td>
              <td className="p-2">
                <span className="capitalize px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{typeof order.estado === 'string' ? order.estado : (order.estado as any)?.nombre}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pedidosData = await getPedidos();
        setPedidos(pedidosData);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const pedidosHoy = pedidos.filter(p => new Date(p.creadoEn).toDateString() === today);
    const totalVentasHoy = pedidosHoy.reduce((sum, p) => sum + p.total, 0);
    const ticketPromedio = pedidosHoy.length > 0 ? totalVentasHoy / pedidosHoy.length : 0;

    return {
      ventasHoy: `S/ ${totalVentasHoy.toFixed(2)}`,
      pedidosHoy: pedidosHoy.length.toString(),
      ticketPromedio: `S/ ${ticketPromedio.toFixed(2)}`,
    };
  }, [pedidos]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Administración</h1>
          <p className="text-foreground-secondary mt-1">Resumen del día y accesos rápidos.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardMetricCard title="Ventas del Día" value={metrics.ventasHoy} icon={DollarSign} color="bg-emerald-500" />
          <DashboardMetricCard title="Pedidos Hoy" value={metrics.pedidosHoy} icon={ShoppingCart} color="bg-blue-500" />
          <DashboardMetricCard title="Ticket Promedio" value={metrics.ticketPromedio} icon={BarChart} color="bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrdersTable orders={pedidos} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
