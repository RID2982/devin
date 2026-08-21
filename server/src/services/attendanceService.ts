import { db } from '../lib/db';
import { AppError } from '../lib/AppError';
import { activityLogService } from './activityLogService';
import type { AttendanceStatus } from '@app/shared';

/**
 * The roster joined to whatever attendance has been marked so far.
 *
 * Both sides are keyed by (eventId, personId), so this is two Queries and a
 * lookup rather than the three-way join it used to be — people who are on the
 * roster but unmarked still come back with a null status, as the LEFT JOIN did.
 */
export async function listForEvent(eventId: string) {
  const event = await db.events.getById(eventId);
  if (!event) throw AppError.notFound('Event', eventId);

  const [roster, attendance] = await Promise.all([
    db.eventPeople.query(eventId),
    db.eventAttendance.query(eventId),
  ]);

  const persons = await db.people.getMany(roster.map((row) => row.personId));
  const personById = new Map(persons.map((person) => [person.id, person]));
  const attendanceByPerson = new Map(attendance.map((row) => [row.personId, row]));

  return roster.flatMap((row) => {
    const person = personById.get(row.personId);
    if (!person) return []; // INNER JOIN people
    const marked = attendanceByPerson.get(row.personId);

    return [
      {
        personId: row.personId,
        roleOnEvent: row.roleOnEvent,
        name: person.name,
        email: person.email,
        avatarPath: person.avatarPath,
        status: marked?.status ?? null,
        markedAt: marked?.markedAt ?? null,
      },
    ];
  });
}

export async function mark(
  eventId: string,
  personId: string,
  status: AttendanceStatus,
  actorUserId?: string,
) {
  const event = await db.events.getById(eventId);
  if (!event) throw AppError.notFound('Event', eventId);

  const roster = await db.eventPeople.get({ eventId, personId });
  if (!roster) throw AppError.badRequest('This person is not assigned to this event');

  const person = await db.people.getById(personId);

  const row = await db.eventAttendance.upsert({
    eventId,
    personId,
    status,
    markedAt: new Date(),
    markedByUserId: actorUserId,
    updatedAt: new Date(),
  });

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
