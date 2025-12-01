"use client";

import {useEffect, useMemo, useState} from "react";
import MenuGrid, {type DisplayMenuItem} from "@/components/menu/menu-grid";
import ReservationSummary from "@/components/menu/reservation-summary";
import {
  getFavoritos,
  toggleFavorito,
  type FavoritoResponse,
  type PopulatedMenu,
  type PlatoMenuItem as BasePlatoMenuItem,
} from "@/lib/api";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<DisplayMenuItem | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        const response = await getFavoritos();
        // Evitar duplicados por refId/tipo
        const unique = new Map<string, FavoritoResponse>();
        response.forEach((fav) => {
          const key = `${fav.tipo}:${String(fav.refId ?? "").trim()}`;
          if (!unique.has(key)) unique.set(key, fav);
        });
        setFavorites(Array.from(unique.values()));
      } catch (error) {
        console.error("Error al obtener favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const menuFavorites = useMemo(
    () =>
      favorites.filter(
        (fav): fav is FavoritoResponse & {tipo: "menu"} => fav.tipo === "menu"
      ),
    [favorites]
  );

  const items = useMemo<DisplayMenuItem[]>(() => {
    return menuFavorites
      .filter((fav) => fav.menu?._id) // Asegurarnos de que el menú y su ID existen
      .map((fav) => {
        const menu = fav.menu as PopulatedMenu;
        const formattedDate = new Date(menu.fecha).toLocaleDateString();
        const sedeLabel = menu.sedeNombre ?? (typeof (menu.sede as any) === 'object' ? (menu.sede as any).nombre : menu.sede);

        // DEBUG: Imprimir el objeto menu para inspeccionarlo
        console.log("Datos del menú favorito:", menu);

        return {
          id: `${menu._id}-favorite`,
          menuId: menu._id!, // El '!' indica a TS que estamos seguros que no es undefined
          variant: "normal" as const,
          title: menu.normal.segundo?.nombre ?? "Menú Favorito",
          description: [
            menu.normal.segundo?.descripcion,

          ]
            .filter(Boolean)
            .join(" • "),
          price: menu.precioNormal,
          image: menu.normal.segundo?.imagenUrl ?? menu.normal.entrada?.imagenUrl,
          sede: sedeLabel,
          isFavorite: true,
          menu,
        };
      });
  }, [menuFavorites]);

  const handleToggleFavorite = async (menuId: string) => {
    try {
      await toggleFavorito(menuId, "menu");
      setFavorites((prev) =>
        prev.filter((fav) => fav.tipo !== "menu" || fav.refId !== menuId)
      );
    } catch (error) {
      console.error("Error al actualizar favoritos:", error);
    }
  };

  return (
    <div className="flex h-full">
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            Mis Favoritos
          </h1>

          <MenuGrid
            items={items}
            isLoading={loading}
            onSelectDish={(dish) => setReservation(dish)}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </main>

      {reservation && (
        <ReservationSummary
          reservation={reservation}
          onClose={() => setReservation(null)}
        />
      )}
    </div>
  );
}
