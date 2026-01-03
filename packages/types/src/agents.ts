import type { BaseRecord, UUID, AgentType, AgentStatus } from './common';

export interface AgentRun extends BaseRecord {
  // Agent info
  agent_name: string;
  agent_type: AgentType | null;

  // Execution
  status: AgentStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;

  // Results
  actions_taken: number;
  errors_count: number;

  // Logs
  log_data: Record<string, any>;
  error_message: string | null;

  // Metadata
  triggered_by: string | null;
}

export interface CreateAgentRunInput {
  agent_name: string;
  agent_type?: AgentType;
  status?: AgentStatus;
  triggered_by?: string;
  log_data?: Record<string, any>;
}

export interface UpdateAgentRunInput {
  status?: AgentStatus;
  completed_at?: string;
  duration_ms?: number;
  actions_taken?: number;
  errors_count?: number;
  log_data?: Record<string, any>;
  error_message?: string | null;
}

export interface ActivityLog extends BaseRecord {
  // Entity
  entity_type: string;
  entity_id: UUID;

  // Action
  action: string;
  changes: Record<string, any> | null;

  // Actor
  actor_type: 'user' | 'agent' | 'system';
  actor_id: UUID | null;
  agent_run_id: UUID | null;
}

export interface CreateActivityLogInput {
  entity_type: string;
  entity_id: UUID;
  action: string;
  changes?: Record<string, any>;
  actor_type?: 'user' | 'agent' | 'system';
  actor_id?: UUID;
  agent_run_id?: UUID;
}

// Agent run with summary
export interface AgentRunSummary {
  agent_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_duration_ms: number;
  total_actions: number;
  last_run_at: string | null;
}
