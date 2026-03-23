import { CasosList } from "@/components/casos/CasosList";

export default function HomePage() {
  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Panel de evaluaciones</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cheques de pago diferido no garantizados · Control y análisis de riesgo
        </p>
      </div>

      <CasosList />
    </div>
  );
}
