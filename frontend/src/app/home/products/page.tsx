"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {useRouter} from "next/navigation";
import {
  crearProducto,
  getPlatosMenu,
  crearMenu,
  actualizarProducto,
  getSedes,
  type CrearProductoPayload,
  type PlatoMenuItem,
  type SedeItem,
} from "@/lib/api";
import CreateMenuForm from "./create-menu-form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE_CATEGORIES: Array<PlatoMenuItem["tipo"]> = [
  "bebida",
  "postre",
  "piqueo",
  "entrada",
];

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

export default function ProductsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [platos, setPlatos] = useState<PlatoMenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSede, setSelectedSede] = useState("Todas");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CrearProductoPayload>(
    createEmptyProductForm()
  );
  const [sedes, setSedes] = useState<SedeItem[]>([]);

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

  const loadPlatos = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getPlatosMenu();
      setPlatos(response);
    } catch (err) {
      console.error("Error al cargar platos:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los productos"
      );
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  const loadSedes = useCallback(async () => {
    if (!authorized) return;
    try {
      const response = await getSedes();
      setSedes(response);
    } catch (err) {
      console.error("Error al cargar sedes:", err);
    }
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    loadPlatos();
    loadSedes();
  }, [authorized, loadPlatos, loadSedes]);

  // Sedes disponibles para selección
  const sedeOptions = useMemo(
    () => sedes.map((s) => s.nombre),
    [sedes]
  );

  const categoryOptions = useMemo(() => {
    const categorias = new Set<string>(BASE_CATEGORIES);
    platos.forEach((plato) => {
      if (plato.tipo) {
        categorias.add(plato.tipo);
      }
    });
    return Array.from(categorias).sort((a, b) => a.localeCompare(b));
  }, [platos]);

  const filteredPlatos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return platos
      .filter((plato) => {
        if (selectedSede !== "Todas" && plato.sede !== selectedSede) {
          return false;
        }
        if (selectedCategory !== "Todos" && plato.tipo !== selectedCategory) {
          return false;
        }
        if (!term) return true;
        const haystack = `${plato.nombre} ${plato.descripcion ?? ""} ${
          plato.sede ?? ""
        } ${plato.tipo}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [platos, searchTerm, selectedSede, selectedCategory]);

  const handleFormInput = (
    field: keyof CrearProductoPayload,
    value: string | number | boolean
  ) => {
    setFormState((prev) => ({...prev, [field]: value}));
  };

  const handleProductInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target;
    const {name} = target;
    if (!name) return;

    if (target instanceof HTMLInputElement) {
      if (target.type === "number") {
        const parsed = Number(target.value);
        handleFormInput(
          name as keyof CrearProductoPayload,
          Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
        );
        return;
      }
      if (target.type === "checkbox") {
        handleFormInput(name as keyof CrearProductoPayload, target.checked);
        return;
      }
    }

    handleFormInput(name as keyof CrearProductoPayload, target.value);
  };

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!formState.nombre || !formState.sede || !formState.tipo) {
      setFormError("Completa los campos obligatorios marcados con *");
      return;
    }

    if (typeof formState.stock !== "number" || Number.isNaN(formState.stock)) {
      setFormError("Ingresa un stock válido");
      return;
    }

    setIsCreating(true);
    try {
      await crearProducto(formState);
      setSuccessMessage(`Producto ${formState.nombre} añadido correctamente.`);
      setShowAddModal(false);
      setFormState(createEmptyProductForm());
      await loadPlatos();
    } catch (err) {
      console.error("Error al crear producto:", err);
      setFormError(
        err instanceof Error ? err.message : "No se pudo registrar el producto"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openAddModal = () => {
    setFormError(null);
    setShowAddModal(true);
    setFormState(createEmptyProductForm());
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError(null);
  };

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
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de productos
          </h1>
          <p className="text-sm text-foreground-secondary">
            Gestiona los platos disponibles y mantén el inventario actualizado.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-64 max-w-md">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, sede o categoría"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedSede} onValueChange={setSelectedSede}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Seleccionar sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {sedeOptions.map((sede) => (
                  <SelectItem key={sede} value={sede}>
                    {sede}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas</SelectItem>
                {categoryOptions.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={openAddModal}>Añadir producto</Button>
            <Button onClick={() => setShowCreateMenuModal(true)} className="bg-primary text-white hover:bg-primary/90">Crear menú</Button>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : platos.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron productos registrados.
          </div>
        ) : filteredPlatos.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron coincidencias para "{searchTerm}".
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPlatos.map((plato) => {
              const key = plato._id ?? plato.nombre;
              const imageSrc = plato.imagenUrl ?? "";
              return (
                <article
                  key={key}
                  className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-smooth hover:shadow-lg"
                >
                  {imageSrc && (
                    <div className="mb-4 h-40 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={imageSrc}
                        alt={plato.nombre}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {plato.nombre}
                        </h3>
                        <p className="text-xs uppercase text-foreground-secondary">
                          {typeof (plato.sede as any) === "object" &&
                          (plato.sede as any) !== null
                            ? (plato.sede as any).nombre
                            : plato.sede ?? "General"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex min-w-[88px] justify-center rounded-full px-3 py-1 text-xs font-medium ${
                            plato.activo
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {plato.activo ? "Activo" : "Inactivo"}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              // disable while toggling by simple optimistic UI
                              const next = !plato.activo;
                              await actualizarProducto(plato._id, {
                                activo: next,
                              });
                              // refresh list
                              await loadPlatos();
                            } catch (err) {
                              console.error(
                                "Error al cambiar estado del producto:",
                                err
                              );
                            }
                          }}
                          className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted/30"
                        >
                          {plato.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>

                    {plato.descripcion && (
                      <p className="line-clamp-3 text-sm text-foreground-secondary">
                        {plato.descripcion}
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-medium text-foreground-secondary">
                      <span className="rounded-full bg-muted px-2 py-1 capitalize">
                        {plato.tipo}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-1">
                        Stock: {plato.stock}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Añadir producto
              </h2>
              <button
                onClick={closeAddModal}
                className="text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nombre*
                  </label>
                  <Input
                    name="nombre"
                    value={formState.nombre}
                    onChange={handleProductInputChange}
                    placeholder="Ej. Lomo saltado"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Sede*
                  </label>
                  <Select
                    value={formState.sede ?? ""}
                    onValueChange={(value) => handleFormInput("sede", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Seleccionar</SelectItem>
                      {sedes.map((sede) => (
                        <SelectItem key={sede._id} value={sede._id}>
                          {sede.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Categoría*
                  </label>
                  <Select
                    value={formState.tipo}
                    onValueChange={(value) =>
                      handleFormInput("tipo", value as PlatoMenuItem["tipo"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Stock*
                  </label>
                  <Input
                    name="stock"
                    type="number"
                    min={0}
                    value={formState.stock}
                    onChange={handleProductInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Precio unitario (S/)
                  </label>
                  <Input
                    name="precio"
                    type="number"
                    step="0.01"
                    min={0}
                    value={formState.precio ?? 0}
                    onChange={handleProductInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tipo de venta
                  </label>
                  <Select
                    value={formState.tipoMenu ?? "carta"}
                    onValueChange={(value) =>
                      handleFormInput("tipoMenu", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carta">Plato a la carta</SelectItem>
                      <SelectItem value="menu">Plato de menú</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formState.descripcion ?? ""}
                    onChange={handleProductInputChange}
                    placeholder="Detalles del plato"
                    className="w-full min-h-24 resize-y rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    URL de imagen
                  </label>
                  <Input
                    name="imagenUrl"
                    value={formState.imagenUrl ?? ""}
                    onChange={handleProductInputChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formState.activo ?? true}
                      onChange={handleProductInputChange}
                      className="h-4 w-4 rounded border-border"
                    />
                    Producto activo
                  </label>
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAddModal}
                  className="border-border text-foreground"
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {/* Contenedor del modal con altura máxima y flex-col */}
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            {/* Cabecera fija */}
            <div className="p-6 border-b border-border flex-shrink-0">
              <h2 className="text-xl font-semibold text-foreground">Crear menú</h2>
              <button
                onClick={() => setShowCreateMenuModal(false)}
                className="absolute top-4 right-4 text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            {/* Área de contenido deslizable */}
            <div className="overflow-y-auto p-6">
              <CreateMenuForm
                platos={platos}
                sedeOptions={sedeOptions}
                onCancel={() => setShowCreateMenuModal(false)}
                onCreated={async () => {
                  setShowCreateMenuModal(false);
                  await loadPlatos();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function createEmptyProductForm(): CrearProductoPayload {
  return {
    nombre: "",
    descripcion: "",
    tipo: BASE_CATEGORIES[0],
    sede: "",
    stock: 0,
    precio: 0,
    tipoMenu: "carta",
    imagenUrl: "",
    activo: true,
  };
}
