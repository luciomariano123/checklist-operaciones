"use client";

import { useState, useRef } from "react";
import type { Documento, CategoriaDocumento } from "@/types";
import { CATEGORIAS_DOCUMENTO } from "@/lib/checklist-config";
import { generarId } from "@/lib/calculations";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

interface Props {
  documentos: Documento[];
  onChange: (docs: Documento[]) => void;
  readOnly?: boolean;
  currentUser?: string;
}

export function DocumentsSection({ documentos, onChange, readOnly = false, currentUser = "Usuario" }: Props) {
  const [categoria, setCategoria] = useState<CategoriaDocumento>("eecc_ultimos_3");
  const [comentario, setComentario] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nuevos: Documento[] = Array.from(files).map((file) => ({
      id: generarId(),
      casoId: "",
      nombre: file.name,
      categoria,
      fechaCarga: new Date().toISOString(),
      cargadoPor: currentUser,
      comentario,
      size: file.size,
      mimeType: file.type,
      url: URL.createObjectURL(file),
    }));
    onChange([...documentos, ...nuevos]);
    setComentario("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const eliminar = (id: string) => {
    onChange(documentos.filter((d) => d.id !== id));
  };

  const byCategory = Object.entries(CATEGORIAS_DOCUMENTO).map(([key, label]) => ({
    key: key as CategoriaDocumento,
    label,
    docs: documentos.filter((d) => d.categoria === key),
  }));

  return (
    <CollapsibleSection
      title="Documentación respaldatoria"
      subtitle={`${documentos.length} archivo${documentos.length !== 1 ? "s" : ""} cargado${documentos.length !== 1 ? "s" : ""}`}
      defaultOpen
      badge={
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
          {documentos.length} docs
        </span>
      }
    >
      <div className="mt-4 space-y-5">
        {/* Upload panel */}
        {!readOnly && (
          <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">
              Subir documentos
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="field-label">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
                  className="field-select"
                >
                  {Object.entries(CATEGORIAS_DOCUMENTO).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Comentario (opcional)</label>
                <input
                  type="text"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej: Ejercicio 2023"
                  className="field-input"
                />
              </div>
            </div>
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-slate-500">
                Arrastrá archivos aquí o{" "}
                <span className="text-indigo-600 font-medium">seleccioná desde tu equipo</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, imágenes, Excel, Word</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Documents by category */}
        <div className="space-y-4">
          {byCategory.map(({ key, label, docs }) => {
            if (readOnly && docs.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-slate-600">{label}</p>
                  {docs.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                      {docs.length}
                    </span>
                  )}
                  {docs.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Sin documentos</span>
                  )}
                </div>
                {docs.length > 0 && (
                  <div className="space-y-1.5">
                    {docs.map((doc) => (
                      <DocRow key={doc.id} doc={doc} onDelete={() => eliminar(doc.id)} readOnly={readOnly} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </CollapsibleSection>
  );
}

function DocRow({ doc, onDelete, readOnly }: { doc: Documento; onDelete: () => void; readOnly: boolean }) {
  const isImage = doc.mimeType?.startsWith("image/");
  const isPDF = doc.mimeType === "application/pdf";
  const icon = isPDF ? "📄" : isImage ? "🖼️" : "📎";
  const sizeStr = doc.size ? formatSize(doc.size) : "";

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
      <span className="text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.nombre}</p>
        <p className="text-xs text-slate-400">
          {formatDate(doc.fechaCarga)} · {doc.cargadoPor}
          {sizeStr && ` · ${sizeStr}`}
          {doc.comentario && ` · ${doc.comentario}`}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Ver
          </a>
        )}
        {doc.url && (
          <a
            href={doc.url}
            download={doc.nombre}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ↓
          </a>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
