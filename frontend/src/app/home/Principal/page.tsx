"use client"
import { useRouter } from "next/navigation" 
import { useEffect, useState } from "react"
import Image from "next/image"
import MenuGrid from "@/components/menu/menu-grid"
import CategoryGrid from "@/components/menu/category-gri"
import ReservationSummary from "@/components/menu/reservation-summary"
import { getMenus, toggleFavorito, type PopulatedMenu } from "@/lib/api"
import { type DisplayMenuItem } from "@/components/menu/menu-grid"

export default function PrincipalPage() {
  const router = useRouter()
  const [reservation, setReservation] = useState<any>(null) // toggleFavorito no se usa aquí
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [featuredItems, setFeaturedItems] = useState<DisplayMenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar algunos menús para la sección "Platos Destacados"
    const loadFeatured = async () => {
      try {
        const allMenus = await getMenus() // Obtenemos los menús
        const featured = allMenus.slice(0, 3) // Tomamos solo los primeros 3
        setFeaturedItems(featured.map(menuToDisplayItem))
      } catch (error) {
        console.error("Error al cargar platos destacados:", error)
      } finally {
        setLoading(false)
      }
    }
    loadFeatured()
  }, [])

  // 🔹 Cuando se selecciona un plato, abre el panel lateral
  const handleSelectDish = (dish: any) => {
    setReservation(dish)
    setIsSidebarOpen(true)
  }

  // 🔹 Cerrar panel
  const closeSidebar = () => {
    setIsSidebarOpen(false)
    setTimeout(() => setReservation(null), 300) // espera a la animación
  }

  // Función para convertir un menú de la API a un item que MenuGrid puede mostrar
  const menuToDisplayItem = (menu: PopulatedMenu): DisplayMenuItem => {
    const menuId = menu._id ?? menu.id ?? ""
    return {
      id: `${menuId}-normal`,
      menuId: menuId,
      variant: "normal",
      title: menu.normal.segundo?.nombre ?? "Plato Destacado",
      description: [
        menu.normal.segundo?.descripcion,
      ]
        .filter(Boolean)
        .join(" • "),
      price: menu.precioNormal,
      image: menu.normal.segundo?.imagenUrl ?? "/placeholder-image.jpg",
      sede: typeof menu.sede === 'object' ? (menu.sede as any).nombre : menu.sede,
      isFavorite: false, // No manejaremos favoritos en la página principal para simplificar
      menu,
    }
  }

  // Función para navegar a la página de menú y establecer la categoría
  const navigateToMenuWithCategory = (categoryId: string) => {
    sessionStorage.setItem("selectedCategory", categoryId)
    router.push("/home/menu")
  }

  return (
    <div className="relative bg-[#f5f8ff] w-full overflow-x-hidden flex transition-all duration-300">
      {/* 🔹 Contenedor principal (se achica si el panel está abierto) */}
      <div
        className={`flex-1 transition-all duration-500 ${
          isSidebarOpen ? "md:w-[70%]" : "w-full"
        }`}
      >
        {/* Banner principal */}
        <section className="relative h-[380px] w-full">
          <Image
            src="/imagen1.jpg"
            alt="Banner principal"
            fill
            className="object-cover brightness-75"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <h1 className="text-4xl font-bold mb-2">Descubre nuestros sabores únicos</h1>
            <p className="text-lg mb-4">Una experiencia culinaria que no olvidarás</p>
            <button
              onClick={() => router.push("/home/menu")} // Usar router.push directamente
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-white font-semibold transition-all"
            >
              Ver el menú
            </button>
          </div>
        </section>

        {/* Categorías */}
        <section className="mt-10 px-10 text-center flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-6">Categorías Populares</h2>
          <CategoryGrid onNavigate={navigateToMenuWithCategory} /> {/* Pasar la nueva función */}
        </section>

        {/* Platos destacados */}
        <section className="mt-12 px-10 pb-10 text-center flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Nuestros Platos Destacados</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            Explora algunas de nuestras creaciones más populares.
          </p>
          <div className="flex text-left block w-full justify-center" >
            <div className="max-w-6xl w-full">
              <MenuGrid
                items={featuredItems}
                isLoading={loading}
                onSelectDish={handleSelectDish}
                onToggleFavorite={() => {}} // No hacemos nada al marcar favorito aquí
              />
            </div>
          </div>
        </section>
      </div>

      {/* 🔹 Panel lateral (Resumen del pedido) */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-lg border-l border-gray-200 w-[380px]
        transform transition-transform duration-500 ease-in-out z-50
        ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {reservation && (
          <ReservationSummary reservation={reservation} onClose={closeSidebar} />
        )}
      </div>
       {/* 🔹 Fondo semitransparente negro al 25% */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          onClick={closeSidebar}
        ></div>
      )}
    </div>
  )
}
