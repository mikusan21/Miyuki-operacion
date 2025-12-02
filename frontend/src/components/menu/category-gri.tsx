"use client";

import Image from "next/image";

const categories = [
  {
    id: "normal",
    nombre: "Menú Normal",
    imagen: "/imagen2.jpg",
  },
  {
    id: "ejecutivo",
    nombre: "Menú Ejecutivo",
    imagen: "/imagen3.jpg",
  },
  {
    id: "universitario",
    nombre: "Menú Universitario",
    imagen: "/imagen4.jpg",
  },
];

interface MenuProps {
  onNavigate: (page: string) => void;
}

export default function CategoryGrid({ onNavigate }: MenuProps) {
  const handleClick = (categoryId: string) => {
    onNavigate(categoryId);
  };

  return (
    <div className="w-full flex justify-center py-6">
      <div
        className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          lg:grid-cols-3 
          gap-6 
          max-w-5xl 
          w-full 
          place-items-center
        "
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className="
              relative cursor-pointer 
              rounded-3xl overflow-hidden 
              shadow-md hover:shadow-2xl 
              hover:scale-105 
              transition-all 
              duration-300
              w-full 
              max-w-[260px]
              aspect-[4/3]
              bg-white/10 backdrop-blur-sm
            "
          >
            <Image
              src={cat.imagen}
              alt={cat.nombre}
              fill
              className="object-cover transition-all duration-300 brightness-75 hover:brightness-90"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-white text-lg sm:text-xl font-semibold text-center drop-shadow-md px-2">
                {cat.nombre}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
