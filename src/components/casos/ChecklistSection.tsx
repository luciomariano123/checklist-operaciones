"use client";

import { useState } from "react";
import type { ChecklistItemData } from "@/types";
import { CHECKLIST_ITEMS } from "@/lib/checklist-config";
import { evaluarChecklistItem } from "@/lib/calculations";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface Props {
  items: ChecklistItemData[];
  onChange: (items: ChecklistItemData[]) => void;
  readOnly?: boolean;
  adminOverride?: boolean;
}

export function ChecklistSection({ items, onChange, readOnly = false, adminOverride = false }: Props) {
  const updateItem = (id: number, patch: Partial<ChecklistItemData>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const countAceptables = items.filter(
    (i) => evaluarChecklistItem(i.id, i.respuesta, i.archivoIds, adminOverride) === "aceptable"
  ).length;
  const countRechazados = items.filter(
    (i) => evaluarChecklistItem(i.id, i.respuesta, i.archivoIds, adminOverride) === "no_aceptable"
  ).length;

  const badgeSummary = (
    <div className="flex gap-2">
      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
        {countAceptables} OK
      </span>
      {countRechazados > 0 && (
        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">
          {countRechazados} Rechazados
        </span>
      )}
    </div>
  );

  return (
    <CollapsibleSection
      title="Checklist excluyente"
      subtitle="14 criterios de evaluación · Todos son excluyentes"
      defaultOpen
      badge={badgeSummary}
    >
      <div className="mt-4 space-y-3">
        {CHECKLIST_ITEMS.map((def) => {
          const itemData = items.find((i) => i.id === def.id);
          if (!itemData) return null;
          const estado = evaluarChecklistItem(def.id, itemData.respuesta, itemData.archivoIds, adminOverride);

          return (
            <ChecklistRow
              key={def.id}
              def={def}
              itemData={itemData}
              estado={estado}
              readOnly={readOnly}
              adminOverride={adminOverride}
              onUpdate={(patch) => updateItem(def.id, patch)}
            />
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

interface RowProps {
  def: (typeof CHECKLIST_ITEMS)[0];
  itemData: ChecklistItemData;
  estado: ReturnType<typeof evaluarChecklistItem>;
  readOnly: boolean;
  adminOverride: boolean;
  onUpdate: (patch: Partial<ChecklistItemData>) => void;
}

function ChecklistRow({ def, itemData, estado, readOnly, adminOverride, onUpdate }: RowProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        estado === "no_aceptable"
          ? "border-red-200 bg-red-50"
          : estado === "aceptable"
          ? "border-emerald-100 bg-emerald-50/40"
          : estado === "pendiente"
          ? "border-amber-100 bg-amber-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Number */}
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
            {def.id}
          </span>

          {/* Title + controls */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-800 leading-snug">{def.titulo}</p>
              <StatusBadge estado={estado} size="sm" />
            </div>

            {/* Si/No selector */}
            {!readOnly && (
              <div className="flex items-center gap-2 mt-2">
                <RespuestaButton
                  value="si"
                  current={itemData.respuesta}
                  onClick={() => onUpdate({ respuesta: "si" })}
                  label="Sí"
                />
                <RespuestaButton
                  value="no"
                  current={itemData.respuesta}
                  onClick={() => onUpdate({ respuesta: "no" })}
                  label="No"
                />
                {itemData.respuesta !== null && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ respuesta: null })}
                    className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            )}

            {/* Alert for ítem 1 */}
            {def.id === 1 && itemData.respuesta === "si" && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Sujeto a documentación respaldatoria
                {itemData.archivoIds.length === 0 && !adminOverride && (
                  <span className="text-red-600 font-semibold ml-1">· Documentación pendiente</span>
                )}
                {itemData.archivoIds.length === 0 && adminOverride && (
                  <span className="text-amber-600 font-semibold ml-1">· Salteado por Admin</span>
                )}
              </div>
            )}

            {/* Observación */}
            {!readOnly && itemData.respuesta !== null && (
              <div className="mt-2">
                <textarea
                  value={itemData.observacion}
                  onChange={(e) => onUpdate({ observacion: e.target.value })}
                  placeholder="Observación opcional..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                />
              </div>
            )}

            {readOnly && itemData.observacion && (
              <p className="mt-1 text-xs text-slate-500 italic">{itemData.observacion}</p>
            )}

            {/* Help toggle */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              {showHelp ? "Ocultar ayuda" : "Ver ayuda / glosario"}
            </button>

            {showHelp && (
              <div className="mt-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                {def.textoAyuda}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RespuestaButton({
  value,
  current,
  onClick,
  label,
}: {
  value: "si" | "no";
  current: "si" | "no" | null;
  onClick: () => void;
  label: string;
}) {
  const isSelected = current === value;
  const colorMap = {
    si: isSelected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400",
    no: isSelected ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-300 hover:border-red-400",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold border rounded-md transition-colors ${colorMap[value]}`}
    >
      {label}
    </button>
  );
}
