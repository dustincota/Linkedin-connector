import { Worker, Job } from 'bullmq';
import { connection, AgentJobType, type AgentJobData } from './lib/queue';
import { supabase } from './lib/supabase';
import { logger } from './lib/logger';

// Import agents
import { InboxSyncAgent } from './agents/inbox-sync-agent';
import { CampaignRunnerAgent } from './agents/campaign-runner-agent';
import { ReplyClassifierAgent } from './agents/reply-classifier-agent';

/**
 * Agent Worker
 *
 * Processes jobs from the agent queue
 */
export const agentWorker = new Worker<AgentJobData>(
  'agents',
  async (job: Job<AgentJobData>) => {
    const { type, params } = job.data;

    logger.info(`Processing agent job: ${type}`, { jobId: job.id, params });

    try {
      let result;

      switch (type) {
        case AgentJobType.INBOX_SYNC:
          const inboxAgent = new InboxSyncAgent(supabase, logger);
          result = await inboxAgent.run(job.opts?.repeat ? 'schedule' : 'manual');
          break;

        case AgentJobType.CAMPAIGN_RUNNER:
          const campaignAgent = new CampaignRunnerAgent(supabase, logger);
          result = await campaignAgent.run(job.opts?.repeat ? 'schedule' : 'manual');
          break;

        case AgentJobType.REPLY_CLASSIFIER:
          const classifierAgent = new ReplyClassifierAgent(supabase, logger);
          result = await classifierAgent.run(job.opts?.repeat ? 'schedule' : 'manual');
          break;

        default:
          throw new Error(`Unknown agent type: ${type}`);
      }

      logger.info(`Agent job completed: ${type}`, {
        jobId: job.id,
        success: result.success,
        actionsCount: result.actionsCount,
        errorsCount: result.errorsCount,
      });

      return result;
    } catch (error: any) {
      logger.error(`Agent job failed: ${type}`, {
        jobId: job.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Process one job at a time to avoid conflicts
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per minute
    },
  }
);

agentWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

agentWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: err.message });
});

agentWorker.on('error', (err) => {
  logger.error('Worker error', { error: err.message });
});

logger.info('Agent worker started');
