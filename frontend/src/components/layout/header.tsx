"use client";

import {useRouter} from "next/navigation";
import {useState, type KeyboardEvent} from "react";
import Image from "next/image";
import {Bell, LogOut, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {logout} from "@/lib/api";

interface HeaderProps {
  user: any;
}

export default function Header({user}: HeaderProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const roleLabels: Record<string, string> = {
    usuario: "Estudiante",
    profesor: "Profesor",
    coordinador: "Coordinador",
    admin: "Administrador",
  };

  const displayRole = roleLabels[user?.rol] ?? "Usuario";
  const displayName = user?.nombre ?? "Usuario";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      router.push("/");
    }
  };

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      // Guardar el término de búsqueda para que la página de menú lo recoja
      sessionStorage.setItem("searchTerm", searchTerm.trim());
      router.push("/home/menu");
    }
  };

  return (
    <header className="bg-white border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button onClick={() => router.push("/home/Principal")} className="cursor-pointer">
          <Image
            src="/logo-utp.png"
            alt="Logo UTP+FOOD"
            width={160}
            height={40}
            priority
            className="object-contain"
          />
        </button>
        <div className="relative">
          <Search
            className="absolute left-s3 top-1/2 transform -translate-y-1/2 text-foreground-secondary"
            size={18}
          />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Buscar platos o comedores"
            className="pl-10 w-96"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-foreground-secondary hover:text-foreground transition-smooth">
          <Bell size={24} />
        </button>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              Hola, {displayName}
            </p>
            <p className="text-xs text-foreground-secondary">{displayRole}</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
            {displayName?.charAt(0)?.toUpperCase()}
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="ml-4 text-error hover:bg-error/10"
          >
            <LogOut size={18} className="mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
