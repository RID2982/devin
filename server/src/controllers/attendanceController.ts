import type { Request, Response } from 'express';
import { z } from 'zod';
import { attendanceService } from '../services/attendanceService';
import { markAttendanceSchema } from '../validators/attendance.schema';
import { AppError } from '../lib/AppError';

export async function list(req: Request, res: Response) {
  const eventId = z.string().uuid().parse(req.query.eventId);
  res.json(await attendanceService.listForEvent(eventId));
}

export async function mark(req: Request, res: Response) {
  const { status } = markAttendanceSchema.parse(req.body);
  if (!req.user) throw AppError.unauthorized();
  res.json(await attendanceService.mark(req.params.eventId, req.params.personId, status, req.user.id));
}

export const attendanceController = { list, mark };
