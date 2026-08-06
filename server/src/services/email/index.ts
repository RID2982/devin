import { db, schema } from '../../lib/db';
import type { EmailSendInput, EmailTransport } from './EmailService';
import { ConsoleTransport } from './ConsoleTransport';
import { templates } from './templates';

// EMAIL_TRANSPORT=console|file today; add a NodemailerTransport implementing EmailTransport
// and switch on 'smtp' here later — no call-site changes required.
const transport: EmailTransport = new ConsoleTransport();

async function send(input: EmailSendInput) {
  const { subject, body } = templates[input.templateKey](input.data);

  const status = await transport.send({ ...input, subject, body });

  await db.insert(schema.emailLogs).values({
    to: input.to,
    subject,
    templateKey: input.templateKey,
    payload: input.data,
    status,
    transport: transport.name,
    relatedEventId: input.relatedEventId,
    relatedTaskId: input.relatedTaskId,
  });
}

export const emailService = { send };
