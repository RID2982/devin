import type { EmailTemplateKey } from '@app/shared';

type TemplateFn = (data: Record<string, unknown>) => { subject: string; body: string };

export const templates: Record<EmailTemplateKey, TemplateFn> = {
  'task-assigned': (d) => ({
    subject: `You've been assigned: ${d.taskTitle}`,
    body: `Hi ${d.personName},\n\nYou've been assigned the task "${d.taskTitle}" on event "${d.eventName}"${d.deadline ? ` (due ${d.deadline})` : ''}.`,
  }),
  'task-completed': (d) => ({
    subject: `Task completed: ${d.taskTitle}`,
    body: `The task "${d.taskTitle}" on event "${d.eventName}" was marked completed.`,
  }),
  'deadline-tomorrow': (d) => ({
    subject: `Reminder: "${d.taskTitle}" is due tomorrow`,
    body: `Task "${d.taskTitle}" on event "${d.eventName}" is due tomorrow.`,
  }),
  'deadline-today': (d) => ({
    subject: `Due today: "${d.taskTitle}"`,
    body: `Task "${d.taskTitle}" on event "${d.eventName}" is due today.`,
  }),
  'event-created': (d) => ({
    subject: `New event created: ${d.eventName}`,
    body: `A new event "${d.eventName}" was created for ${d.eventDate}.`,
  }),
  'event-updated': (d) => ({
    subject: `Event updated: ${d.eventName}`,
    body: `Event "${d.eventName}" was updated.`,
  }),
  'event-cancelled': (d) => ({
    subject: `Event cancelled: ${d.eventName}`,
    body: `Event "${d.eventName}" has been cancelled.`,
  }),
  'new-comment': (d) => ({
    subject: `New comment on ${d.eventName ?? d.taskTitle}`,
    body: `${d.authorName} commented: "${d.commentBody}"`,
  }),
};
