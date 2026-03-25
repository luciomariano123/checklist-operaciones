import type {
  ChecklistItemData,
  EstadoItem,
  EstadoGeneral,
  MetricasInput,
  MetricasCalculadas,
  MetricaEstado,
  Documento,
} from "@/types";
import { CHECKLIST_ITEMS, CATEGORIAS_OBLIGATORIAS } from "./checklist-config";

// ─── Métricas financieras ────────────────────────────────────────────────────

export function calcularMetricas(input: MetricasInput): MetricasCalculadas {
  const { activoCorriente, activoNoCorriente, pasivoCorriente, pasivoNoCorriente, lineaSolicitada } = input;

  const activoTotal =
    activoCorriente !== null && activoNoCorriente !== null
      ? activoCorriente + activoNoCorriente
      : null;

  const pasivoTotal =
    pasivoCorriente !== null && pasivoNoCorriente !== null
      ? pasivoCorriente + pasivoNoCorriente
      : null;

  const patrimonioNeto =
    activoTotal !== null && pasivoTotal !== null
      ? activoTotal - pasivoTotal
      : null;

  const lineaPN =
    lineaSolicitada !== null && patrimonioNeto !== null && patrimonioNeto !== 0
      ? lineaSolicitada / patrimonioNeto
      : null;

  const liquidezCorriente =
    activoCorriente !== null && pasivoCorriente !== null && pasivoCorriente !== 0
      ? activoCorriente / pasivoCorriente
      : null;

  const fondeoPropio =
    patrimonioNeto !== null && activoTotal !== null && activoTotal !== 0
      ? patrimonioNeto / activoTotal
      : null;

  return { activoTotal, pasivoTotal, patrimonioNeto, lineaPN, liquidezCorriente, fondeoPropio };
}

export function evaluarMetricas(calc: MetricasCalculadas): MetricaEstado {
  const evalLineaPN = (): EstadoItem => {
    if (calc.lineaPN === null) return "sin_datos";
    return calc.lineaPN > 0.1 ? "no_aceptable" : "aceptable";
  };

  const evalLiquidez = (): EstadoItem => {
    if (calc.liquidezCorriente === null) return "sin_datos";
    return calc.liquidezCorriente < 1 ? "no_aceptable" : "aceptable";
  };

  const evalFondeo = (): EstadoItem => {
    if (calc.fondeoPropio === null) return "sin_datos";
    return calc.fondeoPropio < 0.2 ? "no_aceptable" : "aceptable";
  };

  return {
    lineaPN: evalLineaPN(),
    liquidezCorriente: evalLiquidez(),
    fondeoPropio: evalFondeo(),
  };
}

// ─── Checklist ───────────────────────────────────────────────────────────────

export function evaluarChecklistItem(
  itemId: number,
  respuesta: "si" | "no" | null,
  archivoIds: string[]
): EstadoItem {
  if (respuesta === null) return "pendiente";

  const def = CHECKLIST_ITEMS.find((i) => i.id === itemId);
  if (!def) return "sin_datos";

  if (respuesta === "si") {
    const estadoBase = def.siAceptable ? "aceptable" : "no_aceptable";
    // Ítem 1: si dice "Sí" pero no tiene documentación, queda pendiente
    if (def.requiereDocumentacion && archivoIds.length === 0) {
      return "pendiente";
    }
    return estadoBase;
  } else {
    // respuesta = "no"
    return def.siAceptable ? "no_aceptable" : "aceptable";
  }
}

// ─── Estado general ──────────────────────────────────────────────────────────

export function calcularEstadoGeneral(
  checklist: ChecklistItemData[],
  metricas: MetricasInput,
  documentos: Documento[] = [],
  adminOverride = false
): { estado: EstadoGeneral; motivos: string[] } {
  const motivos: string[] = [];

  // Evaluar checklist
  for (const item of checklist) {
    const def = CHECKLIST_ITEMS.find((d) => d.id === item.id);
    if (!def) continue;
    const estado = evaluarChecklistItem(item.id, item.respuesta, item.archivoIds);
    if (estado === "no_aceptable") {
      motivos.push(`Criterio excluyente: "${def.titulo}"`);
    }
  }

  // Evaluar métricas
  const calc = calcularMetricas(metricas);
  const metEstado = evaluarMetricas(calc);

  if (metEstado.lineaPN === "no_aceptable") {
    const pct = calc.lineaPN !== null ? ` (${formatPct(calc.lineaPN)})` : "";
    motivos.push(`Línea / Patrimonio Neto supera el 10%${pct}`);
  }
  if (metEstado.liquidezCorriente === "no_aceptable") {
    const val = calc.liquidezCorriente !== null ? ` (${calc.liquidezCorriente.toFixed(2)}x)` : "";
    motivos.push(`Liquidez corriente menor a 1x${val}`);
  }
  if (metEstado.fondeoPropio === "no_aceptable") {
    const pct = calc.fondeoPropio !== null ? ` (${formatPct(calc.fondeoPropio)})` : "";
    motivos.push(`Fondeo propio menor al 20%${pct}`);
  }

  if (motivos.length > 0) {
    return { estado: "no_aceptable", motivos };
  }

  // Verificar pendientes
  const hayPendiente = checklist.some(
    (item) => evaluarChecklistItem(item.id, item.respuesta, item.archivoIds) === "pendiente"
  );
  const faltanMetricas =
    metEstado.lineaPN === "sin_datos" ||
    metEstado.liquidezCorriente === "sin_datos" ||
    metEstado.fondeoPropio === "sin_datos";

  // Verificar documentos obligatorios (NOSIS, DDJJ) — omitir si admin override
  const docsObligatoriosFaltantes = adminOverride
    ? []
    : CATEGORIAS_OBLIGATORIAS.filter((cat) => !documentos.some((d) => d.categoria === cat));

  if (hayPendiente || faltanMetricas || docsObligatoriosFaltantes.length > 0) {
    const pendMotivos: string[] = [];
    checklist.forEach((item) => {
      const estado = evaluarChecklistItem(item.id, item.respuesta, item.archivoIds);
      if (estado === "pendiente") {
        const def = CHECKLIST_ITEMS.find((d) => d.id === item.id);
        if (def) pendMotivos.push(`Pendiente: "${def.titulo}"`);
      }
    });
    if (faltanMetricas) pendMotivos.push("Faltan datos financieros para calcular métricas");
    const LABELS: Record<string, string> = { nosis: "Informe NOSIS", ddjj: "DDJJ (Declaración Jurada)" };
    docsObligatoriosFaltantes.forEach((cat) =>
      pendMotivos.push(`Documento obligatorio faltante: ${LABELS[cat] ?? cat}`)
    );
    return { estado: "pendiente", motivos: pendMotivos };
  }

  return { estado: "aceptable", motivos: [] };
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRatio(value: number | null, decimals = 2): string {
  if (value === null) return "—";
  return value.toFixed(decimals) + "x";
}

export function crearChecklistVacio(): ChecklistItemData[] {
  return CHECKLIST_ITEMS.map((item) => ({
    id: item.id,
    respuesta: null,
    observacion: "",
    archivoIds: [],
  }));
}

export function generarId(): string {
  return crypto.randomUUID();
}
