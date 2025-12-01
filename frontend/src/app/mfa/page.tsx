"use client";

import {FormEvent, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {completeMfaLogin, getProfile} from "@/lib/api";

const MFA_CONTEXT_KEY = "mfaContext";

interface MfaContext {
  mfaToken: string;
  identificador?: string;
}

export default function MfaChallengePage() {
  const router = useRouter();
  const [context, setContext] = useState<MfaContext | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(MFA_CONTEXT_KEY)
        : null;

    if (!raw) {
      router.replace("/");
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as MfaContext;
      if (!parsed?.mfaToken) {
        router.replace("/");
        setReady(true);
        return;
      }
      setContext(parsed);
    } catch (err) {
      console.error("Error leyendo contexto MFA:", err);
      router.replace("/");
      setReady(true);
      return;
    } finally {
      setReady(true);
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!context) return;

    const normalizedCode = code.trim();
    if (normalizedCode.length !== 6) {
      setError("Ingresa el código de 6 dígitos que aparece en tu app");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await completeMfaLogin(context.mfaToken, normalizedCode);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(MFA_CONTEXT_KEY);
      }
      const profile = await getProfile();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(profile));
      }
      router.replace("/home/menu");
    } catch (err) {
      console.error("Error validando MFA:", err);
      setError(
        err instanceof Error
          ? err.message
          : "El código ingresado no es válido. Intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return null;
  }

  if (!context) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Verificación en dos pasos
          </h1>
          <p className="text-sm text-foreground-secondary">
            Ingresa el código generado en tu aplicación de autenticación para
            completar el inicio de sesión
            {context.identificador ? ` de ${context.identificador}` : ""}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Código de 6 dígitos
            </label>
            <Input
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="mt-2 text-center text-xl tracking-[0.6rem]"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Validando..." : "Continuar"}
          </Button>
        </form>

        <button
          type="button"
          className="w-full text-sm text-foreground-secondary hover:text-foreground transition-colors"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.removeItem(MFA_CONTEXT_KEY);
            }
            router.replace("/");
          }}
          disabled={isLoading}
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
