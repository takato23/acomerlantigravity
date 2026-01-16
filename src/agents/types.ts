export interface AgentContext {
  userId?: string;
  sessionId?: string;
  conversationHistory?: unknown[];
  userPreferences?: unknown;
  recentActions?: unknown[];
  sharedMemory?: Record<string, unknown>;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ComplexTaskRequest {
  id?: string;
  type?: string;
  payload?: Record<string, unknown>;
}

export interface WorkflowResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
