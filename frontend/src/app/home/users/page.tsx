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
  crearUsuario,
  getUsuarios,
  type CrearUsuarioPayload,
  type UsuarioItem,
} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
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

export default function UsersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<CrearUsuarioPayload>(
    createEmptyUserForm()
  );

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

  const loadUsuarios = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getUsuarios({activo: true});
      setUsuarios(response.filter((usuario) => usuario.activo));
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los usuarios"
      );
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    loadUsuarios();
  }, [authorized, loadUsuarios]);

  const filteredUsuarios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return usuarios;

    return usuarios.filter((usuario) => {
      const values = [
        usuario.nombre,
        typeof usuario.rol === "string" ? usuario.rol : "",
        usuario.tipo,
        usuario.codigoUsu,
        usuario.dni,
      ];

      return values.some((value) =>
        value ? value.toLowerCase().includes(term) : false
      );
    });
  }, [usuarios, searchTerm]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    usuarios.forEach((usuario) => {
      if (usuario?.rol) roles.add(String(usuario.rol));
    });
    return Array.from(roles).sort((a, b) => (a ?? "").localeCompare(b ?? ""));
  }, [usuarios]);

  const typeOptions = useMemo(() => {
    // Backend expects 'interno' or 'externo'
    const tipos = ["interno", "externo"];
    return Array.from(tipos).sort((a, b) => a.localeCompare(b));
  }, [usuarios]);
  const handleFormInput = (field: keyof CrearUsuarioPayload, value: string) => {
    setFormState((prev) => ({...prev, [field]: value}));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const {name, value} = event.target;
    handleFormInput(name as keyof CrearUsuarioPayload, value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    

    const nombre = formState.nombre.trim();
    const codigo = formState.codigoUsu.trim().toLowerCase();
    const dni = formState.dni.trim().toLowerCase();
    const password = formState.password.trim();

    if (!nombre || !password) {
      setFormError("Completa los campos obligatorios marcados con *");
      return;
    }

    if (!formState.rol || !formState.tipo) {
      setFormError("Selecciona el rol y el tipo de usuario");
      return;
    }

    if (!codigo && !dni) {
      setFormError("Ingresa al menos un identificador (código o DNI)");
      return;
    }

    setIsCreating(true);
    try {
      const created = await crearUsuario({
        ...formState,
        nombre,
        codigoUsu: codigo,
        dni,
        password,
      });
      setShowAddModal(false);
      setFormState(createEmptyUserForm());
      setSuccessMessage(`Usuario ${created.nombre} agregado correctamente.`);
      await loadUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      setFormError(
        err instanceof Error ? err.message : "No se pudo crear el usuario"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openAddModal = () => {
    setFormError(null);
    setShowAddModal(true);
    setFormState(createEmptyUserForm());
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
            Gestión de usuarios
          </h1>
          <p className="text-sm text-foreground-secondary">
            Listado de usuarios con acceso vigente al sistema.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-64 max-w-md">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, rol, correo o identificador"
            />
          </div>
          <Button
            onClick={openAddModal}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Agregar usuario
          </Button>
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
        ) : usuarios.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron usuarios activos.
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-foreground-secondary">
            No se encontraron coincidencias para "{searchTerm}".
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground-secondary">
                    Identificador
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario._id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{`${
                        (usuario.dni as any)?.nombres ?? ""
                      } ${(usuario.dni as any)?.apellidos ?? ""}`}</div>
                      <p className="text-xs text-foreground-secondary">
                        {(usuario.dni as any)?.numero ??
                          usuario.codigoUsu ??
                          "Sin identificador"}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground-secondary">
                      {typeof usuario.rol === "object" && usuario.rol !== null
                        ? (usuario.rol as any).nombre
                        : usuario.rol}
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground-secondary">
                      {usuario.tipo}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary">
                      {usuario.codigoUsu ??
                        (usuario.dni as any)?.numero ??
                        "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Agregar usuario
              </h2>
              <button
                onClick={closeAddModal}
                className="text-foreground-secondary hover:text-foreground transition-smooth text-2xl"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nombre completo
                  </label>
                  <Input
                    name="nombre"
                    value={formState.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej. Ana Salazar"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Código
                  </label>
                  <Input
                    name="codigoUsu"
                    value={formState.codigoUsu}
                    onChange={handleInputChange}
                    placeholder="usuario@dominio.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Rol
                  </label>
                  <Select
                    value={formState.rol}
                    onValueChange={(value) => handleFormInput("rol", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((rol) => (
                        <SelectItem key={rol} value={rol}>
                          {rol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tipo
                  </label>
                  <Select
                    value={formState.tipo}
                    onValueChange={(value) => handleFormInput("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Identificador (DNI o código)
                  </label>
                  <Input
                    name="dni"
                    value={formState.dni}
                    onChange={handleInputChange}
                    placeholder="Código UTP o DNI"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Contraseña temporal*
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={formState.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                  />
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
    </div>
  );
}

function createEmptyUserForm(): CrearUsuarioPayload {
  return {
    nombre: "",
    password: "",
    tipo: "",
    codigoUsu: "",
    dni: "",
    rol: "",
  };
}
