import { BUILT_IN_TEMPLATES, DEFAULT_EVENT_CHECKLIST } from '@app/shared';
import type { AiProvider } from './AiProvider';

/**
 * Phase 1's only AiProvider implementation. Exercises the full seam end-to-end
 * (routes -> service -> provider) with deterministic, rule-based output instead
 * of a real LLM call. Swap in a real provider later behind this same interface.
 */
export class NoopAiProvider implements AiProvider {
  async generateChecklist(eventCategory: string): Promise<string[]> {
    return [...(BUILT_IN_TEMPLATES[eventCategory] ?? DEFAULT_EVENT_CHECKLIST)];
  }

  async suggestMissingTasks(): Promise<string[]> {
    return [];
  }

  async summarizeProgress(): Promise<string> {
    return 'AI summaries are not enabled yet — this is a placeholder from the NoopAiProvider.';
  }
}

export const aiProvider: AiProvider = new NoopAiProvider();
