"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Caso } from "@/types";
import { store } from "@/lib/store";
import { CasoForm } from "@/components/casos/CasoForm";
import { formatCUIT } from "@/lib/bcra-utils";

export default function EditarCasoPage() {
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
        <p className="text-slate-500">Evaluación no encontrada.</p>
        <button onClick={() => router.push("/")} className="btn-secondary mt-4">
          ← Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <a href="/" className="hover:text-slate-600">Panel</a>
          <span>/</span>
          <a href={`/casos/${caso.id}`} className="hover:text-slate-600">
            {caso.denominacion || formatCUIT(caso.cuit)}
          </a>
          <span>/</span>
          <span className="text-slate-700">Editar</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Editar evaluación — {caso.denominacion}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Modificá los datos de la evaluación. Los cambios quedarán registrados.
        </p>
      </div>

      <CasoForm caso={caso} />
    </div>
  );
}
