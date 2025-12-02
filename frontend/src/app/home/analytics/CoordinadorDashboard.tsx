"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type UsuarioPerfil } from "@/lib/api";
import { BarChart3, ClipboardList, Package } from "lucide-react";

const QuickActions = () => {
  const router = useRouter();
  const actions = [
    { label: "Gestionar Productos", href: "/home/products", icon: Package },
    { label: "Gestión de Pedidos", href: "/home/pedidos", icon: ClipboardList },
    { label: "Ver Analíticas", href: "/home/analytics", icon: BarChart3 },
  ];

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-border">
      <h3 className="text-lg font-semibold mb-4">Accesos Directos</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map(({ label, href, icon: Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex flex-col items-center justify-center p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon className="h-10 w-10 text-primary mb-3" />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [user, setUser] = useState<UsuarioPerfil | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">
            Bienvenido, {user?.nombre ?? "Administrador"}
          </h1>
          <p className="text-foreground-secondary mt-1">
            Desde aquí puedes acceder a las principales herramientas de gestión.
          </p>
        </header>

        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
