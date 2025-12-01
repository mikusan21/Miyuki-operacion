"use client";

import {useEffect, useState} from "react";
import {
  disableMfa,
  getProfile,
  initiateMfaSetup,
  type MfaSetupResponse,
  type UsuarioPerfil,
  verifyMfaSetup,
} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaSetup, setMfaSetup] = useState<MfaSetupResponse | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const result = await getProfile();
        setProfile(result);
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      const result = await getProfile();
      setProfile(result);
    } catch (error) {
      console.error("Error al refrescar perfil:", error);
    }
  };

  const handleStartMfaSetup = async () => {
    setIsMfaLoading(true);
    setMfaError(null);
    setMfaMessage(null);
    try {
      const setup = await initiateMfaSetup();
      setMfaSetup(setup);
      setShowDisableForm(false);
      setMfaMessage(
        "Escanea el código QR con Google Authenticator y luego ingresa el código de 6 dígitos para activar la protección."
      );
    } catch (error) {
      console.error("Error iniciando configuración MFA:", error);
      setMfaError(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar la configuración de 2FA"
      );
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleVerifyMfaSetup = async () => {
    if (!mfaCode.trim()) {
      setMfaError("Ingresa el código de 6 dígitos para continuar");
      return;
    }

    setIsMfaLoading(true);
    setMfaError(null);
    try {
      await verifyMfaSetup(mfaCode.trim());
      setMfaMessage("Autenticación en dos pasos activada correctamente");
      setMfaSetup(null);
      setMfaCode("");
      await refreshProfile();
    } catch (error) {
      console.error("Error verificando MFA:", error);
      setMfaError(
        error instanceof Error
          ? error.message
          : "El código ingresado no es válido"
      );
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleCancelMfaSetup = () => {
    setMfaSetup(null);
    setMfaCode("");
    setMfaMessage(null);
    setMfaError(null);
  };

  const toggleDisableForm = () => {
    setShowDisableForm((prev) => !prev);
    setDisableCode("");
    setMfaError(null);
    setMfaMessage(null);
  };

  const handleDisableMfa = async () => {
    if (!disableCode.trim()) {
      setMfaError("Ingresa el código actual para desactivar 2FA");
      return;
    }

    setIsMfaLoading(true);
    setMfaError(null);
    try {
      await disableMfa(disableCode.trim());
      setMfaMessage("Autenticación en dos pasos desactivada");
      setDisableCode("");
      setShowDisableForm(false);
      await refreshProfile();
    } catch (error) {
      console.error("Error desactivando MFA:", error);
      setMfaError(
        error instanceof Error
          ? error.message
          : "No fue posible desactivar el doble factor"
      );
    } finally {
      setIsMfaLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Configuración</h1>

      <div className="bg-white rounded-lg shadow-card p-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Datos personales
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length: 4}).map((_, index) => (
              <div
                key={index}
                className="h-12 rounded-md bg-background-secondary animate-pulse"
              />
            ))}
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Nombre completo" value={profile.nombre} />
            <Field
              label="Código"
              value={profile.codigoUsu ?? "No disponible"}
            />
            <Field label="Documento" value={profile.dni ?? "No registrado"} />
            <Field label="Tipo" value={profile.tipo} />
            <Field label="Rol" value={profile.rol} />
            <Field
              label="Sede"
              value={
                profile.sedeNombre ??
                profile.sede ??
                "Sin sede"
              }
            />
          </div>
        ) : (
          <p className="text-foreground-secondary">
            No fue posible cargar tus datos.
          </p>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Autenticación en dos pasos
            </h2>
            <p className="text-sm text-foreground-secondary max-w-xl">
              Protege tu cuenta con un segundo factor de seguridad. Solo tú
              podrás acceder utilizando un código temporal generado en Google
              Authenticator u otra app compatible.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              profile?.mfaEnabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {profile?.mfaEnabled ? "Activado" : "Desactivado"}
          </span>
        </div>

        {(mfaMessage || mfaError) && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
              mfaError
                ? "border-error/20 bg-error/10 text-error"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {mfaError ?? mfaMessage}
          </div>
        )}

        {mfaSetup ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  mfaSetup.otpauthUrl
                )}`}
                alt="Código QR para configurar 2FA"
                className="h-48 w-48 rounded-lg border border-border"
              />
              <div className="space-y-3 text-sm text-foreground-secondary">
                <p>
                  Escanea el código con tu aplicación de autenticación o ingresa
                  manualmente esta clave:
                </p>
                <code className="block rounded-lg bg-background-secondary px-3 py-2 text-base font-semibold tracking-widest text-foreground">
                  {mfaSetup.secret}
                </code>
                <p>
                  Luego introduce el código de 6 dígitos que aparece en la
                  aplicación para confirmar la activación.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground">
                  Código de verificación
                </label>
                <Input
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  disabled={isMfaLoading}
                  className="mt-2 uppercase tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleCancelMfaSetup}
                  disabled={isMfaLoading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleVerifyMfaSetup} disabled={isMfaLoading}>
                  {isMfaLoading ? "Guardando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        ) : profile?.mfaEnabled ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-foreground-secondary">
              Tu cuenta está protegida con doble factor. Necesitarás tu código
              temporal para iniciar sesión.
            </p>
            <Button
              variant="outline"
              onClick={toggleDisableForm}
              disabled={isMfaLoading}
            >
              {showDisableForm ? "Ocultar formulario" : "Desactivar 2FA"}
            </Button>

            {showDisableForm && (
              <div className="space-y-3 rounded-lg border border-border px-4 py-4">
                <p className="text-sm text-foreground-secondary">
                  Ingresa el código actual de tu aplicación para confirmar. Se
                  desactivará inmediatamente.
                </p>
                <Input
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value)}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  disabled={isMfaLoading}
                  className="uppercase tracking-widest"
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={toggleDisableForm}
                    disabled={isMfaLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisableMfa}
                    disabled={isMfaLoading}
                  >
                    {isMfaLoading ? "Procesando..." : "Desactivar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-foreground-secondary">
              Añade una capa adicional de seguridad y evita accesos no
              autorizados incluso si alguien conoce tu contraseña.
            </p>
            <Button onClick={handleStartMfaSetup} disabled={isMfaLoading}>
              {isMfaLoading ? "Generando..." : "Configurar 2FA"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({label, value}: FieldProps) {
  return (
    <label className="block text-sm font-medium text-foreground">
      <span className="mb-2 block">{label}</span>
      <input
        value={value}
        readOnly
        className="w-full px-4 py-3 border border-border rounded-lg bg-background-secondary text-foreground focus:outline-none"
      />
    </label>
  );
}
