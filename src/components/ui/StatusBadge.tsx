"use client";

import type { EstadoItem, EstadoGeneral } from "@/types";

type EstadoAny = EstadoItem | EstadoGeneral;

const LABELS: Record<EstadoAny, string> = {
  aceptable: "Aceptable",
  no_aceptable: "No Aceptable",
  pendiente: "Pendiente",
  sin_datos: "Sin datos",
};

const DOTS: Record<EstadoAny, string> = {
  aceptable: "bg-emerald-500",
  no_aceptable: "bg-red-500",
  pendiente: "bg-amber-500",
  sin_datos: "bg-slate-400",
};

interface Props {
  estado: EstadoAny;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export function StatusBadge({ estado, size = "sm", showDot = true }: Props) {
  const cls = `badge-${estado}`;
  const dotCls = DOTS[estado];
  const label = LABELS[estado] || estado;

  const sizeMap = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeMap[size]} ${
        estado === "aceptable"
          ? "bg-emerald-100 text-emerald-800"
          : estado === "no_aceptable"
          ? "bg-red-100 text-red-800"
          : estado === "pendiente"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotCls}`} />
      )}
      {label}
    </span>
  );
}

export function EstadoGeneralBadge({ estado }: { estado: EstadoGeneral }) {
  const configs = {
    aceptable: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      icon: "✓",
      iconBg: "bg-emerald-500",
      label: "Aceptable",
    },
    no_aceptable: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "✗",
      iconBg: "bg-red-500",
      label: "No Aceptable",
    },
    pendiente: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: "~",
      iconBg: "bg-amber-500",
      label: "Pendiente / Sujeto a documentación",
    },
  };
  const c = configs[estado];
  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`w-10 h-10 rounded-full ${c.iconBg} flex items-center justify-center text-white font-bold text-lg`}>
        {c.icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Estado general</p>
        <p className={`text-lg font-bold ${c.text}`}>{c.label}</p>
      </div>
    </div>
  );
}
