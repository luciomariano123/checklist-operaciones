"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Caso } from "@/types";
import { store } from "@/lib/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCUIT } from "@/lib/bcra-utils";

export function CasosList() {
  const router = useRouter();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCasos(store.getAll());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const casosFiltrados = casos.filter((c) => {
    const matchBusqueda =
      !busqueda ||
      c.denominacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.cuit.includes(busqueda.replace(/[-\s]/g, "")) ||
      c.numeroCuentaComitente?.includes(busqueda);

    const matchEstado =
      filtroEstado === "todos" || c.estadoGeneral === filtroEstado;

    return matchBusqueda && matchEstado;
  });

  const stats = {
    total: casos.length,
    aceptable: casos.filter((c) => c.estadoGeneral === "aceptable").length,
    no_aceptable: casos.filter((c) => c.estadoGeneral === "no_aceptable").length,
    pendiente: casos.filter((c) => c.estadoGeneral === "pendiente").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="indigo" />
        <StatCard label="Aceptables" value={stats.aceptable} color="emerald" />
        <StatCard label="No Aceptables" value={stats.no_aceptable} color="red" />
        <StatCard label="Pendientes" value={stats.pendiente} color="amber" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por CUIT, razón social o cuenta..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="aceptable">Aceptable</option>
          <option value="no_aceptable">No Aceptable</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <button
          onClick={() => router.push("/casos/nuevo")}
          className="btn-primary whitespace-nowrap"
        >
          + Nueva evaluación
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {casosFiltrados.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 text-sm">
              {casos.length === 0
                ? "No hay evaluaciones cargadas. Creá la primera."
                : "No se encontraron resultados para los filtros aplicados."}
            </p>
            {casos.length === 0 && (
              <button
                onClick={() => router.push("/casos/nuevo")}
                className="btn-primary mt-4"
              >
                + Crear primera evaluación
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CUIT</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuenta</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Op.</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Docs</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {casosFiltrados.map((caso) => (
                <tr
                  key={caso.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/casos/${caso.id}`)}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{caso.denominacion || "—"}</p>
                    <p className="text-xs text-slate-400">{caso.moneda} · {caso.plazo || "—"}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-600 text-xs">
                    {formatCUIT(caso.cuit)}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-500 text-xs">
                    {caso.numeroCuentaComitente || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        caso.tipoOperacion === "compra"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {caso.tipoOperacion}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {caso.fechaOperacion
                      ? new Date(caso.fechaOperacion).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge estado={caso.estadoGeneral} size="sm" />
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs text-center">
                    {caso.documentos?.length ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/casos/${caso.id}`)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => router.push(`/casos/${caso.id}/editar`)}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar evaluación de ${caso.denominacion}?`)) {
                            store.delete(caso.id);
                            setCasos(store.getAll());
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}
