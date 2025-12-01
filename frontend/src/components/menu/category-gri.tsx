"use client"

import Image from "next/image"

// Definimos las categorías estáticamente aquí.
// Estas coinciden con los tipos de menú en tu aplicación.
const categories = [
  {
    id: "normal",
    nombre: "Menú Normal",
    imagen: "/imagen2.jpg", // Asegúrate de que esta imagen exista en tu carpeta /public
  },
  {
    id: "ejecutivo",
    nombre: "Menú Ejecutivo",
    imagen: "/imagen3.jpg", // Asegúrate de que esta imagen exista en tu carpeta /public
  },
  {
    id: "universitario",
    nombre: "Menú Universitario",
    imagen: "/imagen4.jpg", // Asegúrate de que esta imagen exista en tu carpeta /public
  },
]

interface MenuProps {
  onNavigate: (page: string) => void
}

export default function CategoryGrid({onNavigate}: MenuProps) {
  //  Al hacer clic: redirige al menú y guarda la categoría seleccionada en sessionStorage
  const handleClick = (categoryId: string) => { // La lógica de sessionStorage y router.push se maneja en el padre
    onNavigate(categoryId) // Llamar a la función onNavigate pasada como prop
  }

  return (
    <div className="w-full flex justify-center">
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 w-full max-w-7xl px-8 place-items-center"
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className="relative cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300 w-full max-w-[230px] aspect-[5/3]"
          >
            <Image
              src={cat.imagen}
              alt={cat.nombre}
              fill
              className="object-cover brightness-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-white text-lg font-bold text-center drop-shadow-md">
                {cat.nombre}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
