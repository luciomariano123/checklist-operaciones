// Este archivo sólo se usa en el servidor (API routes).
// Los componentes cliente importan de bcra-utils.ts.
import "server-only";
import type { BCRAStatus } from "@/types";
import { SITUACIONES_BCRA } from "./checklist-config";

const BCRA_BASE = "https://api.bcra.gob.ar";

/**
 * La API del BCRA tiene una configuración TLS que el módulo fetch/undici de Node.js
 * no puede manejar (ECONNRESET). Usamos curl que sí funciona con `-k`.
 * Esta función detecta la ruta de curl automáticamente:
 * - En macOS dev: /usr/bin/curl (el del sistema, no el de Anaconda)
 * - En Railway/Linux: /usr/bin/curl instalado vía nixpacks
 */
async function getCurlPath(): Promise<string> {
  const { access } = await import("fs/promises");
  const candidates = ["/usr/bin/curl", "/usr/local/bin/curl", "/bin/curl"];
  for (const p of candidates) {
    try {
      await access(p);
      return p;
    } catch {
      // continuar con el siguiente
    }
  }
  return "curl"; // fallback al PATH del sistema
}

async function fetchViaCurl(url: string): Promise<{ status: number; body: string }> {
  const { execFile } = require("child_process") as typeof import("child_process");
  const { promisify } = require("util") as typeof import("util");
  const execFileAsync = promisify(execFile);

  const curlPath = await getCurlPath();
  const args = [
    "-s", "-k", "--max-time", "15",
    "-H", "Accept: application/json",
    "-H", "User-Agent: Mozilla/5.0",
    "-w", "\n__STATUS__%{http_code}",
    url,
  ];

  // Reintentos: la API del BCRA a veces cierra la conexión (rate limit / TLS)
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
    try {
      const { stdout } = await execFileAsync(curlPath, args);
      const parts = stdout.split("\n__STATUS__");
      const body = parts[0] ?? "";
      const status = parseInt(parts[1] ?? "0", 10);
      if (status > 0) return { status, body };
      // status 0 = curl no pudo completar, reintentar
    } catch (err: unknown) {
      // execFile lanza si curl retorna exit code != 0
      // recuperar stdout del error para ver si igual tenemos datos
      const e = err as { stdout?: string; code?: number };
      if (e.stdout) {
        const parts = e.stdout.split("\n__STATUS__");
        const body = parts[0] ?? "";
        const status = parseInt(parts[1] ?? "0", 10);
        if (status > 0) return { status, body };
      }
      if (attempt === 2) throw err;
    }
  }
  throw new Error("BCRA: no se pudo obtener respuesta tras 3 intentos");
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
    // No exponer detalles internos (ruta de curl, comandos) al usuario
    const raw = err instanceof Error ? err.message : "Error desconocido";
    const esTimeout = raw.includes("ETIMEDOUT") || raw.includes("max-time") || raw.includes("28");
    const esConexion = raw.includes("ECONNRESET") || raw.includes("ENOTFOUND") || raw.includes("7") || raw.includes("56");
    let mensaje = "No se pudo conectar con la API del BCRA.";
    if (esTimeout) mensaje = "La API del BCRA no respondió a tiempo (timeout).";
    else if (esConexion) mensaje = "No se pudo establecer conexión con api.bcra.gob.ar.";
    return {
      cuit: cuitLimpio,
      denominacion: "",
      situacionMaxima: 0,
      situacionTexto: "Error al consultar",
      estado: "sin_datos",
      ultimoPeriodo: "",
      detalle: [],
      error: mensaje,
    };
  }
}
