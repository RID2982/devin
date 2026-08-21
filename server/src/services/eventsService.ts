import { DEFAULT_EVENT_CHECKLIST } from '@app/shared';
import { db, INDEXES } from '../lib/db';
import { AppError } from '../lib/AppError';
import type { ListQuery } from '../lib/listQuery';
import { buildMeta } from '../lib/listQuery';
import { sortByKey } from '../lib/query';
import { eventsRepository } from '../repositories/eventsRepository';
import { activityLogService } from './activityLogService';
import type { CreateEventInput, UpdateEventInput } from '../validators/events.schema';

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
    const items = sortByKey(
      await db.templateItems.queryIndex(INDEXES.templateItemsByTemplate, input.templateId),
      'order',
    );
    if (items.length) checklistLabels = items.map((i) => i.label);
  }

  await db.checklistItems.createMany(
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
  const event = (await eventsRepository.update(id, {
    ...input,
    budget: input.budget !== undefined ? input.budget.toString() : undefined,
  }))!;

  if (input.status === 'Completed' || input.status === 'Cancelled') {
    // No `UPDATE ... WHERE event_id = ?` here — the event's tasks are read off
    // the GSI and written back one by one.
    const tasks = await db.tasks.queryIndex(INDEXES.tasksByEvent, id);
    await Promise.all(
      tasks
        .filter((task) => task.status !== 'Completed')
        .map((task) => db.tasks.updateById(task.id, { status: 'Cancelled', updatedAt: new Date() })),
    );
  }

  await activityLogService.record({
    action: 'EVENT_UPDATED',
    summary: `Event "${event.name}" was updated`,
    eventId: id,
    actorUserId,
  });
  return event;
}

/** Archives/restores an event and every task under it, together. */
async function setArchivedCascade(id: string, archived: boolean) {
  const updated = await eventsRepository.setArchived(id, archived);
  const tasks = await db.tasks.queryIndex(INDEXES.tasksByEvent, id);

  await Promise.all(
    tasks.map((task) =>
      db.tasks.updateById(task.id, {
        archivedAt: archived ? new Date() : null,
        updatedAt: new Date(),
      }),
    ),
  );

  return updated;
}

export async function archive(id: string, actorUserId?: string) {
  const event = await getById(id);
  const updated = await setArchivedCascade(id, true);
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
  const updated = await setArchivedCascade(id, false);
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
  const template = await db.checklistTemplates.getById(templateId);
  if (!template) throw AppError.notFound('ChecklistTemplate', templateId);

  const items = sortByKey(
    await db.templateItems.queryIndex(INDEXES.templateItemsByTemplate, templateId),
    'order',
  );

  await db.checklistItems.createMany(
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
  return db.activityLogs.queryIndex(INDEXES.activityLogsByEvent, eventId, { ascending: false });
}

export async function summary(eventId: string) {
  const event = await getById(eventId);

  const [checklist, tasks] = await Promise.all([
    db.checklistItems.queryIndex(INDEXES.checklistItemsByEvent, eventId),
    db.tasks.queryIndex(INDEXES.tasksByEvent, eventId),
  ]);

  const checklistDone = checklist.filter((item) => item.isDone).length;
  const tasksDone = tasks.filter((task) => task.status === 'Completed').length;
  const completionPercent = checklist.length > 0 ? Math.round((checklistDone / checklist.length) * 100) : 0;

  return {
    event,
    checklist: { total: checklist.length, done: checklistDone },
    tasks: { total: tasks.length, done: tasksDone },
    completionPercent,
  };
}

export async function addPerson(
  eventId: string,
  personId: string,
  roleOnEvent: string | undefined,
  actorUserId?: string,
) {
  const event = await getById(eventId);
  await db.eventPeople.createIfNotExists({ eventId, personId, roleOnEvent });
  const person = await db.people.getById(personId);

  await activityLogService.record({
    action: 'PERSON_ASSIGNED',
    summary: `${person?.name ?? 'Someone'} added to "${event.name}"`,
    eventId,
    actorUserId,
  });
  return getById(eventId);
}

export async function removePerson(eventId: string, personId: string) {
  await db.eventPeople.delete({ eventId, personId });
  return getById(eventId);
}

export const eventsService = {
  list,
  getById,
  create,
  update,
  archive,
  restore,
  applyTemplate,
  timeline,
  summary,
  addPerson,
  removePerson,
};
