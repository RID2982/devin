import { db, schema } from '../lib/db';

const { appSettings } = schema;

const DEFAULTS: Record<string, unknown> = {
  theme: 'light',
  accentColor: '#b42244',
  notificationPreferences: { email: true, inApp: true },
  archiveRules: { autoArchiveCompletedEventsAfterDays: 90 },
};

export async function getAll() {
  const rows = await db.select().from(appSettings);
  const values: Record<string, unknown> = { ...DEFAULTS };
  for (const row of rows) values[row.key] = row.value;
  return values;
}

export async function set(key: string, value: unknown) {
  await db
    .insert(appSettings)
    .values({ key, value: value as never, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: value as never, updatedAt: new Date() } });
  return getAll();
}

export const settingsService = { getAll, set };
