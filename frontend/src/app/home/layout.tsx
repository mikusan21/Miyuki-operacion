"use client";

import type React from "react";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {getProfile} from "@/lib/api";

export default function HomeLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        <Header user={user} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
