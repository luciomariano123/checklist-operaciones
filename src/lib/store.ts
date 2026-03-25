"use client";

import type { Caso } from "@/types";
import { generarId } from "./calculations";

const STORAGE_KEY = "checklist_casos";

function getAll(): Caso[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(casos: Caso[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(casos));
}

export const store = {
  getAll,

  getById(id: string): Caso | undefined {
    return getAll().find((c) => c.id === id);
  },

  getByCuit(cuit: string): Caso[] {
    const normalized = cuit.replace(/[-\s]/g, "");
    return getAll().filter((c) => c.cuit.replace(/[-\s]/g, "") === normalized);
  },

  create(data: Omit<Caso, "id" | "creadoEn" | "actualizadoEn">): Caso {
    const now = new Date().toISOString();
    const caso: Caso = {
      ...data,
      id: generarId(),
      creadoEn: now,
      actualizadoEn: now,
    };
    const todos = getAll();
    saveAll([caso, ...todos]);
    return caso;
  },

  update(id: string, data: Partial<Caso>): Caso | null {
    const todos = getAll();
    const idx = todos.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated: Caso = {
      ...todos[idx],
      ...data,
      id,
      actualizadoEn: new Date().toISOString(),
    };
    todos[idx] = updated;
    saveAll(todos);
    return updated;
  },

  delete(id: string): void {
    const todos = getAll().filter((c) => c.id !== id);
    saveAll(todos);
  },
};
