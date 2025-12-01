"use client";

import {Search, MapPin} from "lucide-react";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryOption {
  value: string;
  label: string;
}

interface MenuFiltersProps {
  sedes: string[];
  categories: CategoryOption[];
  selectedSede: string;
  selectedCategory: string;
  searchTerm: string;
  selectedDate?: string;
  showDatePicker?: boolean;
  onSedeChange: (sede: string) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  onDateChange?: (date: string) => void;
}

export default function MenuFilters({
  sedes,
  categories,
  selectedSede,
  selectedCategory,
  searchTerm,
  selectedDate,
  showDatePicker = false,
  onSedeChange,
  onCategoryChange,
  onSearchChange,
  onDateChange,
}: MenuFiltersProps) {
  const availableSedes = sedes.length ? sedes : ["Todas"];

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Explora nuestros productos variados con la calidad perfecta
      </h3>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary"
            size={18}
          />
          <Input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar"
            className="pl-10"
          />
        </div>

        {showDatePicker && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Seleccionar fecha
            </label>
            <Input
              type="date"
              value={selectedDate ?? ""}
              onChange={(event) => onDateChange?.(event.target.value)}
              className="w-48"
            />
          </div>
        )}

        <Select value={selectedSede} onValueChange={onSedeChange}>
          <SelectTrigger className="w-48">
            <MapPin size={18} className="mr-2" />
            <SelectValue placeholder="Seleccionar sede" />
          </SelectTrigger>
          <SelectContent>
            {availableSedes.map((sede) => (
              <SelectItem key={sede} value={sede}>
                {sede}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
