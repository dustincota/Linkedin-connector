import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { scheduleAgent, AgentJobType, agentQueue } from '../lib/queue';

const router = Router();

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get agent runs history
 */
router.get('/agents/runs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ runs: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get agent run by ID
 */
router.get('/agents/runs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json({ run: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get agent statistics
 */
router.get('/agents/stats', async (req, res) => {
  try {
    // Get stats for each agent type
    const { data: runs, error } = await supabase
      .from('agent_runs')
      .select('agent_name, status, duration_ms, actions_taken, started_at')
      .order('started_at', { ascending: false });

    if (error) throw error;

    // Group by agent name
    const statsByAgent: Record<string, any> = {};

    runs?.forEach((run) => {
      if (!statsByAgent[run.agent_name]) {
        statsByAgent[run.agent_name] = {
          agent_name: run.agent_name,
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
          total_actions: 0,
          average_duration_ms: 0,
          last_run_at: null,
        };
      }

      const stats = statsByAgent[run.agent_name];
      stats.total_runs++;

      if (run.status === 'completed') {
        stats.successful_runs++;
      } else if (run.status === 'failed') {
        stats.failed_runs++;
      }

      stats.total_actions += run.actions_taken || 0;

      if (!stats.last_run_at || new Date(run.started_at) > new Date(stats.last_run_at)) {
        stats.last_run_at = run.started_at;
      }
    });

    // Calculate averages
    Object.values(statsByAgent).forEach((stats: any) => {
      const successfulRuns = runs?.filter(
        (r) => r.agent_name === stats.agent_name && r.status === 'completed'
      );
      if (successfulRuns && successfulRuns.length > 0) {
        const totalDuration = successfulRuns.reduce(
          (sum, r) => sum + (r.duration_ms || 0),
          0
        );
        stats.average_duration_ms = Math.round(totalDuration / successfulRuns.length);
      }
    });

    res.json({ stats: Object.values(statsByAgent) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger an agent manually
 */
router.post('/agents/trigger', async (req, res) => {
  try {
    const { agent, params } = req.body;

    if (!Object.values(AgentJobType).includes(agent)) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    const job = await scheduleAgent(agent as AgentJobType, params);

    res.json({
      message: 'Agent scheduled',
      jobId: job.id,
      agent,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get queue metrics
 */
router.get('/queue/metrics', async (req, res) => {
  try {
    const waiting = await agentQueue.getWaiting();
    const active = await agentQueue.getActive();
    const completed = await agentQueue.getCompleted();
    const failed = await agentQueue.getFailed();

    res.json({
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get upcoming scheduled jobs
 */
router.get('/queue/scheduled', async (req, res) => {
  try {
    const repeatableJobs = await agentQueue.getRepeatableJobs();

    res.json({
      scheduled: repeatableJobs.map((job) => ({
        id: job.id,
        name: job.name,
        pattern: job.pattern,
        next: job.next,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
