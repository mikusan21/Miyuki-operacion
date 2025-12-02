"use client";

import type React from "react";
import {useEffect, useState, useCallback} from "react";
import {useRouter} from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  getProfile,
  getFavoritos,
  getMenus,
  type FavoritoResponse,
  type UsuarioPerfil,
} from "@/lib/api";
import { type Notification } from "@/components/layout/NotificationBell";

export default function HomeLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const [user, setUser] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let isActive = true;

    const bootstrapUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        localStorage.removeItem("user");
        if (isActive) {
          setUser(null);
        }
        if (isActive) {
          setIsLoading(false);
          router.push("/");
        }
        return;
      }

      try {
        const profile = await getProfile();
        if (!isActive) return;
        setUser(profile);
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (error) {
        console.error("Error al obtener perfil:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        if (isActive) {
          setUser(null);
          router.push("/");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    bootstrapUser();

    return () => {
      isActive = false;
    };
  }, [router]);

  const checkNotifications = useCallback(async () => {
    if (!user) return;

    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem("lastNotificationCheck");

    // Solo verificar una vez al día
    if (lastCheck === today) {
      const savedNotifs = localStorage.getItem("userNotifications");
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      return;
    }

    try {
      const newNotifications: Notification[] = [];

      // 1. Verificar si hay menús hoy para recordar la encuesta
      const menusToday = await getMenus({ fecha: new Date().toISOString().split('T')[0] });
      if (menusToday.length > 0) {
        newNotifications.push({
          id: "encuesta-diaria",
          message: "¡No olvides calificar el menú de hoy! Tu opinión nos ayuda a mejorar.",
          href: "/home/menu",
        });
      }

      // 2. Verificar si un plato favorito está en el menú de hoy
      const favorites = await getFavoritos();
      const favoriteMenus = favorites
        .filter((fav): fav is FavoritoResponse & { tipo: "menu" } => fav.tipo === "menu")
        .map((fav) => fav.refId);

      if (favoriteMenus.length > 0 && menusToday.length > 0) {
        const favoriteInMenu = menusToday.find(menu => favoriteMenus.includes(menu._id!));
        if (favoriteInMenu) {
          const dishName = favoriteInMenu.normal.segundo?.nombre ?? "Tu plato favorito";
          newNotifications.push({
            id: `favorito-${favoriteInMenu._id}`,
            message: `¡Buenas noticias! ${dishName} está en el menú de hoy.`,
            href: "/home/menu",
          });
        }
      }

      setNotifications(newNotifications);
      localStorage.setItem("userNotifications", JSON.stringify(newNotifications));
      localStorage.setItem("lastNotificationCheck", today);

    } catch (error) {
      console.error("Error al verificar notificaciones:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) checkNotifications();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} notifications={notifications} setNotifications={setNotifications} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
