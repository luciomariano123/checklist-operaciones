import type { ChecklistItemDef } from "@/types";

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: 1,
    titulo: "Es Inversor Calificado",
    textoAyuda:
      "Personas humanas o jurídicas que demuestren inversiones o depósitos en productos financieros por al menos 350.000 UVA, o que estén inscriptas en el Registro de Idóneos CNV. En caso afirmativo, queda sujeto a documentación respaldatoria.",
    siAceptable: true,
    requiereDocumentacion: true,
  },
  {
    id: 2,
    titulo: "Test de inversor agresivo",
    textoAyuda:
      "El cliente debe contar con test de inversor actualizado con perfil agresivo, conforme a la normativa CNV vigente.",
    siAceptable: true,
  },
  {
    id: 3,
    titulo: "Legajo y KYC completo, actualizado y perfilado",
    textoAyuda:
      "Verificar que el legajo del cliente se encuentre completo, actualizado según última normativa de PLD/FT, con perfil de riesgo asignado.",
    siAceptable: true,
  },
  {
    id: 4,
    titulo:
      'Posee cheques rechazados del BCRA por causal "Sin Fondos" en los últimos dos años',
    textoAyuda:
      "Información provista por NOSIS. Se verifica que el cliente no registre rechazos de cheques por falta de fondos en los últimos 24 meses.",
    siAceptable: false,
  },
  {
    id: 5,
    titulo:
      "Posee incumplimiento de pagos de valores negociables de emisión individual negociados en los mercados en los últimos dos años",
    textoAyuda:
      "Referencia MAV. Incumplimiento en el pago de valores negociables (cheques, pagarés, facturas) negociados en mercados en los últimos 24 meses.",
    siAceptable: false,
  },
  {
    id: 6,
    titulo: "Revisión satisfactoria a Central de Deudores para VNEI – MAV",
    textoAyuda:
      "Referencia MAV. Se verifica la situación del cliente en la Central de Deudores del BCRA en relación a VNEI negociados en MAV.",
    siAceptable: true,
  },
  {
    id: 7,
    titulo: 'Situación mayor a "1" en BCRA (relevante)',
    textoAyuda:
      'Se consulta la Central de Deudores del BCRA. Situación 1 = Normal. Cualquier situación > 1 es "No Aceptable". Se considera relevante cuando el monto es significativo respecto al total de la deuda.',
    siAceptable: false,
    autoBCRA: true,
  },
  {
    id: 8,
    titulo: "¿ART vigente?",
    textoAyuda:
      "Información provista por NOSIS. Verificar que la empresa cuente con cobertura de ART vigente para sus empleados.",
    siAceptable: true,
  },
  {
    id: 9,
    titulo: "Aportes patronales pagos / en programa de moratorias",
    textoAyuda:
      "Información provista por NOSIS y ARCA / F-931. Los aportes patronales deben estar al día o encuadrados en una moratoria vigente.",
    siAceptable: true,
  },
  {
    id: 10,
    titulo: "Antigüedad empresa mayor a dos años",
    textoAyuda:
      "Información provista por NOSIS. La empresa debe tener al menos dos años de antigüedad desde su inscripción.",
    siAceptable: true,
  },
  {
    id: 11,
    titulo: "Actividad no permitida",
    textoAyuda:
      "Se verifican actividades excluidas: tabacaleras, loterías / juegos de azar, fabricación o comercialización de armas. En caso de desarrollar una actividad no permitida, la operación es No Aceptable.",
    siAceptable: false,
  },
  {
    id: 12,
    titulo: "¿Nosis con antigüedad máxima de 1 mes?",
    textoAyuda:
      "El informe NOSIS utilizado no debe tener más de 30 días de antigüedad al momento de la evaluación.",
    siAceptable: true,
  },
  {
    id: 13,
    titulo: "¿Rating mayor a 400?",
    textoAyuda:
      "Score crediticio NOSIS. Un rating superior a 400 indica un perfil crediticio aceptable para la operación.",
    siAceptable: true,
  },
  {
    id: 14,
    titulo:
      'Orden completa con indicación de "No Garantizado" + DDJJ',
    textoAyuda:
      "La orden de compra/venta debe estar completa, indicar expresamente que se trata de un cheque no garantizado y adjuntar la Declaración Jurada correspondiente.",
    siAceptable: true,
  },
];

export const CATEGORIAS_DOCUMENTO: Record<string, string> = {
  eecc_ultimos_3: "Últimos 3 EECC",
  eecc_borrador: "Borrador de EECC (ejercicio cerrado no auditado)",
  ventas_post_cierre: "Ventas post cierre de balance (≥24 meses)",
  deuda_actualizada: "Deuda actualizada",
  accionistas: "Información de accionistas",
  presentacion_empresa: "Presentación de la empresa",
  eecc_consolidados: "EECC consolidados / empresas del grupo",
  finalidad_financiamiento: "Finalidad del financiamiento",
  inversor_calificado: "Documentación de inversor calificado",
  otros: "Otros",
};

export const MONEDAS = [
  { value: "ARS", label: "Pesos Argentinos (ARS)" },
  { value: "USD", label: "Dólares (USD)" },
];

export const PLAZOS = [
  "30 días",
  "60 días",
  "90 días",
  "120 días",
  "150 días",
  "180 días",
  "Otro",
];

export const SITUACIONES_BCRA: Record<number, string> = {
  1: "Normal",
  2: "Con seguimiento especial / Riesgo bajo",
  3: "Con problemas / Riesgo medio",
  4: "Con alto riesgo de insolvencia / Riesgo alto",
  5: "Irrecuperable",
  6: "Irrecuperable por disposición técnica",
};
