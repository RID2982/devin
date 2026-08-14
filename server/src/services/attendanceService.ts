import { and, eq } from 'drizzle-orm';
import { db, schema } from '../lib/db';
import { AppError } from '../lib/AppError';
import { activityLogService } from './activityLogService';
import type { AttendanceStatus } from '@app/shared';

const { events, people, eventPeople, eventAttendance } = schema;

export async function listForEvent(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound('Event', eventId);

  return db
    .select({
      personId: eventPeople.personId,
      roleOnEvent: eventPeople.roleOnEvent,
      name: people.name,
      email: people.email,
      avatarPath: people.avatarPath,
      status: eventAttendance.status,
      markedAt: eventAttendance.markedAt,
    })
    .from(eventPeople)
    .innerJoin(people, eq(people.id, eventPeople.personId))
    .leftJoin(
      eventAttendance,
      and(eq(eventAttendance.eventId, eventPeople.eventId), eq(eventAttendance.personId, eventPeople.personId)),
    )
    .where(eq(eventPeople.eventId, eventId));
}

export async function mark(eventId: string, personId: string, status: AttendanceStatus, actorUserId?: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound('Event', eventId);

  const [roster] = await db
    .select()
    .from(eventPeople)
    .where(and(eq(eventPeople.eventId, eventId), eq(eventPeople.personId, personId)))
    .limit(1);
  if (!roster) throw AppError.badRequest('This person is not assigned to this event');

  const [person] = await db.select().from(people).where(eq(people.id, personId)).limit(1);

  const [row] = await db
    .insert(eventAttendance)
    .values({ eventId, personId, status, markedAt: new Date(), markedByUserId: actorUserId })
    .onConflictDoUpdate({
      target: [eventAttendance.eventId, eventAttendance.personId],
      set: { status, markedAt: new Date(), markedByUserId: actorUserId, updatedAt: new Date() },
    })
    .returning();

  await activityLogService.record({
    action: 'ATTENDANCE_MARKED',
    summary: `${person?.name ?? 'Someone'} marked ${status} for "${event.name}"`,
    eventId,
    actorUserId,
    metadata: { personId, status },
  });

  return row;
}

export const attendanceService = { listForEvent, mark };
