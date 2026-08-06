export interface AiProvider {
  generateChecklist(eventCategory: string): Promise<string[]>;
  suggestMissingTasks(eventId: string): Promise<string[]>;
  summarizeProgress(eventId: string): Promise<string>;
}
