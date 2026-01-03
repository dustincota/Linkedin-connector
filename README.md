# LinkedIn CRM Business Operating System

An AI-powered business operating system with a LinkedIn CRM at its core, featuring multiple departments of agents for prospecting, content creation, deal management, and operations.

## Architecture

### Core: LinkedIn CRM + Outreach
- Unified inbox for LinkedIn conversations
- Campaign builder with multi-step sequences
- Lead database with AI classification
- Automation via Playwright
- Analytics and reporting

### Departments
- **Prospecting**: Scraping, enrichment, research
- **Creative Agency**: Content creation and publishing
- **Admin**: Email, tasks, calendar management
- **Deals**: M&A pipeline management
- **Buyers**: Buyer matching and outreach

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Node.js agent server
- **Database**: Supabase (PostgreSQL)
- **Queue**: BullMQ + Redis
- **Automation**: Playwright
- **AI**: Claude API (Anthropic)
- **Deployment**: Railway

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Claude API key

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` files in the apps and configure:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# Redis (for BullMQ)
REDIS_URL=your_redis_url
```

### Database Setup

```bash
npm run db:migrate
npm run db:seed
```

### Development

```bash
npm run dev
```

## Project Structure

```
linkedin-crm-business-os/
├── apps/
│   ├── web/              # Next.js dashboard
│   └── agent-server/     # Node.js agent runner
├── packages/
│   ├── database/         # Supabase schema & migrations
│   ├── types/            # Shared TypeScript types
│   ├── linkedin/         # Playwright LinkedIn automation
│   └── agents/           # Agent implementations
└── turbo.json
```

## Build Status

### Phase 1: Foundation ✅
- ✅ Monorepo setup
- ✅ Complete database schema
- ✅ Shared TypeScript types
- ✅ Next.js app with navigation
- ✅ Leads page with CRUD

### Phase 2: LinkedIn Automation ✅
- ✅ Agent server infrastructure
- ✅ BullMQ job queue
- ✅ Playwright LinkedIn service
- ✅ Human-like behavior patterns
- ✅ Inbox Sync agent
- ✅ Campaign Runner agent
- ✅ Reply Classifier agent (Claude)
- ✅ Agent monitoring API

### Phase 3: Campaign Builder & CRM UI ✅
- ✅ Campaigns page with stats
- ✅ Campaign builder UI
- ✅ Campaign detail page
- ✅ Inbox with conversations
- ✅ Analytics dashboard

### Future Phases
- ⏳ Prospecting agents
- ⏳ Content creation agents
- ⏳ Deal pipeline
- ⏳ Admin agents

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Set up environment variables (see DEPLOYMENT.md)

# Run web dashboard
npm run dev

# Run agent server (separate terminal)
cd apps/agent-server
npm run dev
```

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete setup and deployment instructions
- [Database Schema](./packages/database/schema.sql) - Full database structure
- [Agent Architecture](./apps/agent-server/) - How agents work

## License

MIT
