"use client";

import { useState, useEffect } from "react";
import type { BCRAStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SITUACIONES_BCRA } from "@/lib/checklist-config";

interface Props {
  cuit: string;
  onStatusLoaded?: (status: BCRAStatus) => void;
}

export function BCRAWidget({ cuit, onStatusLoaded }: Props) {
  const [status, setStatus] = useState<BCRAStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const cuitLimpio = cuit.replace(/[-\s]/g, "");

  async function consultar() {
    if (!cuitLimpio || cuitLimpio.length !== 11) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bcra?cuit=${cuitLimpio}`);
      const data: BCRAStatus = await res.json();
      setStatus(data);
      onStatusLoaded?.(data);
    } catch {
      setStatus({
        cuit: cuitLimpio,
        denominacion: "",
        situacionMaxima: 0,
        situacionTexto: "Error de conexión",
        estado: "sin_datos",
        ultimoPeriodo: "",
        detalle: [],
        error: "No se pudo conectar con la API del BCRA.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Auto-consultar cuando el CUIT tiene 11 dígitos
  useEffect(() => {
    if (cuitLimpio.length === 11) {
      consultar();
    } else {
      setStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuitLimpio]);

  if (!cuitLimpio || cuitLimpio.length < 11) {
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
        Ingresá el CUIT completo para consultar el estado en BCRA
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500">Consultando Central de Deudores BCRA...</span>
      </div>
    );
  }

  if (!status) return null;

  const bgColor =
    status.estado === "aceptable"
      ? "bg-emerald-50 border-emerald-200"
      : status.estado === "no_aceptable"
      ? "bg-red-50 border-red-200"
      : "bg-slate-50 border-slate-200";

  return (
    <div className={`mt-3 p-4 rounded-lg border ${bgColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              BCRA · Central de Deudores
            </p>
            <StatusBadge estado={status.estado} size="sm" />
          </div>
          {status.denominacion && (
            <p className="text-sm font-medium text-slate-800">{status.denominacion}</p>
          )}
          {status.error ? (
            <p className="text-xs text-red-600 mt-1">{status.error}</p>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-600">
                <span className="font-medium">Situación:</span>{" "}
                <span
                  className={
                    status.situacionMaxima > 1 ? "text-red-700 font-semibold" : "text-emerald-700 font-semibold"
                  }
                >
                  {status.situacionMaxima} — {status.situacionTexto}
                </span>
              </p>
              {status.ultimoPeriodo && (
                <p className="text-xs text-slate-500">
                  Último período consultado: {formatPeriodo(status.ultimoPeriodo)}
                </p>
              )}
              {status.detalle.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-indigo-600 cursor-pointer hover:underline">
                    Ver detalle por entidad ({status.detalle.length})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {status.detalle.map((e, i) => (
                      <div key={i} className={`text-xs text-slate-600 rounded px-3 py-1.5 border ${e.situacion > 1 ? "border-red-200 bg-red-50 text-red-700" : "border-slate-100 bg-white"}`}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <span className="font-medium">{(e as any).entidadNombre || `Entidad ${e.entidad}`}</span>{" "}·{" "}
                        <span className={e.situacion > 1 ? "font-semibold" : ""}>
                          Sit. {e.situacion} — {SITUACIONES_BCRA[e.situacion] || "—"}
                        </span>{" "}·{" "}
                        {e.monto ? `$${e.monto.toLocaleString("es-AR")}` : "Sin monto"}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={consultar}
          disabled={loading}
          className="text-xs text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}

function formatPeriodo(periodo: string): string {
  // Soporta "2024-01" y "202401"
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const str = periodo.replace("-", "");
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const m = parseInt(month) - 1;
  return `${months[m] ?? month} ${year}`;
}
