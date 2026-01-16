export interface PlannerAgentConfig {
  planningHorizon?: number;
  variabilityFactor?: number;
  nutritionPriority?: number;
  budgetPriority?: number;
  timeConstraints?: boolean;
}

export class PlannerAgent {
  constructor(private readonly config: PlannerAgentConfig = {}) {}

  async initialize(): Promise<void> {
    return;
  }
}
