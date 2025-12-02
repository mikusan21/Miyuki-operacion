"use client";

import {useState, useEffect, useMemo} from "react";
import {
  getMenus,  
  getUsuarios as getUsers, // Renombramos la importación para mantener consistencia
  crearPedido,
  type PopulatedMenu,
  type UsuarioPerfil,
  type PedidoResponse,
} from "@/lib/api";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {X, Loader2} from "lucide-react";

interface AddPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPedidoCreated: (newPedido: PedidoResponse) => void;
}

export default function AddPedidoModal({
  isOpen,
  onClose,
  onPedidoCreated,
}: AddPedidoModalProps) {
  const [menus, setMenus] = useState<PopulatedMenu[]>([]);
  const [users, setUsers] = useState<UsuarioPerfil[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMenu, setSelectedMenu] = useState<PopulatedMenu | null>(null);
  const [selectedUser, setSelectedUser] = useState<UsuarioPerfil | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [menuSearch, setMenuSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      try {
        const [menusData, usersData] = await Promise.all([
          getMenus({}),
          getUsers({}),
        ]);
        setMenus(menusData);
        setUsers(usersData.filter((u: UsuarioPerfil) => u.rol !== 'admin' && u.rol !== 'coordinador')); // Filtrar usuarios
      } catch (error) {
        console.error("Error loading data for modal", error);
        setFeedback("Error al cargar datos necesarios.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen]);

  const filteredMenus = useMemo(
    () =>
      menus.filter((menu) =>
        (menu.normal?.entrada?.nombre ?? "").toLowerCase().includes(menuSearch.toLowerCase()) ||
        (menu.normal?.segundo?.nombre ?? "").toLowerCase().includes(menuSearch.toLowerCase()) ||
        (menu.ejecutivo?.entradas?.some(e => e.nombre.toLowerCase().includes(menuSearch.toLowerCase())) ?? false) ||
        (menu.ejecutivo?.segundos?.some(s => s.nombre.toLowerCase().includes(menuSearch.toLowerCase())) ?? false)
      ),
    [menus, menuSearch]
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        (user.nombre && user.nombre.toLowerCase().includes(userSearch.toLowerCase())) ||
        (user.codigoUsu && user.codigoUsu.toLowerCase().includes(userSearch.toLowerCase()))
      ),
    [users, userSearch]
  );

  const handleCreatePedido = async () => {
    if (!selectedMenu || !selectedUser || quantity < 1) {
      setFeedback("Por favor, selecciona un menú, un usuario y una cantidad válida.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (!selectedMenu._id) throw new Error("El ID del menú no está disponible.");
      const newPedido = await crearPedido({
        sede: typeof selectedMenu.sede === 'string' ? selectedMenu.sede : selectedMenu.sede._id,
        usuario: selectedUser._id,
        items: [
          {
            refId: selectedMenu._id,
            tipo: "menu",
            cantidad: quantity,
            precioUnitario: selectedMenu.precio,
             nombre: selectedMenu.normal?.entrada?.nombre ?? 'Menú', // Esta línea ya es correcta con el cambio en api.ts
          },
        ],
      });
      onPedidoCreated(newPedido);
      setFeedback("Pedido creado con éxito.");
      setTimeout(() => {
        onClose();
        // Reset state
        setSelectedMenu(null);
        setSelectedUser(null);
        setQuantity(1);
        setMenuSearch("");
        setUserSearch("");
        setFeedback(null);
      }, 1500);
    } catch (error) {
      console.error("Error creating order:", error);
      setFeedback(error instanceof Error ? error.message : "No se pudo crear el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Agregar Nuevo Pedido</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Selección de Usuario */}
              <div>
                <label className="font-medium text-sm">Buscar Usuario</label>
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mt-1"
                />
                <div className="mt-2 border rounded-md max-h-32 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div key={user._id} onClick={() => { setSelectedUser(user); setUserSearch(`${user.nombre} (${user.codigoUsu})`); }} className={`p-2 cursor-pointer hover:bg-muted ${selectedUser?._id === user._id ? 'bg-primary/20' : ''}`}>
                      {user.nombre} ({user.codigoUsu})
                    </div>
                  ))}
                </div>
              </div>

              {/* Selección de Menú */}
              <div>
                <label className="font-medium text-sm">Buscar Menú</label>
                <Input
                  placeholder="Buscar por nombre de plato..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="mt-1"
                />
                <div className="mt-2 border rounded-md max-h-32 overflow-y-auto">
                  {filteredMenus.map((menu) => (
                    <div key={menu._id} onClick={() => { setSelectedMenu(menu); setMenuSearch(menu.normal?.entrada?.nombre ?? 'Menú'); }} className={`p-2 cursor-pointer hover:bg-muted ${selectedMenu?._id === menu._id ? 'bg-primary/20' : ''}`}>
                      {menu.normal?.entrada?.nombre ?? 'Menú Ejecutivo'} - S/ {menu.precio?.toFixed(2) ?? '0.00'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="font-medium text-sm">Cantidad</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  className="mt-1"
                />
              </div>
            </>
          )}
        </main>

        <footer className="p-4 border-t border-border mt-auto">
          {feedback && <p className="text-sm text-center mb-2 text-red-600">{feedback}</p>}
          <Button
            onClick={handleCreatePedido}
            disabled={isSubmitting || loading || !selectedMenu || !selectedUser}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            Crear Pedido
          </Button>
        </footer>
      </div>
    </div>
  );
}