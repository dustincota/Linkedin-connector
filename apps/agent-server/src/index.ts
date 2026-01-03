import express from 'express';
import { config } from './config';
import { logger } from './lib/logger';
import { scheduleRecurringJobs } from './lib/queue';
import routes from './api/routes';

// Start worker (in separate file to allow for multiple workers)
import './worker';

const app = express();

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/api', routes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, async () => {
  logger.info(`Agent server running on port ${PORT}`, {
    nodeEnv: config.server.nodeEnv,
  });

  // Schedule recurring jobs
  try {
    await scheduleRecurringJobs();
    logger.info('Recurring jobs scheduled');
  } catch (error: any) {
    logger.error('Failed to schedule recurring jobs', { error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
