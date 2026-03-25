// ─── Estado ─────────────────────────────────────────────────────────────────

export type EstadoItem = "aceptable" | "no_aceptable" | "pendiente" | "sin_datos";
export type EstadoGeneral = "aceptable" | "no_aceptable" | "pendiente";
export type RespuestaBooleana = "si" | "no" | null;
export type TipoOperacion = "compra" | "venta";

// ─── Checklist ───────────────────────────────────────────────────────────────

export interface ChecklistItemData {
  id: number;
  respuesta: RespuestaBooleana;
  observacion: string;
  archivoIds: string[];
  estadoOverride?: EstadoItem; // para auto-completado BCRA
}

// Definición estática de cada ítem del checklist
export interface ChecklistItemDef {
  id: number;
  titulo: string;
  textoAyuda: string;
  // si respuesta = "si" → estado
  siAceptable: boolean; // true = Si→Aceptable, false = Si→NoAceptable
  requiereDocumentacion?: boolean; // ej.: inversor calificado
  autoBCRA?: boolean; // ítem 7 puede auto-completarse desde BCRA
}

// ─── Documentos ──────────────────────────────────────────────────────────────

export type CategoriaDocumento =
  | "nosis"
  | "ddjj"
  | "eecc_ultimos_3"
  | "eecc_borrador"
  | "ventas_post_cierre"
  | "deuda_actualizada"
  | "accionistas"
  | "presentacion_empresa"
  | "eecc_consolidados"
  | "finalidad_financiamiento"
  | "inversor_calificado"
  | "otros";

export interface Documento {
  id: string;
  casoId: string;
  nombre: string;
  categoria: CategoriaDocumento;
  url?: string;
  fechaCarga: string;
  cargadoPor: string;
  comentario: string;
  checklistItemId?: number; // si está asociado a un ítem
  size?: number;
  mimeType?: string;
}

// ─── Métricas Financieras ────────────────────────────────────────────────────

export interface MetricasInput {
  activoCorriente: number | null;
  activoNoCorriente: number | null;
  pasivoCorriente: number | null;
  pasivoNoCorriente: number | null;
  lineaSolicitada: number | null;
}

export interface MetricasCalculadas {
  activoTotal: number | null;
  pasivoTotal: number | null;
  patrimonioNeto: number | null;
  lineaPN: number | null;
  liquidezCorriente: number | null;
  fondeoPropio: number | null;
}

export interface MetricaEstado {
  lineaPN: EstadoItem;
  liquidezCorriente: EstadoItem;
  fondeoPropio: EstadoItem;
}

// ─── Historial ───────────────────────────────────────────────────────────────

export interface HistorialCambio {
  id: string;
  casoId: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  usuario: string;
  fecha: string;
}

// ─── Observacion ─────────────────────────────────────────────────────────────

export interface Observacion {
  id: string;
  casoId: string;
  texto: string;
  usuario: string;
  fecha: string;
}

// ─── BCRA ────────────────────────────────────────────────────────────────────

export interface BCRADeudor {
  identificacion: number;
  denominacion: string;
  periodos: BCRAPeriodo[];
}

export interface BCRAPeriodo {
  periodo: string;
  entidades: BCRAEntidad[];
}

export interface BCRAEntidad {
  entidad: number;
  situacion: number;
  monto: number;
  diasAtrasoPago: number;
  refinanciaciones: boolean;
  recategorizacionOblig: boolean;
  situacionJuridica: boolean;
  irrecuperabilidadPorDisposicionTecnica: boolean;
  enRevision: boolean;
  procesoJud: boolean;
}

export interface BCRAStatus {
  cuit: string;
  denominacion: string;
  situacionMaxima: number; // peor situación encontrada
  situacionTexto: string;
  estado: EstadoItem; // aceptable si situacion <= 1
  ultimoPeriodo: string;
  detalle: BCRAEntidad[];
  error?: string;
}

// ─── Caso ────────────────────────────────────────────────────────────────────

export interface Caso {
  id: string;
  // Datos del cliente
  cuit: string;
  denominacion: string;
  numeroCuentaComitente: string;
  moneda: string;
  plazo: string;
  tipoOperacion: TipoOperacion;
  fechaOperacion: string;
  fechaUltimoEECC: string;
  // Checklist (14 ítems)
  checklist: ChecklistItemData[];
  // Métricas
  metricas: MetricasInput;
  // Documentos
  documentos: Documento[];
  // Estado general calculado
  estadoGeneral: EstadoGeneral;
  motivosRechazo: string[];
  // Observaciones
  observaciones: string;
  observacionesInternas: Observacion[];
  // Responsable / auditoria
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  actualizadoPor: string;
  historial: HistorialCambio[];
  // BCRA cache
  bcraStatus?: BCRAStatus;
}

export type CasoForm = Omit<Caso, "id" | "creadoEn" | "actualizadoEn" | "historial" | "observacionesInternas" | "estadoGeneral" | "motivosRechazo">;
