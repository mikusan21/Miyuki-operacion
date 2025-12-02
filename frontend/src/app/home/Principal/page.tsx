"use client"

import { useEffect, useState } from "react";
import { type UsuarioPerfil } from "@/lib/api";
import AdminDashboard from "./Coordinador";
import UserPrincipalPage from "./UserPrincipalPage";

export default function PrincipalPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser: UsuarioPerfil = JSON.parse(storedUser);
      setUserRole(parsedUser.rol);
    } else {
      // Si no hay usuario, asumimos rol de usuario normal
      setUserRole("usuario");
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (userRole === "admin" || userRole === "coordinador") {
    return <AdminDashboard />;
  }

  return <UserPrincipalPage />;
}
