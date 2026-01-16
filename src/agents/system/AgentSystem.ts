export interface AgentSystemConfig {
  agents: string[];
  monitoring?: boolean;
  autoStart?: boolean;
}

export class AgentSystem {
  constructor(private readonly config: AgentSystemConfig) {}

  async initialize(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    return;
  }

  getSystemHealth(): Record<string, unknown> {
    return { status: 'unknown', agents: this.config.agents };
  }

  getSystemMetrics(): Record<string, unknown> {
    return {};
  }
}
