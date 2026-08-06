import { eq, isNull } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import type { CreateTemplateInput, UpdateTemplateInput } from '../validators/templates.schema';

const { checklistTemplates, templateItems } = schema;

export async function list() {
  const templates = await db.select().from(checklistTemplates).where(isNull(checklistTemplates.archivedAt));
  const items = await db.select().from(templateItems);
  return templates.map((t) => ({ ...t, items: items.filter((i) => i.templateId === t.id).sort((a, b) => a.order - b.order) }));
}

export async function getById(id: string) {
  const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, id)).limit(1);
  if (!template) throw AppError.notFound('ChecklistTemplate', id);
  const items = await db.select().from(templateItems).where(eq(templateItems.templateId, id)).orderBy(templateItems.order);
  return { ...template, items };
}

export async function create(input: CreateTemplateInput) {
  const [template] = await db.insert(checklistTemplates).values({ name: input.name, description: input.description, category: input.category }).returning();
  if (input.items?.length) {
    await db.insert(templateItems).values(input.items.map((label, i) => ({ templateId: template.id, label, order: i })));
  }
  return getById(template.id);
}

export async function update(id: string, input: UpdateTemplateInput) {
  await getById(id);
  await db.update(checklistTemplates).set({ ...input, updatedAt: new Date() }).where(eq(checklistTemplates.id, id));
  return getById(id);
}

export async function archive(id: string) {
  await getById(id);
  await db.update(checklistTemplates).set({ archivedAt: new Date() }).where(eq(checklistTemplates.id, id));
  return { success: true };
}

export async function addItem(templateId: string, label: string, order?: number) {
  await getById(templateId);
  const [item] = await db.insert(templateItems).values({ templateId, label, order: order ?? 0 }).returning();
  return item;
}

export async function removeItem(itemId: string) {
  await db.delete(templateItems).where(eq(templateItems.id, itemId));
}

export const templatesService = { list, getById, create, update, archive, addItem, removeItem };
