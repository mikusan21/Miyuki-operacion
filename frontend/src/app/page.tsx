"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import LoginForm from "@/components/auth/login-form"; // El nombre del archivo es login-form.tsx
import RegisterForm from "@/components/auth/RegisterForm";

import {getProfile, isMfaChallenge, login, crearUsuario} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterView, setIsRegisterView] = useState(false);

  const handleLogin = async (codigo: string, password: string) => {
    setIsLoading(true);
    try {
      const trimmedCodigo = codigo.trim().toLowerCase();
      const trimmedPassword = password.trim();

      const result = await login(trimmedCodigo, trimmedPassword);

      if (isMfaChallenge(result)) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "mfaContext",
            JSON.stringify({
              mfaToken: result.mfaToken,
              identificador: result.identificador,
            })
          );
          window.localStorage.removeItem("user");
        }
        router.push("/mfa");
        return;
      }

      const profile = await getProfile();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(profile));
      }
      router.push("/home/Principal");
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: {
    nombre: string;
    password: string;
    tipo: string;
    codigoUsu?: string;
    dni: string;
  }) => {
    setIsLoading(true);
    try {
      await crearUsuario({
        ...data,
        rol: data.tipo,
        codigoUsu: data.codigoUsu ?? "", // Proporciona un valor por defecto
      });
      // Si el registro es exitoso, cambia a la vista de login para que inicie sesión
      setIsRegisterView(false);
    } catch (error) {
      console.error("Error en registro:", error);
      throw error; // Lanza el error para que el formulario de registro lo muestre
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      {isRegisterView ? (
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
          onNavigate={() => setIsRegisterView(false)}
        />
      ) : (
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} onNavigate={() => setIsRegisterView(true)} />
      )}
    </div>
  );
}
