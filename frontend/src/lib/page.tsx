"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm"; // Asegúrate que la ruta a RegisterForm sea correcta
import {crearUsuario} from "@/lib/api";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (data: {
    nombre: string;
    password: string;
    tipo: string;
    codigoUsu?: string;
    dni: string;
  }) => {
    setIsLoading(true);
    try {
      // Añadimos el rol 'cliente' que es requerido por la API
      // y llamamos a la función correcta 'crearUsuario'
      await crearUsuario({...data, rol: "cliente"});

      // Si el registro es exitoso, redirige al login
      router.push("/auth/login");
    } catch (error) {
      console.error("Registration failed:", error);
      // Aquí podrías pasar el error al formulario para mostrarlo
      setIsLoading(false);
      // Lanza el error para que el formulario sepa que falló
      throw error;
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
    </main>
  );
}
