"use client";

import { useState, useEffect } from "react";
import type { Caso } from "@/types";
import { formatCUIT } from "@/lib/bcra-utils";
import { settingsStore } from "@/lib/settings-store";
import { calcularEstadoGeneral } from "@/lib/calculations";

interface Props {
  caso: Caso;
  onClose: () => void;
}

export function EnviarMailModal({ caso, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [emailsTo, setEmailsTo] = useState<string[]>([]);
  const [nombreEntidad, setNombreEntidad] = useState("MAV S.A.");
  const [nombreArea, setNombreArea] = useState("Mesa de Operaciones");

  useEffect(() => {
    const s = settingsStore.get();
    setEmailsTo(s.emailsAuditoria);
    setNombreEntidad(s.nombreEntidad);
    setNombreArea(s.nombreArea);
  }, []);

  // Construir lista de motivos de rechazo
  const { motivos } = calcularEstadoGeneral(
    caso.checklist,
    caso.metricas,
    caso.documentos ?? [],
    caso.adminOverrideDocsObligatorios ?? false
  );

  const fechaHoy = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const motivosTexto = motivos
    .map((m, i) => `  ${i + 1}. ${m}`)
    .join("\n");

  const asunto = `[EXCEPCIÓN REQUERIDA] Evaluación Cheque Diferido No Garantizado – ${caso.denominacion} – CUIT ${formatCUIT(caso.cuit)}`;

  const cuerpo = `Estimados,

Por medio del presente se eleva para su consideración la evaluación crediticia correspondiente a la siguiente operación, cuyo resultado arroja NO ACEPTABLE, requiriéndose la aprobación de excepción por parte del área competente.

──────────────────────────────────────────
DATOS DE LA OPERACIÓN
──────────────────────────────────────────
Empresa:          ${caso.denominacion}
CUIT:             ${formatCUIT(caso.cuit)}
N° Cta. Comitente: ${caso.numeroCuentaComitente || "—"}
Tipo de operación: Cheque de Pago Diferido No Garantizado
Plazo:            ${caso.plazo || "—"} días
Moneda:           ${caso.moneda || "ARS"}
Fecha de operación: ${caso.fechaOperacion ? new Date(caso.fechaOperacion).toLocaleDateString("es-AR") : fechaHoy}
──────────────────────────────────────────

RESULTADO: NO ACEPTABLE

MOTIVOS / ASPECTOS PENDIENTES:
${motivosTexto || "  Ver informe adjunto."}

──────────────────────────────────────────

Se adjunta el informe completo de evaluación en formato PDF para su revisión.

En caso de considerar procedente la aprobación de excepción, se solicita la conformidad por escrito (reply a este correo) antes de proceder con la operación.

Quedo a disposición para cualquier consulta adicional.

Saludos cordiales,
${caso.creadoPor || "[Analista]"}
${nombreArea} – ${nombreEntidad}
Fecha: ${fechaHoy}
`;

  const mailtoLink = `mailto:${emailsTo.join(",")}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

  function copiar() {
    navigator.clipboard.writeText(cuerpo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function descargarPDF() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                No Aceptable
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Solicitud de excepción</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Enviar evaluación por mail</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Se generará un mail pre-redactado para elevar la excepción a auditoría / compliance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Destinatarios */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Para (TO)
            </p>
            {emailsTo.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {emailsTo.map((e) => (
                  <span key={e} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md font-mono">
                    {e}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠ No hay destinatarios configurados. Ir a{" "}
                <a href="/configuracion" className="underline font-medium">Configuración</a>{" "}
                para agregar la cadena de auditoría.
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              CC: agregá a tu superior directamente en Outlook antes de enviar.
            </p>
          </div>

          {/* Asunto */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Asunto
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 font-mono text-xs">
              {asunto}
            </p>
          </div>

          {/* Cuerpo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cuerpo del mail
              </p>
              <button
                onClick={copiar}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                {copied ? (
                  <>✓ Copiado</>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar texto
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
              {cuerpo}
            </pre>
          </div>

          {/* Instrucciones PDF */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">📎 Cómo adjuntar el PDF</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Hacé click en <strong>Descargar PDF</strong> — se abre la ventana de impresión</li>
              <li>Elegí <strong>Guardar como PDF</strong> y guardá el archivo</li>
              <li>Hacé click en <strong>Abrir en Outlook</strong> — se abre el mail pre-redactado</li>
              <li>Adjuntá el PDF descargado y agregá a tu superior en <strong>CC</strong></li>
            </ol>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={descargarPDF}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar PDF
          </button>
          <a
            href={mailtoLink}
            className="btn-primary flex items-center gap-2 text-sm no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Abrir en Outlook
          </a>
          <button onClick={onClose} className="btn-secondary text-sm ml-auto">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
