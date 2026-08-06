import type { EmailSendInput, EmailTransport } from './EmailService';
import { logger } from '../../lib/logger';

/** Default Phase 1 transport: logs the email and never actually sends it. */
export class ConsoleTransport implements EmailTransport {
  readonly name = 'console';

  async send(input: EmailSendInput & { subject: string; body: string }): Promise<'Sent' | 'Failed'> {
    logger.info(
      { to: input.to, subject: input.subject, templateKey: input.templateKey },
      `[email:stub]\n${input.body}`,
    );
    return 'Sent';
  }
}
