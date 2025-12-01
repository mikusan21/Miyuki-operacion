"use client";

import DishCard from "@/components/menu/dish-card";
import type {PopulatedMenu} from "@/lib/api";

export interface DisplayMenuItem {
  id: string;
  menuId: string;
  variant: "normal" | "ejecutivo";
  title: string;
  description: string;
  price: number;
  image?: string;
  sede: string;
  isFavorite: boolean;
  menu: PopulatedMenu;
}

interface MenuGridProps {
  items: DisplayMenuItem[];
  isLoading: boolean;
  onSelectDish: (dish: DisplayMenuItem) => void;
  onToggleFavorite: (menuId: string) => void;
}

export default function MenuGrid({
  items,
  isLoading,
  onSelectDish,
  onToggleFavorite,
}: MenuGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({length: 6}).map((_, index) => (
          <div
            key={index}
            className="h-64 bg-background-secondary animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-border">
        <p className="text-foreground-secondary">
          No hay menús disponibles con los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((dish) => (
        <DishCard
          key={dish.id}
          dish={dish}
          isFavorite={dish.isFavorite}
          onToggleFavorite={() => onToggleFavorite(dish.menuId)}
          onSelect={() => onSelectDish(dish)}
        />
      ))}
    </div>
  );
}
