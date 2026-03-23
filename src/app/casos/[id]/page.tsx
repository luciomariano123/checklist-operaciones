"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Caso } from "@/types";
import { store } from "@/lib/store";
import { formatCUIT } from "@/lib/bcra-utils";
import { StatusBadge, EstadoGeneralBadge } from "@/components/ui/StatusBadge";
import { ChecklistSection } from "@/components/casos/ChecklistSection";
import { FinancialsSection } from "@/components/casos/FinancialsSection";
import { DocumentsSection } from "@/components/casos/DocumentsSection";
import { ResultPanel } from "@/components/casos/ResultPanel";
import { BCRAWidget } from "@/components/bcra/BCRAWidget";

export default function DetalleCasoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const found = store.getById(id);
    setCaso(found ?? null);
    setMounted(true);
  }, [id]);

  if (!mounted) return null;

  if (!caso) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-slate-500">Evaluación no encontrada.</p>
        <button onClick={() => router.push("/")} className="btn-secondary mt-4">
          ← Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <a href="/" className="hover:text-slate-600">Panel</a>
        <span>/</span>
        <span className="text-slate-700 font-medium">{caso.denominacion || formatCUIT(caso.cuit)}</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{caso.denominacion}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-sm text-slate-500">{formatCUIT(caso.cuit)}</span>
            {caso.numeroCuentaComitente && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-sm text-slate-500">Cta. {caso.numeroCuentaComitente}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                caso.tipoOperacion === "compra"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {caso.tipoOperacion}
            </span>
            <span className="text-slate-300">·</span>
            <StatusBadge estado={caso.estadoGeneral} size="sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/casos/${caso.id}/editar`)}
            className="btn-secondary"
          >
            Editar evaluación
          </button>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 mb-4">
        <p className="section-title mb-4">Datos de la operación</p>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <FieldView label="CUIT" value={formatCUIT(caso.cuit)} mono />
          <FieldView label="Razón social" value={caso.denominacion} />
          <FieldView label="N° Cuenta comitente" value={caso.numeroCuentaComitente} mono />
          <FieldView label="Moneda" value={caso.moneda} />
          <FieldView label="Plazo" value={caso.plazo} />
          <FieldView label="Tipo de operación" value={caso.tipoOperacion} capitalize />
          <FieldView
            label="Fecha de operación"
            value={caso.fechaOperacion ? new Date(caso.fechaOperacion).toLocaleDateString("es-AR") : undefined}
          />
          <FieldView
            label="Fecha último EECC"
            value={caso.fechaUltimoEECC ? new Date(caso.fechaUltimoEECC).toLocaleDateString("es-AR") : undefined}
          />
        </div>
        {caso.observaciones && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-1">Observaciones internas</p>
            <p className="text-sm text-slate-700">{caso.observaciones}</p>
          </div>
        )}

        {/* BCRA Widget en modo detalle */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-400 mb-1">Verificación BCRA</p>
          <BCRAWidget cuit={caso.cuit} />
        </div>
      </div>

      {/* Resultado */}
      <div className="mb-4">
        <ResultPanel caso={caso} />
      </div>

      {/* Checklist read-only */}
      <div className="mb-4">
        <ChecklistSection
          items={caso.checklist}
          onChange={() => {}}
          readOnly
        />
      </div>

      {/* Métricas read-only */}
      <div className="mb-4">
        <FinancialsSection
          metricas={caso.metricas}
          onChange={() => {}}
          readOnly
        />
      </div>

      {/* Documentos read-only */}
      <div className="mb-4">
        <DocumentsSection
          documentos={caso.documentos}
          onChange={() => {}}
          readOnly
        />
      </div>

      {/* Historial */}
      {caso.historial && caso.historial.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
          <p className="section-title mb-4">Historial de cambios</p>
          <div className="space-y-2">
            {caso.historial.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-xs text-slate-600">
                <span className="text-slate-400">{new Date(h.fecha).toLocaleString("es-AR")}</span>
                <span className="font-medium">{h.usuario}</span>
                <span>modificó <strong>{h.campo}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-xs text-slate-400 text-center">
        Creado por {caso.creadoPor} el{" "}
        {new Date(caso.creadoEn).toLocaleString("es-AR")}
        {caso.actualizadoEn !== caso.creadoEn && (
          <> · Actualizado el {new Date(caso.actualizadoEn).toLocaleString("es-AR")}</>
        )}
      </div>
    </div>
  );
}

function FieldView({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p
        className={`text-sm text-slate-800 mt-0.5 ${mono ? "font-mono" : ""} ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
