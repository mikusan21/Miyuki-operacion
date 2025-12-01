"use client";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useState} from "react";
import {
  UtensilsCrossed,
  ClipboardList,
  Star,
  Settings,
  Menu,
  Package,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";
import {logout} from "@/lib/api";

interface SidebarProps {
  user: any;
}

export default function Sidebar({user}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdmin = user?.rol === "admin";

  const userMenuItems = [
    {href: "/home/menu", label: "Menú", icon: UtensilsCrossed},
    {href: "/home/orders", label: "Mis Reservas", icon: ClipboardList},
    {href: "/home/favorites", label: "Favoritos", icon: Star},
    {href: "/home/settings", label: "Configuración", icon: Settings},
  ];

  const adminMenuItems = [
    {href: "/home/products", label: "Gestionar Productos", icon: Package},
    {href: "/home/pedidos", label: "Gestión de Pedidos", icon: ClipboardList}, // Cambiado el icono a ClipboardList
    {
      href: "/home/analytics",
      label: "Análisis de Rendimiento",
      icon: BarChart3,
    },
    {href: "/home/settings", label: "Configuración", icon: Settings},
  ];

  
  const coordinadorMenuItems = [
    {href: "/home/products", label: "Gestionar Productos", icon: Package},
    {href: "/home/users", label: "Gestión de Usuarios", icon: Users},
    {
      href: "/home/analytics",
      label: "Análisis de Rendimiento",
      icon: BarChart3,
    },
    {href: "/home/settings", label: "Configuración", icon: Settings},
  ];


  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

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

  return (
    <aside
      className={`bg-primary-dark flex flex-col py-6 border-r border-border transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-20 items-center"
      }`}
    >
      <div className={`px-6 mb-8 ${isExpanded ? "self-start" : "self-center"}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/80 hover:text-white transition-smooth"
        >
          <Menu size={28} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col space-y-2 w-full px-4">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-smooth ${
                isActive
                  ? "bg-primary text-white" // Estilo activo
                  : "text-white/60 hover:text-white hover:bg-primary/20" // Estilo inactivo
              } ${!isExpanded && "justify-center"}`}
              title={item.label}
            >
              <IconComponent size={24} />
              {isExpanded && <span className="ml-4 font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className={`flex items-center p-3 rounded-lg text-white/60 hover:text-white hover:bg-error/20 transition-smooth w-full mx-4 ${
          !isExpanded && "justify-center"
        }`}
      >
        <LogOut size={24} />
      </button>
    </aside>
  );
}
