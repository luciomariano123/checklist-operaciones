import { CasoForm } from "@/components/casos/CasoForm";

export default function NuevoCasoPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3">
          ← Panel de evaluaciones
        </a>
        <h1 className="text-2xl font-bold text-slate-900">Nueva evaluación</h1>
        <p className="text-slate-500 text-sm mt-1">
          Completá el formulario de control para cheques no garantizados
        </p>
      </div>

      <CasoForm />
    </div>
  );
}
