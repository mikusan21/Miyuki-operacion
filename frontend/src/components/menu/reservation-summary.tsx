"use client";

import {useEffect, useMemo, useState, type ChangeEvent} from "react";
import {format} from "date-fns";
import {es} from "date-fns/locale";
import type {DisplayMenuItem} from "@/components/menu/menu-grid";
import {Input} from "@/components/ui/input";
import type {
  PedidoResponse,
  UsuarioPerfil,
  PlatoMenuItem as BasePlatoMenuItem,
} from "@/lib/api";
import {crearPedido, registrarEncuesta, getPlatosMenu} from "@/lib/api";

interface ReservationSummaryProps {
  reservation: DisplayMenuItem;
  onClose: () => void;
  onOrderCreated?: (pedido: PedidoResponse) => void;
  currentUser?: UsuarioPerfil | null;
}

type SedeObject = {
  _id: string;
  nombre: string;
  direccion?: string;
};

// Extendemos el tipo base para incluir las propiedades que faltan
type PlatoMenuItem = BasePlatoMenuItem & {
  tipo: "entrada" | "segundo" | "postre" | "bebida" | "plato" | "piqueo";
  sede: string | SedeObject;
  activo: boolean;
};

type ExecutiveSelection = {
  entrada?: string;
  segundo?: string;
  postre?: string;
  bebida?: string;
};

export default function ReservationSummary({
  reservation,
  onClose,
  onOrderCreated,
  currentUser,
}: ReservationSummaryProps) {
  const [executiveSelection, setExecutiveSelection] =
    useState<ExecutiveSelection>({});
  const [surveySelection, setSurveySelection] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [surveyFeedback, setSurveyFeedback] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [scheduledDate, setScheduledDate] = useState<string>("");

  const menu = reservation.menu;
  const isCoordinator = currentUser?.rol === "coordinador";
  const maxQuantity = isCoordinator ? 100 : 5;
  const todayISO = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Solución para el error 'never': Normalizar el nombre de la sede.
  const sedeAsAny = menu.sede as any;
  const sedeId = useMemo(() => (typeof sedeAsAny === "object" ? sedeAsAny._id : sedeAsAny), [sedeAsAny]);
  const sedeNombre = useMemo(() => {
    if (typeof sedeAsAny === "object" && sedeAsAny !== null) {
      return sedeAsAny.nombre;
    }
    return sedeAsAny;
  }, [sedeAsAny]);

  const formattedDate = useMemo(() => {
    if (!scheduledDate) {
      try {
        return format(new Date(menu.fecha), "PPP", {locale: es});
      } catch (error) {
        return "Fecha no disponible";
      }
    }

    try {
      return format(new Date(scheduledDate), "PPP", {locale: es});
    } catch (error) {
      return "Fecha no disponible";
    }
  }, [menu.fecha, scheduledDate]);

  const total = useMemo(
    () => reservation.price * quantity,
    [reservation.price, quantity]
  );

  useEffect(() => {
    // Inicializar selección tanto para menú ejecutivo como normal
    if (reservation.variant === "ejecutivo") {
      setExecutiveSelection({
        entrada: menu.ejecutivo.entradas?.[0]?._id,
        segundo: menu.ejecutivo.segundos?.[0]?._id,
        postre: menu.ejecutivo.postres?.[0]?._id,
        bebida: menu.ejecutivo.bebidas?.[0]?._id,
      });
    } else {
      // Para menús 'normal' construimos selecciones a partir de los platos fijos
      setExecutiveSelection({
        entrada: menu.normal?.entrada?._id,
        segundo: menu.normal?.segundo?._id,
        bebida: menu.normal?.bebida?._id,
      });
    }
    setSurveySelection([]);
    setFeedback(null);
    setSurveyFeedback(null);
    try {
      const initial = format(new Date(menu.fecha), "yyyy-MM-dd");
      setScheduledDate(initial);
    } catch (error) {
      setScheduledDate("");
    }
    setQuantity(1);
  }, [menu.ejecutivo, menu.fecha, reservation]);

  const handleExecutiveSelect = (
    field: keyof ExecutiveSelection,
    value: string
  ) => {
    setExecutiveSelection((prev) => ({...prev, [field]: value}));
  };

  const handleSurveyChange = (option: string) => {
    setSurveySelection((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      }
      return [...prev, option];
    });
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => {
      const next = Math.max(1, Math.min(maxQuantity, prev + delta));
      return next;
    });
  };

  const handleQuantityInput = (event: ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target;
    if (value === "") {
      setQuantity(1);
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }

    const normalized = Math.floor(parsed);
    const clamped = Math.max(1, Math.min(maxQuantity, normalized));
    setQuantity(clamped);
  };

  const handleCreateOrder = async () => {
    if (quantity < 1) {
      setFeedback("Selecciona una cantidad válida");
      return;
    }

    const menuId = reservation.menuId;
    if (!menuId) {
      setFeedback("No se pudo identificar el menú seleccionado.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const pedido = await crearPedido({
        sede: sedeId,
        fechaEntrega: scheduledDate || undefined,
        items: [
          {
            refId: menuId,
            tipo: "menu",
            cantidad: quantity,
            precioUnitario: reservation.price,
          },
        ],
      });

      setFeedback("Reserva creada correctamente");
      onOrderCreated?.(pedido);
    } catch (error) {
      console.error("Error al crear reserva:", error);
      setFeedback(
        error instanceof Error ? error.message : "No se pudo crear la reserva"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSurveySubmit = async () => {
    if (!surveySelection.length) {
      setSurveyFeedback("Selecciona al menos una opción antes de votar");
      return;
    }

    const menuId = reservation.menuId;
    if (!menuId) {
      setSurveyFeedback("No se pudo registrar tu voto en este momento.");
      return;
    }

    setSurveySubmitting(true);
    setSurveyFeedback(null);
    try {
      await registrarEncuesta(menuId, surveySelection);
      setSurveyFeedback("¡Gracias por votar!");
    } catch (error) {
      console.error("Error al registrar encuesta:", error);
      setSurveyFeedback(
        error instanceof Error ? error.message : "No se pudo registrar tu voto"
      );
    } finally {
      setSurveySubmitting(false);
    }
  };

  const executiveOptions = useMemo(
    () => menu.ejecutivo ?? {entradas: [], segundos: [], postres: [], bebidas: []},
    [menu.ejecutivo]
  );

  // Para menús 'normal' convertimos los campos individuales en arrays
  const [normalPool, setNormalPool] =
    useState<{
      entradas: PlatoMenuItem[];
      segundos: PlatoMenuItem[];
      postres: PlatoMenuItem[];
      bebidas: PlatoMenuItem[];
    }>({entradas: [], segundos: [], postres: [], bebidas: []});

  // Construir opciones para normal a partir del pool de platos por sede o del menú actual como fallback
  const normalOptions = useMemo(
    () => ({
      entradas:
        normalPool.entradas.length > 0
          ? normalPool.entradas
          : menu.normal?.entrada
            ? ([{ ...menu.normal.entrada }] as PlatoMenuItem[])
            : [],
      segundos:
        normalPool.segundos.length > 0
          ? normalPool.segundos
          : menu.normal?.segundo
            ? ([{ ...menu.normal.segundo }] as PlatoMenuItem[])
            : [],
      postres: normalPool.postres,
      bebidas:
        normalPool.bebidas.length > 0
          ? normalPool.bebidas
          : menu.normal?.bebida
            ? ([{ ...menu.normal.bebida }] as PlatoMenuItem[])
            : [],
    }),
    [normalPool, menu.normal]
  );

  const selectionOptions = useMemo(
    () =>
      reservation.variant === "ejecutivo"
        ? executiveOptions
        : normalOptions,
    [reservation.variant, executiveOptions, normalOptions]
  );

  // Asegurar que siempre haya un valor seleccionado cuando existan opciones
  useEffect(() => {
    setExecutiveSelection((prev) => {
      const next = {...prev};
      const ensure = (
        key: keyof ExecutiveSelection,
        options: Array<{_id: string; nombre: string}>
      ) => {
        if (!options.length) return;
        if (!next[key] || !options.some((opt) => opt._id === next[key])) {
          next[key] = options[0]._id;
        }
      };
      ensure("entrada", selectionOptions.entradas);
      ensure("segundo", selectionOptions.segundos);
      ensure("postre", selectionOptions.postres);
      ensure("bebida", selectionOptions.bebidas);
      return next;
    });
  }, [
    selectionOptions.entradas,
    selectionOptions.segundos,
    selectionOptions.postres,
    selectionOptions.bebidas,
  ]);

  // Cargar pool de platos (solo para menús 'normal')
  useEffect(() => {
    let mounted = true;
    async function loadPlatos() {
      if (reservation.variant !== "normal") return;
      try {
        const platos = (await getPlatosMenu({
          sede: sedeId,
        })) as PlatoMenuItem[];
        if (!mounted) return;
        // Filtrar por sede y activos
        const filtered = platos.filter(
          (p) =>
            (typeof (p.sede as any) === "object" ? (p.sede as any)._id : p.sede) === sedeId && p.activo
        );
        const entradas = filtered.filter((p: PlatoMenuItem) => p.tipo === "entrada");
        const segundos = filtered.filter((p: PlatoMenuItem) => p.tipo === "segundo");
        const postres = filtered.filter((p: PlatoMenuItem) => p.tipo === "postre");
        const bebidas = filtered.filter((p: PlatoMenuItem) => p.tipo === "bebida");
        setNormalPool({entradas, segundos, postres, bebidas});
      } catch (error) { 
        console.error("Error cargando platos para opciones normales:", error);
      }
    }

    loadPlatos();
    return () => {
      mounted = false;
    };
  }, [reservation.variant, sedeId]); // Usar sedeId en las dependencias

  return (
    <aside className="w-96 bg-white border-l border-border overflow-auto p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Resumen de reserva
        </h2>
        <button
          onClick={onClose}
          className="text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
          aria-label="Cerrar resumen de reserva"
        >
          ✕
        </button>
      </div>

      {/* Mostrar campos de selección para ambos tipos de menú */}
      <div className="space-y-4 mb-6">
        <SelectField
          label="Seleccionar entrada"
          value={executiveSelection.entrada ?? ""}
          options={selectionOptions.entradas}
          onChange={(value) => handleExecutiveSelect("entrada", value)}
        />
        <SelectField
          label="Seleccionar segundo"
          value={executiveSelection.segundo ?? ""}
          options={selectionOptions.segundos}
          onChange={(value) => handleExecutiveSelect("segundo", value)}
        />
        {selectionOptions.postres.length > 0 && (
          <SelectField
            label="Seleccionar postre"
            value={executiveSelection.postre ?? ""}
            options={selectionOptions.postres}
            onChange={(value) => handleExecutiveSelect("postre", value)}
          />
        )}
        <SelectField
          label="Seleccionar bebida"
          value={executiveSelection.bebida ?? ""}
          options={selectionOptions.bebidas}
          onChange={(value) => handleExecutiveSelect("bebida", value)}
        />
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Cantidad a reservar
          </label>
          <div className="mt-2 flex items-center rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => adjustQuantity(-1)}
              className="h-11 w-11 bg-background-secondary text-lg font-semibold text-foreground hover:bg-background transition-smooth"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityInput}
              className="h-11 w-full border-0 text-center text-base font-semibold"
            />
            <button
              type="button"
              onClick={() => adjustQuantity(1)}
              className="h-11 w-11 bg-background-secondary text-lg font-semibold text-foreground hover:bg-background transition-smooth"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-xs text-foreground-secondary">
            {isCoordinator
              ? `Puedes solicitar hasta ${maxQuantity} unidades por pedido.`
              : `Máximo ${maxQuantity} unidades por pedido.`}
          </p>
        </div>

        {isCoordinator && (
          <div>
            <label className="block text-sm font-medium text-foreground">
              Programar fecha de entrega
            </label>
            <Input
              type="date"
              value={scheduledDate || ""}
              min={todayISO}
              onChange={(event) => setScheduledDate(event.target.value)}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-foreground-secondary">
              Selecciona la fecha en la que se requiere el pedido masivo.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6 pb-6 border-b border-border text-sm">
        <InfoRow label="Menú" value={reservation.title} />
        <InfoRow label="Comedor" value={menu.sedeNombre ?? sedeNombre} />
        <InfoRow label="Fecha" value={formattedDate} />
        <InfoRow
          label="Cantidad"
          value={`${quantity} unidad${quantity === 1 ? "" : "es"}`}
        />
      </div>

      <div className="flex justify-between items-center mb-6 pb-6 border-b border-border">
        <span className="text-foreground-secondary">Subtotal:</span>
        <span className="text-xl font-bold text-primary">
          S/ {total.toFixed(2)}
        </span>
      </div>

      {feedback && (
        <div className="mb-4 px-4 py-2 bg-background-secondary rounded-lg text-sm text-foreground">
          {feedback}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <button
          onClick={handleCreateOrder}
          disabled={isSubmitting}
          className="w-full bg-error hover:bg-error/90 text-white font-semibold py-3 rounded-lg transition-smooth disabled:opacity-60"
        >
          {isSubmitting ? "Generando reserva..." : "Proceder al pago"}
        </button>
        <button
          onClick={onClose}
          className="w-full bg-error/20 hover:bg-error/30 text-error font-semibold py-3 rounded-lg transition-smooth"
        >
          Seguir comprando
        </button>
      </div>

      <div className="bg-background-secondary rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Encuesta rápida</h3>
        <p className="text-sm text-foreground-secondary mb-4">
          Porque nos importa tu opinión
        </p>
        <p className="text-sm font-medium text-foreground mb-4">
          ¿Qué plato te gustaría que incluyamos la próxima semana?
        </p>

        <div className="space-y-3 mb-4">
          {buildSurveyOptions(menu).map((option) => (
            <label
              key={option}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={surveySelection.includes(option)}
                onChange={() => handleSurveyChange(option)}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>

        {surveyFeedback && (
          <p className="text-xs text-foreground-secondary mb-2">
            {surveyFeedback}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setSurveySelection([])}
            className="flex-1 bg-warning hover:bg-warning/90 text-foreground font-semibold py-2 rounded-lg transition-smooth text-sm"
          >
            Limpiar
          </button>
          <button
            onClick={handleSurveySubmit}
            disabled={surveySubmitting}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg transition-smooth text-sm disabled:opacity-60"
          >
            {surveySubmitting ? "Enviando..." : "Votar"}
          </button>
        </div>
      </div>
    </aside>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{_id: string; nombre: string}>;
  onChange: (value: string) => void;
}

function SelectField({label, value, options, onChange}: SelectFieldProps) {
  const hasOptions = options.length > 0;

  return (
    <label className="block text-sm font-medium text-foreground">
      <span className="mb-2 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!hasOptions}
        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer disabled:cursor-not-allowed"
      >
        {hasOptions ? (
          options.map((option) => (
            <option key={option._id} value={option._id}>
              {option.nombre}
            </option>
          ))
        ) : (
          <option value="">No disponible</option>
        )}
      </select>
    </label>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({label, value}: InfoRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground-secondary">{label}:</span>
      <span className="font-medium text-foreground text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function buildSurveyOptions(menu: DisplayMenuItem["menu"]): string[] {
  const opciones = new Set<string>();

  const addNombre = (plato?: {nombre?: string}) => {
    if (plato?.nombre) {
      opciones.add(plato.nombre);
    }
  };

  addNombre(menu.normal.entrada);
  addNombre(menu.normal.segundo);
  addNombre(menu.normal.bebida);

  (menu.ejecutivo?.entradas ?? []).forEach(addNombre);
  (menu.ejecutivo?.segundos ?? []).forEach(addNombre);
  (menu.ejecutivo?.postres ?? []).forEach(addNombre);
  (menu.ejecutivo?.bebidas ?? []).forEach(addNombre);

  return Array.from(opciones);
}
