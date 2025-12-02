"use client";

import {useRouter} from "next/navigation";
import {useState, type KeyboardEvent} from "react";
import Image from "next/image";
import {LogOut, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {logout} from "@/lib/api";
import {NotificationBell, type Notification} from "./NotificationBell";

interface HeaderProps {
  user: any;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export default function Header({user, notifications, setNotifications}: HeaderProps) {
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
      {/* Sección Izquierda: Logo */}
      <div className="flex-shrink-0">
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
      </div>

      {/* Sección Central: Barra de Búsqueda */}
      <div className="flex-1 flex justify-center px-8">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-secondary" size={18} />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Buscar platos, menús o comedores..."
            className="pl-11 pr-4 py-2 w-full bg-muted/50 rounded-full border-transparent focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sección Derecha: Perfil de Usuario */}
      <div className="flex items-center space-x-6 flex-shrink-0">
        <NotificationBell notifications={notifications} setNotifications={setNotifications} />
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
