import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from 'winston';

export interface AgentRunResult {
  success: boolean;
  actionsCount: number;
  errorsCount: number;
  logs: Record<string, any>;
  errorMessage?: string;
}

export abstract class BaseAgent {
  protected supabase: SupabaseClient;
  protected logger: Logger;
  protected agentName: string;
  protected agentType: string;

  private runId?: string;
  private startTime?: number;
  private actionsCount = 0;
  private errorsCount = 0;
  private logs: Record<string, any> = {};

  constructor(
    supabase: SupabaseClient,
    logger: Logger,
    agentName: string,
    agentType: string
  ) {
    this.supabase = supabase;
    this.logger = logger;
    this.agentName = agentName;
    this.agentType = agentType;
  }

  /**
   * Main entry point for running the agent
   */
  async run(triggeredBy: string = 'schedule'): Promise<AgentRunResult> {
    this.startTime = Date.now();
    this.actionsCount = 0;
    this.errorsCount = 0;
    this.logs = {};

    try {
      // Create agent run record
      await this.createAgentRun(triggeredBy);

      this.logger.info(`[${this.agentName}] Starting agent run`, {
        agentName: this.agentName,
        agentType: this.agentType,
        triggeredBy,
      });

      // Execute agent logic
      await this.execute();

      // Complete agent run
      await this.completeAgentRun('completed');

      this.logger.info(`[${this.agentName}] Agent run completed`, {
        agentName: this.agentName,
        actionsCount: this.actionsCount,
        errorsCount: this.errorsCount,
        duration: Date.now() - this.startTime,
      });

      return {
        success: true,
        actionsCount: this.actionsCount,
        errorsCount: this.errorsCount,
        logs: this.logs,
      };
    } catch (error: any) {
      this.errorsCount++;
      this.logger.error(`[${this.agentName}] Agent run failed`, {
        agentName: this.agentName,
        error: error.message,
        stack: error.stack,
      });

      await this.completeAgentRun('failed', error.message);

      return {
        success: false,
        actionsCount: this.actionsCount,
        errorsCount: this.errorsCount,
        logs: this.logs,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Abstract method that each agent must implement
   */
  protected abstract execute(): Promise<void>;

  /**
   * Helper to track actions taken
   */
  protected incrementActions(count: number = 1) {
    this.actionsCount += count;
  }

  /**
   * Helper to track errors
   */
  protected incrementErrors(count: number = 1) {
    this.errorsCount += count;
  }

  /**
   * Helper to add log data
   */
  protected addLog(key: string, value: any) {
    this.logs[key] = value;
  }

  /**
   * Create agent run record in database
   */
  private async createAgentRun(triggeredBy: string) {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .insert([
        {
          agent_name: this.agentName,
          agent_type: this.agentType,
          status: 'running',
          triggered_by: triggeredBy,
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create agent run: ${error.message}`);
    }

    this.runId = data.id;
  }

  /**
   * Update agent run record on completion
   */
  private async completeAgentRun(status: 'completed' | 'failed', errorMessage?: string) {
    if (!this.runId || !this.startTime) return;

    const duration = Date.now() - this.startTime;

    const { error } = await this.supabase
      .from('agent_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        actions_taken: this.actionsCount,
        errors_count: this.errorsCount,
        log_data: this.logs,
        error_message: errorMessage,
      })
      .eq('id', this.runId);

    if (error) {
      this.logger.error(`Failed to update agent run: ${error.message}`);
    }
  }

  /**
   * Log activity for audit trail
   */
  protected async logActivity(
    entityType: string,
    entityId: string,
    action: string,
    changes?: Record<string, any>
  ) {
    await this.supabase.from('activity_log').insert([
      {
        entity_type: entityType,
        entity_id: entityId,
        action,
        changes,
        actor_type: 'agent',
        actor_id: null,
        agent_run_id: this.runId,
      },
    ]);
  }

  /**
   * Create notification
   */
  protected async createNotification(
    title: string,
    message: string,
    type: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    relatedEntities?: {
      contactId?: string;
      dealId?: string;
      taskId?: string;
    }
  ) {
    await this.supabase.from('notifications').insert([
      {
        title,
        message,
        type,
        priority,
        channel: priority === 'urgent' ? 'pushover' : 'in_app',
        contact_id: relatedEntities?.contactId,
        deal_id: relatedEntities?.dealId,
        task_id: relatedEntities?.taskId,
      },
    ]);
  }
}
