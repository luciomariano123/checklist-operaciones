"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Caso, MetricasInput, ChecklistItemData, Documento } from "@/types";
import { crearChecklistVacio, calcularEstadoGeneral, generarId } from "@/lib/calculations";
import { store } from "@/lib/store";
import { formatCUIT } from "@/lib/bcra-utils";
import { MONEDAS, PLAZOS } from "@/lib/checklist-config";
import { BCRAWidget } from "@/components/bcra/BCRAWidget";
import { ChecklistSection } from "./ChecklistSection";
import { FinancialsSection } from "./FinancialsSection";
import { DocumentsSection } from "./DocumentsSection";
import { ResultPanel } from "./ResultPanel";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface Props {
  caso?: Caso; // si viene, es edición
}

const EMPTY_METRICAS: MetricasInput = {
  activoCorriente: null,
  activoNoCorriente: null,
  pasivoCorriente: null,
  pasivoNoCorriente: null,
  lineaSolicitada: null,
};

export function CasoForm({ caso }: Props) {
  const router = useRouter();
  const isEdit = !!caso;

  // ── Datos básicos ──────────────────────────────────────────────
  const [cuit, setCuit] = useState(caso?.cuit ?? "");
  const [denominacion, setDenominacion] = useState(caso?.denominacion ?? "");
  const [numeroCuenta, setNumeroCuenta] = useState(caso?.numeroCuentaComitente ?? "");
  const [moneda, setMoneda] = useState(caso?.moneda ?? "ARS");
  const [plazo, setPlazo] = useState(caso?.plazo ?? "");
  const [tipoOp, setTipoOp] = useState<"compra" | "venta">(caso?.tipoOperacion ?? "compra");
  const [fechaOp, setFechaOp] = useState(caso?.fechaOperacion ?? "");
  const [fechaEECC, setFechaEECC] = useState(caso?.fechaUltimoEECC ?? "");
  const [observaciones, setObservaciones] = useState(caso?.observaciones ?? "");

  // ── Checklist ─────────────────────────────────────────────────
  const [checklist, setChecklist] = useState<ChecklistItemData[]>(
    caso?.checklist ?? crearChecklistVacio()
  );

  // ── Métricas ──────────────────────────────────────────────────
  const [metricas, setMetricas] = useState<MetricasInput>(caso?.metricas ?? EMPTY_METRICAS);

  // ── Documentos ────────────────────────────────────────────────
  const [documentos, setDocumentos] = useState<Documento[]>(caso?.documentos ?? []);

  // ── BCRA ──────────────────────────────────────────────────────
  const handleBCRALoaded = useCallback(
    (status: import("@/types").BCRAStatus) => {
      if (!denominacion && status.denominacion) {
        setDenominacion(status.denominacion);
      }
      // Auto-completar ítem 7 si la situación es clara
      if (status.estado !== "sin_datos") {
        const sitMayor1 = status.situacionMaxima > 1; // Si=NoAceptable, No=Aceptable
        setChecklist((prev) =>
          prev.map((item) =>
            item.id === 7
              ? { ...item, respuesta: sitMayor1 ? "si" : "no" }
              : item
          )
        );
      }
    },
    [denominacion]
  );

  // ── Resultado live ────────────────────────────────────────────
  const { estado, motivos } = calcularEstadoGeneral(checklist, metricas);

  // ── Submit ────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: Omit<Caso, "id" | "creadoEn" | "actualizadoEn"> = {
      cuit: cuit.replace(/[-\s]/g, ""),
      denominacion,
      numeroCuentaComitente: numeroCuenta,
      moneda,
      plazo,
      tipoOperacion: tipoOp,
      fechaOperacion: fechaOp,
      fechaUltimoEECC: fechaEECC,
      observaciones,
      checklist,
      metricas,
      documentos: documentos.map((d) => ({ ...d, casoId: caso?.id ?? "" })),
      estadoGeneral: estado,
      motivosRechazo: motivos,
      creadoPor: caso?.creadoPor ?? "Usuario",
      actualizadoPor: "Usuario",
      historial: caso?.historial ?? [],
      observacionesInternas: caso?.observacionesInternas ?? [],
    };

    try {
      if (isEdit && caso) {
        store.update(caso.id, payload);
        router.push(`/casos/${caso.id}`);
      } else {
        const nuevo = store.create(payload);
        router.push(`/casos/${nuevo.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBorrador = () => {
    // Guardar sin navegar
    const payload: Omit<Caso, "id" | "creadoEn" | "actualizadoEn"> = {
      cuit: cuit.replace(/[-\s]/g, ""),
      denominacion,
      numeroCuentaComitente: numeroCuenta,
      moneda,
      plazo,
      tipoOperacion: tipoOp,
      fechaOperacion: fechaOp,
      fechaUltimoEECC: fechaEECC,
      observaciones,
      checklist,
      metricas,
      documentos,
      estadoGeneral: estado,
      motivosRechazo: motivos,
      creadoPor: caso?.creadoPor ?? "Usuario",
      actualizadoPor: "Usuario",
      historial: caso?.historial ?? [],
      observacionesInternas: caso?.observacionesInternas ?? [],
    };
    if (isEdit && caso) {
      store.update(caso.id, payload);
    } else {
      store.create(payload);
    }
    alert("Borrador guardado correctamente.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ─── Datos del cliente ─────────────────────────────────── */}
      <CollapsibleSection title="Datos del cliente / operación" defaultOpen>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* CUIT */}
          <div>
            <label className="field-label">CUIT *</label>
            <input
              type="text"
              value={cuit}
              onChange={(e) => setCuit(formatCUIT(e.target.value))}
              placeholder="20-12345678-9"
              maxLength={13}
              className="field-input font-mono"
              required
            />
            <BCRAWidget cuit={cuit} onStatusLoaded={handleBCRALoaded} />
          </div>

          {/* Denominación */}
          <div>
            <label className="field-label">Denominación / Razón social *</label>
            <input
              type="text"
              value={denominacion}
              onChange={(e) => setDenominacion(e.target.value)}
              placeholder="Empresa S.A."
              className="field-input"
              required
            />
          </div>

          {/* Cuenta comitente */}
          <div>
            <label className="field-label">N° Cuenta comitente</label>
            <input
              type="text"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              placeholder="000-000000-0"
              className="field-input font-mono"
            />
          </div>

          {/* Moneda */}
          <div>
            <label className="field-label">Moneda</label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="field-select"
            >
              {MONEDAS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Plazo */}
          <div>
            <label className="field-label">Plazo aproximado</label>
            <select
              value={plazo}
              onChange={(e) => setPlazo(e.target.value)}
              className="field-select"
            >
              <option value="">— Seleccionar —</option>
              {PLAZOS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Tipo de operación */}
          <div>
            <label className="field-label">Tipo de operación</label>
            <div className="flex gap-2 mt-1">
              {(["compra", "venta"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoOp(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors capitalize ${
                    tipoOp === t
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha operación */}
          <div>
            <label className="field-label">Fecha de la operación</label>
            <input
              type="date"
              value={fechaOp}
              onChange={(e) => setFechaOp(e.target.value)}
              className="field-input"
            />
          </div>

          {/* Fecha último EECC */}
          <div>
            <label className="field-label">Fecha del último EECC disponible</label>
            <input
              type="date"
              value={fechaEECC}
              onChange={(e) => setFechaEECC(e.target.value)}
              className="field-input"
            />
          </div>

          {/* Observaciones */}
          <div className="col-span-2">
            <label className="field-label">Observaciones internas</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Notas del analista..."
              className="field-input resize-none"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── Checklist ─────────────────────────────────────────── */}
      <ChecklistSection items={checklist} onChange={setChecklist} />

      {/* ─── Métricas ──────────────────────────────────────────── */}
      <FinancialsSection metricas={metricas} onChange={setMetricas} />

      {/* ─── Documentación ─────────────────────────────────────── */}
      <DocumentsSection documentos={documentos} onChange={setDocumentos} />

      {/* ─── Resultado live ────────────────────────────────────── */}
      <ResultPanel
        caso={{
          cuit,
          denominacion,
          checklist,
          metricas,
          documentos,
          estadoGeneral: estado,
          motivosRechazo: motivos,
          creadoPor: "Usuario",
          actualizadoPor: "Usuario",
        }}
      />

      {/* ─── Botones ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          ← Volver
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBorrador}
            className="btn-secondary"
          >
            Guardar borrador
          </button>
          <button
            type="submit"
            disabled={saving || !cuit || !denominacion}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : isEdit ? "Actualizar evaluación" : "Crear evaluación"}
          </button>
        </div>
      </div>
    </form>
  );
}
