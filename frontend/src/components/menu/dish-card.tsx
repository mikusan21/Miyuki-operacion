"use client";

import {Star} from "lucide-react";
import {Button} from "@/components/ui/button";
import type {DisplayMenuItem} from "@/components/menu/menu-grid";

interface DishCardProps {
  dish: DisplayMenuItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
}

export default function DishCard({
  dish,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: DishCardProps) {
  const imageSource = dish.image || "/placeholder.svg";

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-smooth">
      <div className="relative h-48 bg-background-secondary">
        <img
          src={imageSource}
          alt={dish.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-smooth"
        >
          <Star
            size={20}
            className={
              isFavorite
                ? "fill-warning text-warning"
                : "text-foreground-secondary"
            }
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2">{dish.title}</h3>
        <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
          {dish.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            S/ {dish.price.toFixed(2)}
          </span>
          <Button
            onClick={onSelect}
            className="bg-error hover:bg-error/90 text-white font-semibold text-sm"
          >
            Ver detalles
          </Button>
        </div>
      </div>
    </div>
  );
}
