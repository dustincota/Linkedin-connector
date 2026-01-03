# Deployment Guide

## Prerequisites

- Node.js 18+
- Redis (for BullMQ)
- Supabase account
- Anthropic API key (Claude)
- LinkedIn account for automation
- Railway account (recommended for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Run the database schema:
   - Open SQL Editor in Supabase
   - Copy and run `packages/database/schema.sql`
   - Copy and run `packages/database/functions.sql`
3. Get your credentials from Project Settings > API

### 3. Set Up Redis

**Option A: Local Redis**
```bash
# Install Redis
brew install redis  # macOS
# or
sudo apt-get install redis  # Ubuntu

# Start Redis
redis-server
```

**Option B: Redis Cloud (Recommended for production)**
- Create free account at https://redis.com/try-free/
- Get connection details

### 4. Configure Environment Variables

**Web App (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Agent Server (`apps/agent-server/.env`):**
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Anthropic Claude
ANTHROPIC_API_KEY=your_claude_api_key

# LinkedIn Credentials
LINKEDIN_EMAIL=your_linkedin_email
LINKEDIN_PASSWORD=your_linkedin_password

# Server
PORT=3001
NODE_ENV=development

# Pushover (optional - for mobile notifications)
PUSHOVER_USER_KEY=
PUSHOVER_API_TOKEN=
```

### 5. Run Development Servers

```bash
# Terminal 1: Web app
npm run dev

# Terminal 2: Agent server (requires Redis running)
cd apps/agent-server
npm run dev
```

**Access:**
- Web Dashboard: http://localhost:3000
- Agent API: http://localhost:3001/api

## Production Deployment

### Deploy to Railway (Recommended)

Railway provides easy deployment for both the web app and agent server.

**1. Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

**2. Create New Project:**
```bash
railway init
```

**3. Deploy Web App:**
```bash
# From root directory
railway up apps/web

# Add environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# ... add all web env vars
```

**4. Deploy Agent Server:**
```bash
railway up apps/agent-server

# Add environment variables
railway variables set SUPABASE_URL=your_url
railway variables set ANTHROPIC_API_KEY=your_key
# ... add all agent server env vars
```

**5. Add Redis:**
- In Railway dashboard, add Redis plugin
- Railway will automatically set REDIS_URL

### Alternative: Deploy to Vercel (Web) + Render (Agent Server)

**Web App to Vercel:**
```bash
cd apps/web
vercel
```

**Agent Server to Render:**
1. Create new Web Service on Render
2. Connect GitHub repo
3. Set build command: `cd apps/agent-server && npm install && npm run build`
4. Set start command: `cd apps/agent-server && npm start`
5. Add environment variables

## LinkedIn Automation Setup

### Important: LinkedIn Account Safety

1. **Use a dedicated LinkedIn account** for automation (not your primary account)
2. **Start slow**: Begin with low daily limits (5-10 connections/day)
3. **Gradually increase**: Increase limits over weeks to build reputation
4. **Stay within limits**:
   - Max 50 connection requests per day
   - Max 100 messages per day
   - Only during working hours
5. **Human-like behavior**: The system includes Gaussian delays and random actions

### Configure Working Hours

In the database, update campaign settings:
```sql
UPDATE campaigns
SET
  working_hours_start = '09:00',
  working_hours_end = '17:00',
  working_days = ARRAY[1,2,3,4,5],  -- Monday-Friday
  daily_limit = 20,  -- Start conservative
  timezone = 'America/New_York'
WHERE id = 'your_campaign_id';
```

## Monitoring

### Agent Dashboard

Access at: `http://your-domain/agents`

**API Endpoints:**
- `GET /api/agents/runs` - Recent agent runs
- `GET /api/agents/stats` - Agent statistics
- `GET /api/queue/metrics` - Queue metrics
- `POST /api/agents/trigger` - Manually trigger agent

**Example: Trigger Agent Manually**
```bash
curl -X POST http://localhost:3001/api/agents/trigger \
  -H "Content-Type: application/json" \
  -d '{"agent": "inbox-sync"}'
```

### Logs

**Development:**
- Console output
- Files: `apps/agent-server/logs/`

**Production (Railway):**
```bash
railway logs
```

## Scheduled Jobs

The agent server automatically schedules:

- **Inbox Sync**: Every 30 minutes
- **Campaign Runner**: Every 30 minutes
- **Reply Classifier**: Every 30 minutes

Modify schedule in `apps/agent-server/src/lib/queue.ts`

## Troubleshooting

### LinkedIn Login Issues

If Playwright can't log in:
1. Run in non-headless mode for debugging:
   ```typescript
   // packages/linkedin/src/linkedin-service.ts
   headless: false  // Line 33
   ```
2. Check for 2FA - may need to disable or use session cookies
3. LinkedIn may require CAPTCHA - consider manual login first time

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### Agent Not Running

1. Check Redis is running
2. Check agent-server logs
3. Verify environment variables
4. Check Supabase connection

## Performance Optimization

### Database Indexes

All critical indexes are created in `schema.sql`. For large datasets:

```sql
-- Add additional indexes as needed
CREATE INDEX idx_messages_conversation_sent ON messages(conversation_id, sent_at DESC);
CREATE INDEX idx_contacts_temperature_score ON contacts(temperature, score DESC);
```

### Queue Concurrency

Adjust in `apps/agent-server/src/worker.ts`:

```typescript
concurrency: 3  // Process 3 jobs simultaneously
```

## Security Best Practices

1. **Never commit `.env` files**
2. **Use service role key only server-side**
3. **Rotate API keys regularly**
4. **Enable RLS** (Row Level Security) in Supabase for multi-user
5. **Use HTTPS** in production
6. **Secure agent API** with authentication

## Scaling

### Horizontal Scaling

Run multiple agent workers:
```bash
# Terminal 1
npm run start

# Terminal 2
npm run start

# Both connect to same Redis queue
```

### Database Scaling

Supabase auto-scales, but monitor:
- Connection pool size
- Query performance
- Index usage

## Cost Estimates

**Supabase:** Free tier → $25/mo for production
**Redis:** Free tier → $5/mo
**Railway:** $5/mo per service
**Claude API:** ~$0.003 per message classification
**Total:** ~$15-50/mo depending on usage

## Support

For issues:
1. Check logs in `apps/agent-server/logs/`
2. Review agent runs in database: `SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 10;`
3. Test agents manually via API

## Next Steps

After deployment:
1. Import initial leads via CSV
2. Create first campaign
3. Test with small daily limits
4. Monitor agent performance
5. Gradually scale up automation
