const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_STORAGE_KEY = "authToken";

let inMemoryToken: string | null = null;

function setAuthToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

function getAuthToken() {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  if (typeof window === "undefined") {
    return null;
  }
  const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  inMemoryToken = storedToken;
  return storedToken;
}

type RequestOptions = RequestInit & {parseJson?: boolean};

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    parseJson = true,
    headers,
    body,
    ...rest
  } = options as RequestOptions & {
    body?: BodyInit | null;
  };

  const mergedHeaders = new Headers(headers as HeadersInit | undefined);
  const token = getAuthToken();
  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const hasBody = typeof body !== "undefined" && body !== null;
  const isFormData =
    typeof FormData !== "undefined" && hasBody && body instanceof FormData;

  if (hasBody && !isFormData && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
    } catch (err) {
      // ignore JSON parsing errors
    }

    let message: unknown = response.statusText;

    if (errorBody && typeof errorBody === "object") {
      const bodyRecord = errorBody as Record<string, unknown>;
      message = bodyRecord.error ?? bodyRecord.message ?? message;
    }

    if (!message) {
      message = "Error en la petición";
    }

    throw new Error(String(message));
  }

  if (!parseJson) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface LoginResponse {
  id: string;
  identificador: string;
  rol: string;
  token: string;
}

export interface LoginMfaChallenge {
  id: string;
  identificador: string;
  rol: string;
  mfaRequired: true;
  mfaToken: string;
}

export type LoginResult = LoginResponse | LoginMfaChallenge;

export interface UsuarioPerfil {
  id: string;
  nombre: string;
  rol: string;
  codigoUsu?: string;
  dni?: string;
  tipo: string;
  sede?: string;
  sedeNombre?: string | null;
  mfaEnabled?: boolean;
}

export interface PopulatedPlatoMenu {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  imagenUrl?: string;
  activo: boolean;
}

export interface PopulatedMenu {
  _id?: string;
  id?: string;
  fecha: string;
  sede: string;
  sedeNombre?: string | null;
  precioNormal: number;
  precioEjecutivo: number;
  normal: {
    entrada: PopulatedPlatoMenu;
    segundo: PopulatedPlatoMenu;
    bebida: PopulatedPlatoMenu;
  };
  ejecutivo: {
    entradas: PopulatedPlatoMenu[];
    segundos: PopulatedPlatoMenu[];
    postres: PopulatedPlatoMenu[];
    bebidas: PopulatedPlatoMenu[];
  };
  activo: boolean;
}

export interface PedidoResponse {
  _id: string;
  usuario: { _id: string; nombre: string; codigoUsu?: string; correo?: string } | string; // Puede ser poblado o solo ID
  usuarioNombre?: string;
  usuarioCorreo?: string;
  usuarioId?: string;
  sede: string | {_id?: string; nombre?: string; direccion?: string};
  items: Array<{
    refId: string;
    tipo: string;
    cantidad: number;
    precioUnitario: number;
    nombre?: string;
    imagenUrl?: string;
  }>;
  total: number;
  estado: PedidoStatus | {_id?: string; nombre?: string};
  metodoPago: string | {_id?: string; nombre?: string};
  codigoComprobacion?: string;
  creadoEn: string;
}

export type PedidoStatus =
  | "pendiente"
  | "confirmado"
  | "recogido"
  | "finalizado"
  | "cancelado";

export interface FavoritoMenu {
  tipo: "menu";
  refId: string;
  menu: PopulatedMenu;
}

export interface FavoritoCarta {
  tipo: "carta";
  refId: string;
  plato: {
    _id: string;
    nombre: string;
    descripcion?: string;
    categoria: string;
    precio: number;
    imagenUrl?: string;
  };
}

export type FavoritoResponse = FavoritoMenu | FavoritoCarta;

export interface PlatoMenuItem {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo: "plato" | "bebida" | "postre" | "piqueo" | "entrada" | "segundo";
  imagenUrl?: string;
  sede?: string;
  stock: number;
  activo: boolean;
}

export interface UsuarioItem {
  _id: string;
  nombre: string;
  rol: string;
  tipo: string;
  codigoUsu?: string;
  dni?: string;
  sede?: string;
  correo?: string;
  activo: boolean;
}

export interface SedeItem {
  _id: string;
  nombre: string;
  direccion?: string;
}

export interface EncuestaOpcionResultado {
  opcionId: string;
  nombre: string;
  tipo: string | null;
  votos: number;
}

export interface EncuestaMenuResultado {
  menuId: string;
  fecha: string;
  sede: string;
  totalEncuestas: number;
  opciones: EncuestaOpcionResultado[];
}

export function isMfaChallenge(
  result: LoginResult
): result is LoginMfaChallenge {
  return (result as LoginMfaChallenge).mfaRequired === true;
}

export async function login(
  identificador: string,
  password: string
): Promise<LoginResult> {
  const result = await request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({identificador, password}),
  });
  if ("token" in result && result.token) {
    setAuthToken(result.token);
  } else {
    setAuthToken(null);
  }
  return result;
}

export async function logout() {
  try {
    return await request<void>("/api/auth/logout", {
      method: "POST",
      parseJson: false,
    });
  } finally {
    setAuthToken(null);
  }
}

export async function getProfile() {
  return request<UsuarioPerfil>("/api/auth/perfil");
}

export async function getMenus(params: {sede?: string; fecha?: string} = {}) {
  const query = new URLSearchParams();
  if (params.sede) query.append("sede", params.sede);
  if (params.fecha) query.append("fecha", params.fecha);

  const qs = query.toString();
  const path = qs ? `/api/menus?${qs}` : "/api/menus";

  return request<PopulatedMenu[]>(path);
}

export async function getPedidos() {
  return request<PedidoResponse[]>("/api/pedidos");
}

export async function crearPedido(payload: {
  sede: string;
  items: Array<{
    refId: string;
    tipo: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  fechaEntrega?: string;
}) {
  const body = JSON.stringify(payload);
  return request<PedidoResponse>("/api/pedidos", {
    method: "POST",
    body,
  });
}

export async function updatePedidoStatus(
  pedidoId: string,
  newStatus: PedidoStatus
): Promise<PedidoResponse> {
  return request<PedidoResponse>(`/api/pedidos/${pedidoId}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado: newStatus }),
  });
}

export async function getFavoritos() {
  return request<FavoritoResponse[]>("/api/usuarios/me/favoritos");
}

export async function toggleFavorito(refId: string, tipo: "menu" | "carta") {
  const normalizedRefId = String(refId).trim();
  if (!normalizedRefId) {
    throw new Error("El identificador del favorito es obligatorio.");
  }
  return request<{
    action: "added" | "removed";
    favoritos: Array<{refId: string; tipo: string}>;
  }>("/api/usuarios/me/favoritos", {
    method: "POST",
    body: JSON.stringify({refId: normalizedRefId, tipo}),
  });
}

export async function registrarEncuesta(menuId: string, opciones: string[]) {
  return request<{message: string}>(`/api/menus/${menuId}/encuesta`, {
    method: "POST",
    body: JSON.stringify({opciones}),
  });
}

export async function getPlatosMenu(params: {sede?: string} = {}) {
  const qs = params.sede ? `?sede=${encodeURIComponent(params.sede)}` : "";
  return request<PlatoMenuItem[]>(`/api/platos-menu${qs}`);
}

export interface CrearMenuPayload {
  fecha: string; // ISO date
  sede: string;
  precioNormal: number;
  precioEjecutivo: number;
  normal: {entrada: string; segundo: string; bebida: string};
  ejecutivo: {
    entradas: string[];
    segundos: string[];
    postres: string[];
    bebidas: string[];
  };
}

export async function crearMenu(payload: CrearMenuPayload) {
  return request<PopulatedMenu>("/api/platos-menu", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getUsuarios(params: {activo?: boolean} = {}) {
  const query = new URLSearchParams();
  if (typeof params.activo !== "undefined") {
    query.append("activo", String(params.activo));
  }
  const qs = query.toString();
  const path = qs ? `/api/usuarios?${qs}` : "/api/usuarios";
  return request<UsuarioItem[]>(path);
}

export interface CrearUsuarioPayload {
  nombre: string;
  password: string;
  tipo: string;
  codigoUsu: string;
  dni: string;
  rol: string;
}

export async function crearUsuario(payload: CrearUsuarioPayload) {
  const codigo = payload.codigoUsu.trim().toLowerCase();
  const dni = payload.dni.trim().toLowerCase();
  const nombre = payload.nombre.trim();
  const password = payload.password.trim();
  const identificador = codigo || dni;

  if (!identificador) {
    throw new Error("Debes proporcionar un identificador para el usuario.");
  }

  const bodyPayload: CrearUsuarioPayload & {identificador: string} = {
    ...payload,
    nombre,
    password,
    codigoUsu: codigo,
    dni,
    identificador,
  };

  return request<UsuarioItem>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(bodyPayload),
  });
}

export interface CrearProductoPayload {
  nombre: string;
  descripcion?: string;
  tipo: PlatoMenuItem["tipo"];
  sede: string;
  stock: number;
  precio?: number;
  // 'carta' = plato a la carta, 'menu' = plato de menú
  tipoMenu?: "carta" | "menu";
  imagenUrl?: string;
  activo?: boolean;
}

export async function crearProducto(payload: CrearProductoPayload) {
  return request<PlatoMenuItem>("/api/platos-menu", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function actualizarProducto(
  platoId: string,
  payload: Partial<CrearProductoPayload>
) {
  if (!platoId)
    throw new Error("El identificador del producto es obligatorio.");
  return request<PlatoMenuItem>(`/api/platos-menu/${platoId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getResultadosEncuestas(params: {sede?: string} = {}) {
  const query = new URLSearchParams();
  if (params.sede) query.append("sede", params.sede);
  const qs = query.toString();
  const path = qs
    ? `/api/menus/encuestas/resumen?${qs}`
    : "/api/menus/encuestas/resumen";
  return request<EncuestaMenuResultado[]>(path);
}

export async function getSedes() {
  return request<SedeItem[]>("/api/sedes");
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
}

export async function initiateMfaSetup() {
  return request<MfaSetupResponse>("/api/auth/mfa/setup", {
    method: "POST",
  });
}

export async function verifyMfaSetup(code: string) {
  return request<{message: string}>("/api/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({code}),
  });
}

export async function disableMfa(code: string) {
  return request<{message: string}>("/api/auth/mfa/disable", {
    method: "POST",
    body: JSON.stringify({code}),
  });
}

export async function completeMfaLogin(mfaToken: string, code: string) {
  const result = await request<LoginResponse>("/api/auth/login/mfa", {
    method: "POST",
    body: JSON.stringify({mfaToken, code}),
  });
  setAuthToken(result.token);
  return result;
}
