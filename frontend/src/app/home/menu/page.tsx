"use client";

import {useEffect, useMemo, useState} from "react";
import MenuGrid, {type DisplayMenuItem} from "@/components/menu/menu-grid";
import MenuFilters from "@/components/menu/menu-filters";
import ReservationSummary from "@/components/menu/reservation-summary";
import {
  getFavoritos,
  getMenus,
  toggleFavorito,
  type FavoritoResponse,
  type PopulatedMenu,
  type UsuarioPerfil,
} from "@/lib/api";

const CATEGORY_OPTIONS = [
  {value: "normal", label: "Menú universitario"},
  {value: "ejecutivo", label: "Menú ejecutivo"},
];

export default function MenuPage() {
  const [menus, setMenus] = useState<PopulatedMenu[]>([]);
  const [availableSedes, setAvailableSedes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedSede, setSelectedSede] = useState("Todas");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORY_OPTIONS[0].value
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [reservation, setReservation] = useState<DisplayMenuItem | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UsuarioPerfil | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed: UsuarioPerfil = JSON.parse(stored);
      setCurrentUser(parsed);
    } catch (err) {
      console.error(
        "Error al cargar el usuario desde almacenamiento local:",
        err
      );
    }
  }, []);

  useEffect(() => {
    // Al cargar el componente, revisa si hay una categoría seleccionada en sessionStorage
    const savedCategory = sessionStorage.getItem("selectedCategory");
    if (savedCategory) {
      // Asegurarse de que la categoría guardada es una de las opciones válidas
      const isValidCategory = CATEGORY_OPTIONS.some(opt => opt.value === savedCategory);
      if (isValidCategory) {
        setSelectedCategory(savedCategory);
      }
      // Limpiar el valor para que no afecte la próxima vez que se entre a la página
      sessionStorage.removeItem("selectedCategory");
    }

    const loadMenus = async () => {
      setLoadingMenus(true);
      setError(null);
      try {
        const getSedeLabel = (menu: PopulatedMenu) => {
          if (menu.sede && typeof menu.sede === "object" && "nombre" in menu.sede) {
            return (menu.sede as any).nombre as string;
          }
          return typeof menu.sede === "string" ? menu.sede : "";
        };

        const query: {sede?: string; fecha?: string} = {};
        if (selectedSede !== "Todas") {
          query.sede = selectedSede;
        }
        if (selectedDate) {
          query.fecha = selectedDate;
        }

        const response = await getMenus(query);
        setMenus(response);
        setAvailableSedes((prev) => {
          const next = new Set(prev);
          response.forEach((menu) => {
            const label = getSedeLabel(menu);
            if (label) next.add(label);
          });
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });
      } catch (err) {
        console.error("Error al obtener menús:", err);
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los menús"
        );
      } finally {
        setLoadingMenus(false);
      }
    };

    loadMenus();
  }, [selectedSede, selectedDate]);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);
      try {
        // Evitar error de token cuando no hay sesión
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("authToken")
            : null;
        if (!token) {
          setFavorites(new Set());
          return;
        }
        const response = await getFavoritos();
        const favoriteMenus = response
          .filter(
            (fav): fav is FavoritoResponse & {tipo: "menu"} =>
              fav.tipo === "menu"
          )
          .map((fav) => String(fav.refId ?? "").trim())
          .filter((value) => value.length > 0);
        setFavorites(new Set(favoriteMenus));
      } catch (err) {
        console.error("Error al obtener favoritos:", err);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, []);

  useEffect(() => {
    setReservation((current) => {
      if (!current) return current;
      const isFavorite = favorites.has(current.menuId);
      if (current.isFavorite === isFavorite) return current;
      return {...current, isFavorite};
    });
  }, [favorites]);

  const handleToggleFavorite = async (menuId: string) => {
    if (!menuId) {
      console.warn("Se intentó actualizar un favorito sin identificador de menú");
      return;
    }

    // Actualización optimista de la UI
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });

    try {
      // Llamada a la API en segundo plano
      await toggleFavorito(menuId, "menu");
    } catch (err) {
      console.error("Error al actualizar favoritos:", err);
    }
  };

  const items = useMemo<DisplayMenuItem[]>(() => {
    const term = searchTerm.trim().toLowerCase();

    const getSedeLabel = (menu: PopulatedMenu) => {
      if (menu.sede && typeof menu.sede === "object" && "nombre" in menu.sede) {
        return (menu.sede as any).nombre as string;
      }
      return typeof menu.sede === "string" ? menu.sede : "";
    };

    return menus
      .filter((menu) => menu.activo)
      .flatMap<DisplayMenuItem>((menu) => {
        const rawMenuId = menu._id ?? menu.id;
        const menuId = rawMenuId ? String(rawMenuId).trim() : "";
        if (!menuId) {
          return [];
        }
        const formattedDate = new Date(menu.fecha).toLocaleDateString();
        const sedeLabel = getSedeLabel(menu);

        const normalCard: DisplayMenuItem = {
          id: `${menuId}-normal`,
          menuId,
          variant: "normal",
          title: menu.normal.segundo?.nombre ?? "Menú Universitario",
          description: [
            menu.normal.segundo?.descripcion,

          ]
            .filter(Boolean)
            .join(" • "),
          price: menu.precioNormal,
          image:
            menu.normal.segundo?.imagenUrl ?? menu.normal.entrada?.imagenUrl,
          sede: sedeLabel,
          isFavorite: favorites.has(menuId),
          menu,
        };

        const executiveDescription = [
          menu.ejecutivo.entradas.length
            ? `${menu.ejecutivo.entradas.length} entradas`
            : null,
          menu.ejecutivo.segundos.length
            ? `${menu.ejecutivo.segundos.length} segundos`
            : null,
          menu.ejecutivo.postres.length
            ? `${menu.ejecutivo.postres.length} postres`
            : null,
          menu.ejecutivo.bebidas.length
            ? `${menu.ejecutivo.bebidas.length} bebidas`
            : null,
        ]
          .filter(Boolean)
          .join(" • ");

        const executiveCard: DisplayMenuItem = {
          id: `${menuId}-ejecutivo`,
          menuId,
          variant: "ejecutivo",
          title: menu.ejecutivo.segundos?.[0]?.nombre ?? "Menú Ejecutivo",
          description: executiveDescription,
          price: menu.precioEjecutivo,
          image:
            menu.ejecutivo.segundos?.[0]?.imagenUrl ??
            menu.normal.segundo?.imagenUrl,
          sede: sedeLabel,
          isFavorite: favorites.has(menuId),
          menu,
        };

        const cards: DisplayMenuItem[] = [];
        if (selectedCategory === "normal" || selectedCategory === "todos") {
          cards.push(normalCard);
        }
        if (selectedCategory === "ejecutivo" || selectedCategory === "todos") {
          cards.push(executiveCard);
        }
        return cards;
      })
      .filter((card) => {
        if (selectedSede !== "Todas" && card.sede !== selectedSede) {
          return false;
        }
        if (!term) return true;
        const haystack = `${card.title} ${card.description}`.toLowerCase();
        return haystack.includes(term);
      });
  }, [menus, favorites, selectedCategory, selectedSede, searchTerm]);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 bg-linear-to-r from-warning to-accent-green rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-2">Oferta del Día</h2>
            <p className="text-sm opacity-90 mb-4">
              No te pierdas de nuestras increíbles ofertas especiales
            </p>
            <div className="flex items-center space-x-8">
              <div className="text-4xl font-bold">05:00:00</div>
              <button className="bg-white text-warning font-semibold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-smooth">
                Pedir ahora
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-error">
              {error}
            </div>
          )}

          <MenuFilters
            sedes={["Todas", ...availableSedes]}
            categories={[...CATEGORY_OPTIONS, {value: "todos", label: "Todos"}]}
            selectedSede={selectedSede}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            selectedDate={selectedDate}
            onSedeChange={setSelectedSede}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchTerm}
            onDateChange={setSelectedDate}
            showDatePicker={currentUser?.rol === "coordinador"}
          />

          <MenuGrid
            items={items}
            isLoading={loadingMenus || loadingFavorites}
            onSelectDish={(dish) => setReservation(dish)}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>

      {reservation && (
        <ReservationSummary
          reservation={reservation}
          onClose={() => setReservation(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
