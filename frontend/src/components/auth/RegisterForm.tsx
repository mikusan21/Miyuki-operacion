"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

interface RegisterFormProps {
  onSubmit: (data: {
    nombre: string
    password: string
    tipo: string
    codigoUsu?: string
    dni: string
  }) => Promise<void>
  isLoading: boolean
  onNavigate?: (path: string) => void
}

export default function RegisterForm({ onSubmit, isLoading, onNavigate }: RegisterFormProps) {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [password, setPassword] = useState("")
  const [tipo, setTipo] = useState("estudiante")
  const [codigoUsu, setCodigoUsu] = useState("")
  const [dni, setDni] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nombre || !password || !dni) {
      setError("Por favor completa todos los campos obligatorios (*)")
      return
    }

    try {
      await onSubmit({ nombre, password, tipo, codigoUsu, dni })
      if (onNavigate) onNavigate("/auth/login")
      else router.push("/auth/login")
    } catch (err) {
      console.error(err)
      setError("Error al registrar. Intenta nuevamente.")
    }
  }

  return (
    <div className="w-full max-w-6xl">
      {/* Imagen lado izquierdo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch rounded-2xl overflow-hidden shadow-2xl bg-white">
        <img
          src="/login-img.jpg"
          alt="UTP+FOOD"
          className="hidden lg:block w-full h-full object-cover"
        />

        {/* Formulario lado derecho */}
        <div className="bg-white p-12 flex flex-col justify-center min-h-[600px]">
          {/* Encabezado de marca */}
          <h1 className="text-4xl font-black text-[#000F37] tracking-tight mb-6">
            <span className="inline-block bg-black text-white px-2 py-1 mr-2">UTP</span>
            <span className="text-[#E60122]">+</span>FOOD
          </h1>

          <p className="text-lg text-[#000F37] font-semibold mb-2">
            Crea tu cuenta y disfruta de una nueva forma de reservar tu menú universitario 🍽️
          </p>
          <p className="text-base text-[#000F37] mb-8">
            Completa los siguientes campos para <span className="font-bold">registrarte.</span>
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-bold text-[#000F37]">
                Nombre completo *
              </label>
              <Input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Miyuki Kahori Panduro"
                disabled={isLoading}
                className="mt-2 w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] focus:ring-2 focus:ring-[#0661FC] transition-all"
              />
            </div>

            <div>
              <label htmlFor="dni" className="block text-sm font-bold text-[#000F37]">
                DNI *
              </label>
              <Input
                id="dni"
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej. 74839102"
                disabled={isLoading}
                className="mt-2 w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] focus:ring-2 focus:ring-[#0661FC] transition-all"
              />
            </div>

            <div>
              <label htmlFor="codigoUsu" className="block text-sm font-bold text-[#000F37]">
                Código UTP (opcional)
              </label>
              <Input
                id="codigoUsu"
                type="text"
                value={codigoUsu}
                onChange={(e) => setCodigoUsu(e.target.value)}
                placeholder="Ej. U71698935"
                disabled={isLoading}
                className="mt-2 w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] focus:ring-2 focus:ring-[#0661FC] transition-all"
              />
            </div>

            <div>
              <label htmlFor="tipo" className="block text-sm font-bold text-[#000F37]">
                Tipo de usuario
              </label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={isLoading}
                className="mt-2 w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] focus:ring-2 focus:ring-[#0661FC] transition-all"
              >
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="administrativo">Administrativo</option>
                
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#000F37]">
                Contraseña *
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                className="mt-2 w-full px-4 py-3 bg-[#F5F5F5] border-0 rounded-lg text-[#000F37] focus:ring-2 focus:ring-[#0661FC] transition-all"
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="p-4 bg-[#FFE5E5] border border-[#E60122] rounded-lg text-[#E60122] text-sm font-medium">
                {error}
              </div>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0661FC] hover:bg-[#0551E0] text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>

            {/* Redirección a Login */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-base text-[#000F37]">
                ¿Ya tienes una cuenta?
                <button
                  type="button"
                  onClick={() => (onNavigate ? onNavigate("/login") : router.push("/auth/login"))}
                  className="text-[#0661FC] font-bold hover:underline ml-1.5"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
