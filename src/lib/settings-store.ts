"use client";

export interface AppSettings {
  // Cadena de auditoría / destinatarios del mail de excepción
  emailsAuditoria: string[]; // TO
  // Nombre de la firma / entidad
  nombreEntidad: string;
  // Nombre del área (para el wording del mail)
  nombreArea: string;
}

const SETTINGS_KEY = "checklist_settings";

const DEFAULT_SETTINGS: AppSettings = {
  emailsAuditoria: [],
  nombreEntidad: "MAV S.A.",
  nombreArea: "Mesa de Operaciones",
};

export const settingsStore = {
  get(): AppSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  save(settings: Partial<AppSettings>): AppSettings {
    const current = settingsStore.get();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },
};
