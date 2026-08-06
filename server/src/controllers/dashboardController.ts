import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { attentionService } from '../services/attentionService';

export async function overview(_req: Request, res: Response) {
  const [dashboard, attention] = await Promise.all([dashboardService.getOverview(), attentionService.getAttentionItems()]);
  res.json({
    ...dashboard,
    widgets: {
      ...dashboard.widgets,
      attentionItems: {
        overdueCount: attention.overdueTasks.length,
        highPriorityCount: attention.highPriorityTasks.length,
        upcomingDeadlinesCount: attention.upcomingDeadlines.length,
      },
    },
  });
}

export const dashboardController = { overview };
