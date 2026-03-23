// Este archivo sólo se usa en el servidor (API routes).
// Los componentes cliente importan de bcra-utils.ts.
import "server-only";
import type { BCRAStatus } from "@/types";
import { SITUACIONES_BCRA } from "./checklist-config";

const BCRA_BASE = "https://api.bcra.gob.ar";

/**
 * El BCRA usa TLS 1.2 con configuración que Node.js 18+ rechaza con fetch/undici.
 * Usamos curl como subprocess (disponible en macOS/Linux) para la petición.
 */
async function fetchViaCurl(url: string): Promise<{ status: number; body: string }> {
  const { execFile } = require("child_process") as typeof import("child_process");
  const { promisify } = require("util") as typeof import("util");
  const execFileAsync = promisify(execFile);

  // Preferir el curl del sistema (/usr/bin/curl) para evitar problemas de SSL
  // con versiones de curl de Anaconda u otros entornos
  const curlPath = "/usr/bin/curl";

  const { stdout } = await execFileAsync(curlPath, [
    "-s",
    "-k",
    "--max-time", "10",
    "-H", "Accept: application/json",
    "-H", "User-Agent: Mozilla/5.0",
    "-w", "\n__STATUS__%{http_code}",
    url,
  ]);

  const parts = stdout.split("\n__STATUS__");
  const body = parts[0] ?? "";
  const status = parseInt(parts[1] ?? "0", 10);
  return { status, body };
}

export async function consultarBCRA(cuit: string): Promise<BCRAStatus> {
  const cuitLimpio = cuit.replace(/[-\s]/g, "");

  if (!/^\d{11}$/.test(cuitLimpio)) {
    return {
      cuit: cuitLimpio,
      denominacion: "",
      situacionMaxima: 0,
      situacionTexto: "CUIT inválido",
      estado: "sin_datos",
      ultimoPeriodo: "",
      detalle: [],
      error: "CUIT inválido. Debe tener 11 dígitos.",
    };
  }

  try {
    const url = `${BCRA_BASE}/CentralDeDeudores/v1.0/Deudas/${cuitLimpio}`;
    const { status, body } = await fetchViaCurl(url);

    if (status === 404 || body.includes('"status":404')) {
      return {
        cuit: cuitLimpio,
        denominacion: "",
        situacionMaxima: 1,
        situacionTexto: "Sin deudas registradas",
        estado: "aceptable",
        ultimoPeriodo: "",
        detalle: [],
      };
    }

    if (status < 200 || status >= 300) {
      throw new Error(`HTTP ${status}`);
    }

    const data = JSON.parse(body);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deudor: any = data.results;

    if (!deudor || !deudor.periodos || deudor.periodos.length === 0) {
      return {
        cuit: cuitLimpio,
        denominacion: deudor?.denominacion || "",
        situacionMaxima: 1,
        situacionTexto: "Sin deudas registradas",
        estado: "aceptable",
        ultimoPeriodo: "",
        detalle: [],
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodoOrdenado = [...deudor.periodos].sort((a: any, b: any) =>
      String(b.periodo).localeCompare(String(a.periodo))
    );
    const ultimoPeriodo = periodoOrdenado[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entidades: any[] = ultimoPeriodo.entidades || [];

    const situacionMaxima = entidades.reduce(
      (max: number, e: { situacion: number }) => Math.max(max, e.situacion ?? 1),
      1
    );

    const situacionTexto =
      SITUACIONES_BCRA[situacionMaxima] || `Situación ${situacionMaxima}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detalle = entidades.map((e: any) => ({
      entidad: typeof e.entidad === "number" ? e.entidad : 0,
      entidadNombre: typeof e.entidad === "string" ? e.entidad : undefined,
      situacion: e.situacion ?? 1,
      monto: e.monto ?? 0,
      diasAtrasoPago: e.diasAtrasoPago ?? 0,
      refinanciaciones: e.refinanciaciones ?? false,
      recategorizacionOblig: e.recategorizacionOblig ?? false,
      situacionJuridica: e.situacionJuridica ?? false,
      irrecuperabilidadPorDisposicionTecnica:
        e.irrecDisposicionTecnica ?? e.irrecuperabilidadPorDisposicionTecnica ?? false,
      enRevision: e.enRevision ?? false,
      procesoJud: e.procesoJud ?? false,
    }));

    return {
      cuit: cuitLimpio,
      denominacion: deudor.denominacion,
      situacionMaxima,
      situacionTexto,
      estado: situacionMaxima <= 1 ? "aceptable" : "no_aceptable",
      ultimoPeriodo: String(ultimoPeriodo.periodo),
      detalle,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      cuit: cuitLimpio,
      denominacion: "",
      situacionMaxima: 0,
      situacionTexto: "Error al consultar",
      estado: "sin_datos",
      ultimoPeriodo: "",
      detalle: [],
      error: `No se pudo consultar la API BCRA: ${message}`,
    };
  }
}
