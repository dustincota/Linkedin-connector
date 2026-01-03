import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// Agent queues
export const agentQueue = new Queue('agents', { connection });

// Queue events for monitoring
const queueEvents = new QueueEvents('agents', { connection });

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`Job ${jobId} completed`, { returnvalue });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed`, { failedReason });
});

// Agent job types
export enum AgentJobType {
  INBOX_SYNC = 'inbox-sync',
  CAMPAIGN_RUNNER = 'campaign-runner',
  REPLY_CLASSIFIER = 'reply-classifier',
  AUTO_RESPONDER = 'auto-responder',
  SCRAPER = 'scraper',
  ENRICHMENT = 'enrichment',
  CONTENT_WRITER = 'content-writer',
  CONTENT_PUBLISHER = 'content-publisher',
}

export interface AgentJobData {
  type: AgentJobType;
  params?: Record<string, any>;
}

// Schedule agent jobs
export async function scheduleAgent(type: AgentJobType, params?: Record<string, any>) {
  return await agentQueue.add(
    type,
    { type, params },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}

// Schedule recurring jobs
export async function scheduleRecurringJobs() {
  // Inbox Sync - every 30 minutes
  await agentQueue.add(
    AgentJobType.INBOX_SYNC,
    { type: AgentJobType.INBOX_SYNC },
    {
      repeat: {
        pattern: '*/30 * * * *', // Every 30 minutes
      },
    }
  );

  // Campaign Runner - every 30 minutes
  await agentQueue.add(
    AgentJobType.CAMPAIGN_RUNNER,
    { type: AgentJobType.CAMPAIGN_RUNNER },
    {
      repeat: {
        pattern: '*/30 * * * *',
      },
    }
  );

  // Reply Classifier - every 30 minutes
  await agentQueue.add(
    AgentJobType.REPLY_CLASSIFIER,
    { type: AgentJobType.REPLY_CLASSIFIER },
    {
      repeat: {
        pattern: '*/30 * * * *',
      },
    }
  );

  logger.info('Scheduled recurring agent jobs');
}

export { connection };
