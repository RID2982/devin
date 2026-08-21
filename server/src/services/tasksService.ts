import { db } from '../lib/db';
import { AppError } from '../lib/AppError';
import { buildMeta, type ListQuery } from '../lib/listQuery';
import { tasksRepository } from '../repositories/tasksRepository';
import { activityLogService } from './activityLogService';
import { emailService } from './email';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/tasks.schema';

export async function list(query: ListQuery) {
  const { rows, total } = await tasksRepository.list(query);
  return { data: rows, meta: buildMeta(query.page, query.pageSize, total) };
}

export async function getById(id: string) {
  const task = await tasksRepository.findById(id);
  if (!task) throw AppError.notFound('Task', id);
  return task;
}

export async function create(input: CreateTaskInput, actorUserId?: string) {
  const task = await tasksRepository.create(input);
  await activityLogService.record({
    action: 'TASK_CREATED',
    summary: `Task "${task.title}" was created`,
    eventId: task.eventId,
    taskId: task.id,
    actorUserId,
  });
  return task;
}

/** Every person assigned to a task, resolved through the join table. */
async function assigneesOf(taskId: string) {
  const assignments = await db.taskAssignees.query(taskId);
  return db.people.getMany(assignments.map((row) => row.personId));
}

export async function update(id: string, input: UpdateTaskInput, actorUserId?: string) {
  const existing = await getById(id);
  const task = (await tasksRepository.update(id, input))!;

  if (input.status && input.status !== existing.status) {
    await activityLogService.record({
      action: input.status === 'Completed' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
      summary: `Task "${task.title}" status changed to ${input.status}`,
      eventId: task.eventId,
      taskId: task.id,
      actorUserId,
    });
    if (input.status === 'Completed') {
      const event = await db.events.getById(task.eventId);
      for (const person of await assigneesOf(id)) {
        if (person.email) {
          await emailService.send({
            to: person.email,
            templateKey: 'task-completed',
            data: { taskTitle: task.title, eventName: event?.name },
            relatedEventId: task.eventId,
            relatedTaskId: task.id,
          });
        }
      }
    }
  } else {
    await activityLogService.record({
      action: 'TASK_UPDATED',
      summary: `Task "${task.title}" was updated`,
      eventId: task.eventId,
      taskId: task.id,
      actorUserId,
    });
  }

  return task;
}

export async function setStatus(id: string, status: string, actorUserId?: string) {
  return update(id, { status: status as UpdateTaskInput['status'] }, actorUserId);
}

export async function archive(id: string, actorUserId?: string) {
  const task = await getById(id);
  const updated = await tasksRepository.setArchived(id, true);
  await activityLogService.record({
    action: 'TASK_UPDATED',
    summary: `Task "${task.title}" was archived`,
    eventId: task.eventId,
    taskId: id,
    actorUserId,
  });
  return updated;
}

export async function restore(id: string, actorUserId?: string) {
  const task = await getById(id);
  const updated = await tasksRepository.setArchived(id, false);
  await activityLogService.record({
    action: 'TASK_UPDATED',
    summary: `Task "${task.title}" was restored`,
    eventId: task.eventId,
    taskId: id,
    actorUserId,
  });
  return updated;
}

export async function addAssignee(taskId: string, personId: string, actorUserId?: string) {
  const task = await getById(taskId);
  await db.taskAssignees.createIfNotExists({ taskId, personId });

  const [person, event] = await Promise.all([
    db.people.getById(personId),
    db.events.getById(task.eventId),
  ]);

  await activityLogService.record({
    action: 'TASK_ASSIGNED',
    summary: `${person?.name ?? 'Someone'} assigned to "${task.title}"`,
    eventId: task.eventId,
    taskId,
    actorUserId,
  });
  if (person?.email) {
    await emailService.send({
      to: person.email,
      templateKey: 'task-assigned',
      data: {
        taskTitle: task.title,
        eventName: event?.name,
        personName: person.name,
        deadline: task.deadline,
      },
      relatedEventId: task.eventId,
      relatedTaskId: taskId,
    });
  }
  return getById(taskId);
}

export async function removeAssignee(taskId: string, personId: string) {
  await db.taskAssignees.delete({ taskId, personId });
  return getById(taskId);
}

export async function addDependency(taskId: string, dependsOnTaskId: string) {
  await getById(taskId);
  await getById(dependsOnTaskId);
  await db.taskDependencies.createIfNotExists({ taskId, dependsOnTaskId });
  return getById(taskId);
}

export async function removeDependency(taskId: string, dependsOnTaskId: string) {
  await db.taskDependencies.delete({ taskId, dependsOnTaskId });
  return getById(taskId);
}

export const tasksService = {
  list,
  getById,
  create,
  update,
  setStatus,
  archive,
  restore,
  addAssignee,
  removeAssignee,
  addDependency,
  removeDependency,
};
