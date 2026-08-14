import { sql } from 'drizzle-orm';
import { db, pool } from './client';

/** Every table in database/src/schema.ts. CASCADE handles FK dependency ordering. */
const TABLE_NAMES = [
  'app_users',
  'events',
  'tasks',
  'people',
  'event_people',
  'event_attendance',
  'task_assignees',
  'task_dependencies',
  'checklist_items',
  'checklist_templates',
  'template_items',
  'comments',
  'attachments',
  'notes',
  'tags',
  'event_tags',
  'task_tags',
  'activity_logs',
  'email_logs',
  'notifications',
  'permissions',
  'app_settings',
];

async function main() {
  console.log(`Truncating ${TABLE_NAMES.length} tables...`);
  await db.execute(sql.raw(`TRUNCATE TABLE ${TABLE_NAMES.map((n) => `"${n}"`).join(', ')} RESTART IDENTITY CASCADE;`));
  console.log('Database reset complete — every table is now empty.');
  await pool.end();
}

main().catch(async (err) => {
  console.error('Reset failed:', err);
  await pool.end();
  process.exit(1);
});
