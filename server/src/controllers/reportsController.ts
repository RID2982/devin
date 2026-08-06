import type { Request, Response } from 'express';
import { AppError } from '../lib/AppError';
import { reportsService } from '../services/reportsService';

export async function monthly(req: Request, res: Response) {
  const month = req.query.month;
  if (typeof month !== 'string') throw AppError.badRequest('month query param (YYYY-MM) is required');
  res.json(await reportsService.monthly(month));
}

export async function exportMonthlyCsv(req: Request, res: Response) {
  const month = req.query.month;
  if (typeof month !== 'string') throw AppError.badRequest('month query param (YYYY-MM) is required');
  const data = await reportsService.monthly(month);

  let csv = 'Event ID,Name,Date,Category,Status,Budget\n';
  for (const ev of data.events) {
    const name = `"${(ev.name || '').replace(/"/g, '""')}"`;
    const dateStr = ev.date ? new Date(ev.date).toISOString().split('T')[0] : '';
    csv += `${ev.id},${name},${dateStr},${ev.category || ''},${ev.status || ''},${ev.budget ?? ''}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${month}.csv"`);
  res.send(csv);
}

export async function eventSummary(req: Request, res: Response) {
  res.json(await reportsService.eventSummary(req.params.eventId));
}

export async function productivity(_req: Request, res: Response) {
  res.json(await reportsService.productivity());
}

export async function exportProductivityCsv(_req: Request, res: Response) {
  const data = await reportsService.productivity();
  let csv = 'Person ID,Person Name,Completed Tasks Count\n';
  for (const p of data.byPerson) {
    csv += `${p.personId},"${(p.personName || '').replace(/"/g, '""')}",${p.completed}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="productivity-report.csv"');
  res.send(csv);
}

export const reportsController = { monthly, exportMonthlyCsv, eventSummary, productivity, exportProductivityCsv };
