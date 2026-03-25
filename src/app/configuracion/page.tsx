"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { settingsStore, type AppSettings } from "@/lib/settings-store";

export default function ConfiguracionPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({
    emailsAuditoria: [],
    nombreEntidad: "MAV S.A.",
    nombreArea: "Mesa de Operaciones",
  });
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSettings(settingsStore.get());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  function agregarEmail() {
    const email = nuevoEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Ingresá un email válido.");
      return;
    }
    if (settings.emailsAuditoria.includes(email)) {
      setEmailError("Ese email ya está en la lista.");
      return;
    }
    setSettings((prev) => ({
      ...prev,
      emailsAuditoria: [...prev.emailsAuditoria, email],
    }));
    setNuevoEmail("");
    setEmailError("");
  }

  function quitarEmail(email: string) {
    setSettings((prev) => ({
      ...prev,
      emailsAuditoria: prev.emailsAuditoria.filter((e) => e !== email),
    }));
  }

  function guardar() {
    settingsStore.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <a href="/" className="hover:text-slate-600">Panel</a>
        <span>/</span>
        <span className="text-slate-700 font-medium">Configuración</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Configuración</h1>
      <p className="text-sm text-slate-500 mb-8">
        Definí los parámetros globales del sistema (solo accesible para el administrador).
      </p>

      {/* Sección: Entidad */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 mb-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Datos de la entidad</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Nombre de la entidad
            </label>
            <input
              type="text"
              value={settings.nombreEntidad}
              onChange={(e) => setSettings((p) => ({ ...p, nombreEntidad: e.target.value }))}
              className="input-field w-full"
              placeholder="Ej: MAV S.A."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Área responsable
            </label>
            <input
              type="text"
              value={settings.nombreArea}
              onChange={(e) => setSettings((p) => ({ ...p, nombreArea: e.target.value }))}
              className="input-field w-full"
              placeholder="Ej: Mesa de Operaciones"
            />
          </div>
        </div>
      </div>

      {/* Sección: Cadena de auditoría */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 mb-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700">Cadena de auditoría / Compliance</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Estos emails aparecerán pre-cargados en el campo <strong>Para (TO)</strong> cuando se envíe
            una solicitud de excepción por operación No Aceptable. El analista agrega a su superior en CC.
          </p>
        </div>

        {/* Lista actual */}
        {settings.emailsAuditoria.length > 0 ? (
          <div className="space-y-2 mb-4">
            {settings.emailsAuditoria.map((email) => (
              <div key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <span className="text-sm font-mono text-slate-700">{email}</span>
                <button
                  onClick={() => quitarEmail(email)}
                  className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                  title="Quitar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No hay destinatarios configurados todavía.
          </div>
        )}

        {/* Agregar email */}
        <div className="flex gap-2">
          <input
            type="email"
            value={nuevoEmail}
            onChange={(e) => { setNuevoEmail(e.target.value); setEmailError(""); }}
            onKeyDown={(e) => e.key === "Enter" && agregarEmail()}
            className="input-field flex-1"
            placeholder="auditoria@empresa.com"
          />
          <button
            onClick={agregarEmail}
            className="btn-secondary text-sm px-4"
          >
            + Agregar
          </button>
        </div>
        {emailError && (
          <p className="text-xs text-red-600 mt-1">{emailError}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3">
        <button
          onClick={guardar}
          className="btn-primary"
        >
          {saved ? "✓ Guardado" : "Guardar configuración"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="btn-secondary"
        >
          Volver al panel
        </button>
      </div>
    </div>
  );
}
