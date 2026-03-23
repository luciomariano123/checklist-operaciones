"use client";

import type { Caso } from "@/types";
import { calcularEstadoGeneral, calcularMetricas, evaluarChecklistItem } from "@/lib/calculations";
import { CHECKLIST_ITEMS } from "@/lib/checklist-config";
import { EstadoGeneralBadge, StatusBadge } from "@/components/ui/StatusBadge";

interface Props {
  caso: Partial<Caso>;
}

export function ResultPanel({ caso }: Props) {
  if (!caso.checklist || !caso.metricas) return null;

  const { estado, motivos } = calcularEstadoGeneral(caso.checklist, caso.metricas);
  const calc = calcularMetricas(caso.metricas);

  const docsCount = caso.documentos?.length ?? 0;

  return (
    <div className="section-card">
      <div className="px-6 py-4 border-b border-slate-100">
        <p className="section-title">Resultado final de la evaluación</p>
      </div>
      <div className="px-6 py-5 space-y-5">
        {/* Estado general */}
        <EstadoGeneralBadge estado={estado} />

        {/* Motivos */}
        {motivos.length > 0 && (
          <div
            className={`rounded-lg border p-4 ${
              estado === "no_aceptable" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              estado === "no_aceptable" ? "text-red-700" : "text-amber-700"
            }`}>
              {estado === "no_aceptable" ? "Motivos de rechazo" : "Aspectos pendientes"}
            </p>
            <ul className="space-y-1">
              {motivos.map((m, i) => (
                <li key={i} className={`text-sm flex items-start gap-2 ${
                  estado === "no_aceptable" ? "text-red-700" : "text-amber-700"
                }`}>
                  <span className="mt-0.5 flex-shrink-0">
                    {estado === "no_aceptable" ? "✗" : "~"}
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resumen por sección */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            title="Documentos"
            value={`${docsCount}`}
            sub="archivos cargados"
            icon="📎"
          />
          <SummaryCard
            title="Checklist"
            value={`${caso.checklist.filter((i) => evaluarChecklistItem(i.id, i.respuesta, i.archivoIds) === "aceptable").length} / ${caso.checklist.length}`}
            sub="criterios OK"
            icon="✓"
            ok={caso.checklist.every((i) => evaluarChecklistItem(i.id, i.respuesta, i.archivoIds) !== "no_aceptable")}
          />
          <SummaryCard
            title="Patrimonio Neto"
            value={calc.patrimonioNeto !== null ? `$ ${formatCurrency(calc.patrimonioNeto)}` : "—"}
            sub="del último EECC"
            icon="📊"
          />
        </div>

        {/* Detalle por ítem del checklist */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Detalle checklist
          </p>
          <div className="space-y-1">
            {caso.checklist.map((item) => {
              const def = CHECKLIST_ITEMS.find((d) => d.id === item.id);
              if (!def) return null;
              const estado = evaluarChecklistItem(item.id, item.respuesta, item.archivoIds);
              return (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-4">{item.id}.</span>
                    <p className="text-xs text-slate-700 truncate max-w-xs">{def.titulo}</p>
                  </div>
                  <StatusBadge estado={estado} size="sm" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>Responsable: <strong className="text-slate-600">{caso.actualizadoPor || caso.creadoPor || "—"}</strong></span>
          {caso.actualizadoEn && (
            <span>
              Última actualización:{" "}
              <strong className="text-slate-600">
                {new Date(caso.actualizadoEn).toLocaleString("es-AR")}
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
  icon,
  ok,
}: {
  title: string;
  value: string;
  sub: string;
  icon: string;
  ok?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-lg font-bold ${ok === true ? "text-emerald-700" : ok === false ? "text-red-700" : "text-slate-800"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{sub}</p>
      <p className="text-xs font-medium text-slate-600 mt-0.5">{title}</p>
    </div>
  );
}

function formatCurrency(val: number | null): string {
  if (val === null) return "—";
  return new Intl.NumberFormat("es-AR").format(val);
}
