import { db } from '../lib/db';

const DEFAULTS: Record<string, unknown> = {
  theme: 'light',
  accentColor: '#b42244',
  notificationPreferences: { email: true, inApp: true },
  archiveRules: { autoArchiveCompletedEventsAfterDays: 90 },
};

export async function getAll() {
  const rows = await db.appSettings.all();
  const values: Record<string, unknown> = { ...DEFAULTS };
  for (const row of rows) values[row.key] = row.value;
  return values;
}

export async function set(key: string, value: unknown) {
  // Whole-item write keyed by `key` — the settings table has nothing else to
  // preserve, so a plain put is the ON CONFLICT DO UPDATE.
  await db.appSettings.put({ key, value, updatedAt: new Date() });
  return getAll();
}

export const settingsService = { getAll, set };
