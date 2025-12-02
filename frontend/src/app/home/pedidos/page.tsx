"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {useRouter} from "next/navigation";
import {
  getPedidos,
  crearPedido,
  updatePedidoStatus, // Asumiendo que esta función existe en lib/api.ts
  type PedidoResponse,
  type PedidoStatus,
} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Check, X, PlusCircle, Loader2} from "lucide-react"; // Iconos para acciones y agregar
import {DatePicker} from "@/components/ui/date-picker"; // Asumiendo que tienes un DatePicker
import {format} from "date-fns";
import {es} from "date-fns/locale";
import AddPedidoModal from "./AddPedidoModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Helper para obtener el estado como string
function getPedidoStatusString(estado: PedidoResponse["estado"]): PedidoStatus {
  if (typeof estado === "string") {
    return estado as PedidoStatus;
  }
  if (typeof estado === "object" && estado !== null && "nombre" in estado) {
    return (estado as { nombre: string }).nombre as PedidoStatus;
  }
  return "pendiente"; // Fallback
}

export default function PedidosPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"todos" | PedidoStatus>("todos");
  const [selectedDateFilter, setSelectedDateFilter] = useState<
    Date | undefined
  >(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const loadPedidos = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getPedidos(); // Asumiendo que getPedidos no necesita filtros aquí
      setPedidos(response);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los pedidos"
      );
    } finally {
      setLoading(false);
    }
  }, [authorized]); // Dependencia de authorized

  useEffect(() => {
    if (!authorized) return;
    loadPedidos();
  }, [authorized, loadPedidos]);

  const filteredPedidos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let filtered = pedidos;

    // Filtrar por estado
    if (selectedStatus !== "todos") {
      filtered = filtered.filter((pedido) => getPedidoStatusString(pedido.estado) === selectedStatus);
    }

    // Filtrar por fecha
    if (selectedDateFilter) {
      const filterDateString = selectedDateFilter.toDateString();
      filtered = filtered.filter((pedido) => {
        if (!pedido.creadoEn) return false;
        const pedidoDate = new Date(pedido.creadoEn);
        return pedidoDate.toDateString() === filterDateString;
      });
    }

    // Filtrar por término de búsqueda
    if (term) {
      filtered = filtered.filter((pedido) => {
        const usuarioNombre = (typeof pedido.usuario === "object" &&
          pedido.usuario !== null &&
          "nombre" in pedido.usuario)
          ? (pedido.usuario as any).nombre
          : pedido.usuarioNombre ?? "";
        const usuarioCodigo = (typeof pedido.usuario === "object" &&
          pedido.usuario !== null &&
          "codigoUsu" in pedido.usuario)
          ? (pedido.usuario as any).codigoUsu
          : pedido.usuarioId ?? "";
        const pedidoItems = pedido.items
          .map((item) => item.nombre)
          .filter(Boolean)
          .join(" ");
        const codigoComprobacion = pedido.codigoComprobacion ?? "";

        const valuesToSearch = [
          pedido._id?.toString(), // Número de pedido (ID)
          usuarioNombre,
          usuarioCodigo,
          pedidoItems,
          codigoComprobacion,
        ].filter(Boolean).join(" ").toLowerCase();

        return valuesToSearch.includes(term);
      });
    }

    return filtered;
  }, [pedidos, searchTerm, selectedStatus, selectedDateFilter]);

  const handleUpdateStatus = useCallback(
    async (pedidoId: string, currentStatus: PedidoStatus) => {
      // Lógica para cambiar el estado del pedido
      // Por ejemplo, de 'pendiente' a 'confirmado'
      let newStatus: PedidoStatus | undefined;
      if (currentStatus === 'pendiente') {
        newStatus = 'confirmado';
      } else if (currentStatus === 'confirmado') {
        newStatus = 'recogido';
      } else if (currentStatus === 'recogido') {
        newStatus = 'finalizado';
      }

      if (!newStatus) return;

      // Actualización optimista
      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido._id === pedidoId ? { ...pedido, estado: newStatus } : pedido
        )
      );

      try {
        await updatePedidoStatus(pedidoId, newStatus!);
      } catch (err) {
        console.error("Error al actualizar estado del pedido:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al actualizar el estado del pedido"
        );
        // Revertir si falla la API
        setPedidos((prevPedidos) =>
          prevPedidos.map((pedido) =>
            pedido._id === pedidoId ? { ...pedido, estado: currentStatus } : pedido
          )
        );
      }
    },
    []
  );

  const handleAddPedido = () => {
    setIsAddModalOpen(true);
  };

  const handlePedidoCreated = (newPedido: PedidoResponse) => {
    setPedidos((prev) => [newPedido, ...prev]);
    setIsAddModalOpen(false);
  };


  if (checkingAuth) {
    return <LoadingView />;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-8">
      <AddPedidoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPedidoCreated={handlePedidoCreated}
      />
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Pedidos
          </h1>
          <Button
            onClick={handleAddPedido}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Pedido
          </Button>
        </div>

        {/* Botones de estado */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {["todos", "pendiente", "confirmado", "recogido", "finalizado"].map(
            (status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() =>
                  setSelectedStatus(
                    status as typeof selectedStatus
                  )
                }
                className="capitalize flex-shrink-0"
              >
                {status === "pendiente" ? "Por Confirmar" : status}
              </Button>
            )
          )}
        </div>

        {/* Filtros de búsqueda y fecha */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 max-w-md">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nº pedido, usuario, plato..."
            />
          </div>
          <div className="flex items-center gap-2">
            <DatePicker date={selectedDateFilter} setDate={setSelectedDateFilter} />
            <Button variant="ghost" onClick={() => setSelectedDateFilter(undefined)} disabled={!selectedDateFilter} className="h-9 w-9 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : pedidos.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron pedidos.
          </div>
        ) : filteredPedidos.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron coincidencias para los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    N° Pedido
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Cód. Comprobación
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPedidos.map((pedido) => (
                  <tr key={pedido._id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {pedido._id?.slice(-6).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {(typeof pedido.usuario === "object" && pedido.usuario !== null && "nombre" in pedido.usuario)
                          ? (pedido.usuario as any).nombre
                          : pedido.usuarioNombre}
                      </div>
                      <p className="text-xs text-foreground-secondary">
                        {(typeof pedido.usuario === "object" && pedido.usuario !== null && "codigoUsu" in pedido.usuario)
                          ? (pedido.usuario as any).codigoUsu
                          : pedido.usuarioId}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {pedido.items.map((item) => item.nombre).join(", ")}
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground-secondary">
                      {pedido.items.map((item) => item.tipo).filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {pedido.codigoComprobacion ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {pedido.creadoEn ? format(new Date(pedido.creadoEn), "dd/MM/yyyy HH:mm", { locale: es }) : "-"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span 
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          getPedidoStatusString(pedido.estado) === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : getPedidoStatusString(pedido.estado) === "confirmado"
                            ? "bg-blue-100 text-blue-800"
                            : getPedidoStatusString(pedido.estado) === "recogido"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getPedidoStatusString(pedido.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {['pendiente', 'confirmado', 'recogido'].includes(getPedidoStatusString(pedido.estado)) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateStatus(pedido._id!, getPedidoStatusString(pedido.estado))}
                          title={`Marcar como ${
                            pedido.estado === 'pendiente' ? 'confirmado'
                            : pedido.estado === 'confirmado' ? 'recogido'
                            : 'finalizado'
                          }`}
                        >
                          <Check className="h-5 w-5 text-green-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
