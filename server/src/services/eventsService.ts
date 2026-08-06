import { and, count, desc, eq } from 'drizzle-orm';
import { DEFAULT_EVENT_CHECKLIST } from '@app/shared';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import type { ListQuery } from '../lib/listQuery';
import { buildMeta } from '../lib/listQuery';
import { eventsRepository } from '../repositories/eventsRepository';
import { activityLogService } from './activityLogService';
import type { CreateEventInput, UpdateEventInput } from '../validators/events.schema';

const { checklistItems, checklistTemplates, templateItems, activityLogs, eventPeople, people } = schema;

export async function list(query: ListQuery) {
  const { rows, total } = await eventsRepository.list(query);
  return { data: rows, meta: buildMeta(query.page, query.pageSize, total) };
}

export async function getById(id: string) {
  const event = await eventsRepository.findById(id);
  if (!event) throw AppError.notFound('Event', id);
  return event;
}

export async function create(input: CreateEventInput, actorUserId?: string) {
  const event = await eventsRepository.create({
    name: input.name,
    category: input.category,
    date: input.date,
    endDate: input.endDate,
    time: input.time,
    venue: input.venue,
    budget: input.budget?.toString(),
    status: input.status,
    priority: input.priority,
    color: input.color,
    description: input.description,
  });

  let checklistLabels: string[] = [...DEFAULT_EVENT_CHECKLIST];
  if (input.templateId) {
    const items = await db
      .select()
      .from(templateItems)
      .where(eq(templateItems.templateId, input.templateId))
      .orderBy(templateItems.order);
    if (items.length) checklistLabels = items.map((i) => i.label);
  }

  await db.insert(checklistItems).values(
    checklistLabels.map((label, i) => ({ eventId: event.id, label, order: i })),
  );

  await activityLogService.record({
    action: 'EVENT_CREATED',
    summary: `Event "${event.name}" was created`,
    eventId: event.id,
    actorUserId,
  });

  return getById(event.id);
}

export async function update(id: string, input: UpdateEventInput, actorUserId?: string) {
  await getById(id);
  const event = await eventsRepository.update(id, {
    ...input,
    budget: input.budget !== undefined ? input.budget.toString() : undefined,
  });
  await activityLogService.record({
    action: 'EVENT_UPDATED',
    summary: `Event "${event.name}" was updated`,
    eventId: id,
    actorUserId,
  });
  return event;
}

export async function archive(id: string, actorUserId?: string) {
  const event = await getById(id);
  const updated = await eventsRepository.setArchived(id, true);
  await activityLogService.record({
    action: 'EVENT_ARCHIVED',
    summary: `Event "${event.name}" was archived`,
    eventId: id,
    actorUserId,
  });
  return updated;
}

export async function restore(id: string, actorUserId?: string) {
  const event = await getById(id);
  const updated = await eventsRepository.setArchived(id, false);
  await activityLogService.record({
    action: 'EVENT_RESTORED',
    summary: `Event "${event.name}" was restored`,
    eventId: id,
    actorUserId,
  });
  return updated;
}

export async function applyTemplate(eventId: string, templateId: string, actorUserId?: string) {
  const event = await getById(eventId);
  const template = await db.query.checklistTemplates.findFirst({ where: eq(checklistTemplates.id, templateId) });
  if (!template) throw AppError.notFound('ChecklistTemplate', templateId);

  const items = await db.select().from(templateItems).where(eq(templateItems.templateId, templateId)).orderBy(templateItems.order);

  await db.insert(checklistItems).values(
    items.map((i) => ({ eventId, label: i.label, order: i.order })),
  );

  await activityLogService.record({
    action: 'CHECKLIST_APPLIED_TEMPLATE',
    summary: `Template "${template.name}" applied to "${event.name}"`,
    eventId,
    actorUserId,
  });

  return getById(eventId);
}

export async function timeline(eventId: string) {
  await getById(eventId);
  return db.select().from(activityLogs).where(eq(activityLogs.eventId, eventId)).orderBy(desc(activityLogs.createdAt));
}

export async function summary(eventId: string) {
  const event = await getById(eventId);

  const [[checklistTotal], [checklistDone], [taskTotal], [taskDone]] = await Promise.all([
    db.select({ n: count() }).from(checklistItems).where(eq(checklistItems.eventId, eventId)),
    db.select({ n: count() }).from(checklistItems).where(and(eq(checklistItems.eventId, eventId), eq(checklistItems.isDone, true))),
    db.select({ n: count() }).from(schema.tasks).where(eq(schema.tasks.eventId, eventId)),
    db.select({ n: count() }).from(schema.tasks).where(and(eq(schema.tasks.eventId, eventId), eq(schema.tasks.status, 'Completed'))),
  ]);

  const completionPercent = checklistTotal.n > 0 ? Math.round((checklistDone.n / checklistTotal.n) * 100) : 0;

  return {
    event,
    checklist: { total: checklistTotal.n, done: checklistDone.n },
    tasks: { total: taskTotal.n, done: taskDone.n },
    completionPercent,
  };
}

export async function addPerson(eventId: string, personId: string, roleOnEvent: string | undefined, actorUserId?: string) {
  const event = await getById(eventId);
  await db.insert(eventPeople).values({ eventId, personId, roleOnEvent }).onConflictDoNothing();
  const [person] = await db.select().from(people).where(eq(people.id, personId)).limit(1);
  await activityLogService.record({
    action: 'PERSON_ASSIGNED',
    summary: `${person?.name ?? 'Someone'} added to "${event.name}"`,
    eventId,
    actorUserId,
  });
  return getById(eventId);
}

export async function removePerson(eventId: string, personId: string) {
  await db.delete(eventPeople).where(and(eq(eventPeople.eventId, eventId), eq(eventPeople.personId, personId)));
  return getById(eventId);
}

export const eventsService = { list, getById, create, update, archive, restore, applyTemplate, timeline, summary, addPerson, removePerson };
