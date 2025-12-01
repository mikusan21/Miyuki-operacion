"use client";

import type React from "react";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

interface LoginFormProps {
  onSubmit: (codigo: string, password: string) => Promise<void>;
  isLoading: boolean;
  onNavigate: () => void; // Nueva prop para cambiar de vista
}

export default function LoginForm({onSubmit, isLoading, onNavigate}: LoginFormProps) {
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("Submitting login form with:", {codigo, password});
    const trimmedCodigo = codigo.trim();
    const trimmedPassword = password.trim();

    if (!trimmedCodigo || !trimmedPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      await onSubmit(trimmedCodigo, trimmedPassword);
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    }
  };



  return (
    <div className="w-full max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch rounded-2xl overflow-hidden shadow-2xl bg-white">
        <div className="hidden lg:flex bg-[#EFF6FF] items-center justify-center p-12 min-h-[600px]">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src="/login-img.jpg"
              alt="UTP+FOOD Illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="bg-white p-12 flex flex-col justify-center min-h-[600px]">
          <div className="mb-12">
            <div className="mb-6">
              <h1 className="text-4xl font-black text-[#000F37] tracking-tight">
                <span className="inline-block bg-black text-white px-2 py-1 mr-2">
                  UTP
                </span>
                <span className="text-[#E60122]">+</span>FOOD
              </h1>
            </div>
            <p className="text-lg text-[#000F37] font-semibold mb-2">
              Una nueva experiencia para reservar tu menu universitario.
            </p>
            <p className="text-base text-[#000F37]">
              Ingresa tus datos para{" "}
              <span className="font-bold">Iniciar sesion.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="codigo"
                className="block text-sm font-bold text-[#000F37]"
              >
                Codigo UTP
              </label>
              <Input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. U71698935"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] placeholder:text-[#999999] focus:ring-2 focus:ring-[#0661FC] focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-[#000F37]"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] placeholder:text-[#999999] focus:ring-2 focus:ring-[#0661FC] focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="p-4 bg-[#FFE5E5] border border-[#E60122] rounded-lg text-[#E60122] text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0661FC] hover:bg-[#0551E0] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesion"}
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-700">
                ¿Aún no estás registrado?
                <button
                  type="button"
                  onClick={onNavigate} // Usamos la nueva prop
                  className="text-[#0661FC] font-semibold hover:underline ml-1"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
