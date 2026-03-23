"use client";

import { useState } from "react";
import type { MetricasInput } from "@/types";
import type { EstadoItem } from "@/types";
import {
  calcularMetricas,
  evaluarMetricas,
  formatCurrency,
  formatPct,
  formatRatio,
} from "@/lib/calculations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface Props {
  metricas: MetricasInput;
  onChange: (metricas: MetricasInput) => void;
  readOnly?: boolean;
}

export function FinancialsSection({ metricas, onChange, readOnly = false }: Props) {
  const calc = calcularMetricas(metricas);
  const estados = evaluarMetricas(calc);

  const update = (field: keyof MetricasInput, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      onChange({ ...metricas, [field]: null });
      return;
    }
    const val = parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
    onChange({ ...metricas, [field]: isNaN(val) ? null : val });
  };

  const allOk =
    estados.lineaPN === "aceptable" &&
    estados.liquidezCorriente === "aceptable" &&
    estados.fondeoPropio === "aceptable";

  const anyBad =
    estados.lineaPN === "no_aceptable" ||
    estados.liquidezCorriente === "no_aceptable" ||
    estados.fondeoPropio === "no_aceptable";

  const badgeSummary = anyBad ? (
    <StatusBadge estado="no_aceptable" size="sm" />
  ) : allOk ? (
    <StatusBadge estado="aceptable" size="sm" />
  ) : (
    <StatusBadge estado="pendiente" size="sm" />
  );

  return (
    <CollapsibleSection
      title="Datos contables y métricas"
      subtitle="Balance · Cálculos automáticos"
      defaultOpen
      badge={badgeSummary}
    >
      <div className="mt-4 space-y-6">
        {/* Inputs */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Datos de entrada (del último EECC)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyField
              label="Activo Corriente"
              value={metricas.activoCorriente}
              onChange={(v) => update("activoCorriente", v)}
              readOnly={readOnly}
            />
            <CurrencyField
              label="Activo No Corriente"
              value={metricas.activoNoCorriente}
              onChange={(v) => update("activoNoCorriente", v)}
              readOnly={readOnly}
            />
            <CurrencyField
              label="Pasivo Corriente"
              value={metricas.pasivoCorriente}
              onChange={(v) => update("pasivoCorriente", v)}
              readOnly={readOnly}
            />
            <CurrencyField
              label="Pasivo No Corriente"
              value={metricas.pasivoNoCorriente}
              onChange={(v) => update("pasivoNoCorriente", v)}
              readOnly={readOnly}
            />
            <div className="col-span-2">
              <CurrencyField
                label="Línea solicitada"
                value={metricas.lineaSolicitada}
                onChange={(v) => update("lineaSolicitada", v)}
                readOnly={readOnly}
                highlight
              />
            </div>
          </div>
        </div>

        {/* Cálculos automáticos */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Cálculos automáticos
          </p>
          <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-100">
            <CalcRow label="Activo Total" value={`$ ${formatCurrency(calc.activoTotal)}`} formula="AC + ANC" />
            <CalcRow label="Pasivo Total" value={`$ ${formatCurrency(calc.pasivoTotal)}`} formula="PC + PNC" />
            <CalcRow
              label="Patrimonio Neto"
              value={`$ ${formatCurrency(calc.patrimonioNeto)}`}
              formula="Activo Total − Pasivo Total"
              highlight={calc.patrimonioNeto !== null && calc.patrimonioNeto < 0}
            />
          </div>
        </div>

        {/* Indicadores con estado */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Indicadores de aceptación
          </p>
          <div className="space-y-3">
            <MetricaCard
              label="Línea / Patrimonio Neto"
              value={calc.lineaPN !== null ? formatPct(calc.lineaPN) : "—"}
              estado={estados.lineaPN}
              regla="Debe ser ≤ 10%"
              ayuda="La línea solicitada debe representar menos del 10% del patrimonio neto del cliente."
              detalle={
                calc.lineaPN !== null
                  ? `${formatCurrency(metricas.lineaSolicitada)} / ${formatCurrency(calc.patrimonioNeto)}`
                  : undefined
              }
            />
            <MetricaCard
              label="Liquidez Corriente"
              value={calc.liquidezCorriente !== null ? formatRatio(calc.liquidezCorriente) : "—"}
              estado={estados.liquidezCorriente}
              regla="Debe ser ≥ 1x"
              ayuda="Los activos corrientes deben superar los pasivos corrientes. Ratio mínimo de 1x."
              detalle={
                calc.liquidezCorriente !== null
                  ? `${formatCurrency(metricas.activoCorriente)} / ${formatCurrency(metricas.pasivoCorriente)}`
                  : undefined
              }
            />
            <MetricaCard
              label="Fondeo Propio"
              value={calc.fondeoPropio !== null ? formatPct(calc.fondeoPropio) : "—"}
              estado={estados.fondeoPropio}
              regla="Debe ser ≥ 20%"
              ayuda="Mínimo 20% sujeto a análisis de composición del endeudamiento. Patrimonio Neto / Activo Total."
              detalle={
                calc.fondeoPropio !== null
                  ? `${formatCurrency(calc.patrimonioNeto)} / ${formatCurrency(calc.activoTotal)}`
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CurrencyField({
  label,
  value,
  onChange,
  readOnly,
  highlight,
}: {
  label: string;
  value: number | null;
  onChange: (v: string) => void;
  readOnly: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {readOnly ? (
        <p className={`text-sm font-medium ${highlight ? "text-indigo-700" : "text-slate-800"}`}>
          {value !== null ? `$ ${formatCurrency(value)}` : "—"}
        </p>
      ) : (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className={`field-input pl-7 ${highlight ? "border-indigo-300 bg-indigo-50/30" : ""}`}
          />
        </div>
      )}
    </div>
  );
}

function CalcRow({
  label,
  value,
  formula,
  highlight,
}: {
  label: string;
  value: string;
  formula: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div>
        <p className="text-sm text-slate-700 font-medium">{label}</p>
        <p className="text-xs text-slate-400">{formula}</p>
      </div>
      <p className={`text-sm font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function MetricaCard({
  label,
  value,
  estado,
  regla,
  ayuda,
  detalle,
}: {
  label: string;
  value: string;
  estado: EstadoItem;
  regla: string;
  ayuda: string;
  detalle?: string;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div
      className={`rounded-lg border p-4 ${
        estado === "no_aceptable"
          ? "border-red-200 bg-red-50"
          : estado === "aceptable"
          ? "border-emerald-100 bg-emerald-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">{regla}</p>
          {detalle && <p className="text-xs text-slate-400 mt-0.5">{detalle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <p
            className={`text-lg font-bold ${
              estado === "no_aceptable"
                ? "text-red-700"
                : estado === "aceptable"
                ? "text-emerald-700"
                : "text-slate-400"
            }`}
          >
            {value}
          </p>
          <StatusBadge estado={estado} size="sm" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700"
      >
        {showHelp ? "▲ Ocultar criterio" : "▼ Ver criterio"}
      </button>
      {showHelp && (
        <p className="mt-2 text-xs text-slate-600 bg-white rounded px-3 py-2 border border-slate-100">
          {ayuda}
        </p>
      )}
    </div>
  );
}
