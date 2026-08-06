import type { EmailTemplateKey } from '@app/shared';

export interface EmailSendInput {
  to: string;
  templateKey: EmailTemplateKey;
  data: Record<string, unknown>;
  relatedEventId?: string;
  relatedTaskId?: string;
}

export interface EmailTransport {
  readonly name: string;
  send(input: EmailSendInput & { subject: string; body: string }): Promise<'Sent' | 'Failed'>;
}
