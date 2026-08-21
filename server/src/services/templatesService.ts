import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import { isArchived, sortByKey } from '../lib/query';
import type { CreateTemplateInput, UpdateTemplateInput } from '../validators/templates.schema';

export async function list() {
  const [allTemplates, items] = await Promise.all([
    db.checklistTemplates.all(),
    db.templateItems.all(),
  ]);

  return allTemplates
    .filter((t) => !isArchived(t.archivedAt))
    .map((t) => ({
      ...t,
      items: sortByKey(
        items.filter((i) => i.templateId === t.id),
        'order',
      ),
    }));
}

export async function getById(id: string) {
  const template = await db.checklistTemplates.getById(id);
  if (!template) throw AppError.notFound('ChecklistTemplate', id);

  const items = sortByKey(
    await db.templateItems.queryIndex(INDEXES.templateItemsByTemplate, id),
    'order',
  );
  return { ...template, items };
}

export async function create(input: CreateTemplateInput) {
  const template = await db.checklistTemplates.create({
    name: input.name,
    description: input.description,
    category: input.category,
  });

  if (input.items?.length) {
    await db.templateItems.createMany(
      input.items.map((label, i) => ({ templateId: template.id, label, order: i })),
    );
  }

  return getById(template.id);
}

export async function update(id: string, input: UpdateTemplateInput) {
  await getById(id);
  await db.checklistTemplates.updateById(id, { ...input, updatedAt: new Date() });
  return getById(id);
}

export async function archive(id: string) {
  await getById(id);
  await db.checklistTemplates.updateById(id, { archivedAt: new Date() });
  return { success: true };
}

export async function addItem(templateId: string, label: string, order?: number) {
  await getById(templateId);
  return db.templateItems.create({ templateId, label, order: order ?? 0 });
}

export async function removeItem(itemId: string) {
  await db.templateItems.deleteById(itemId);
}

export const templatesService = { list, getById, create, update, archive, addItem, removeItem };
