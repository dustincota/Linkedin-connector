# Quick Start - 10 Minute Demo

Get your LinkedIn CRM running with test data in 10 minutes.

## Step 1: Install Dependencies (2 min)

```bash
cd /home/user/Linkedin-connector
npm install
```

## Step 2: Set Up Supabase (3 min)

**A. Create Free Account**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up (free)

**B. Create New Project**
1. Click "New Project"
2. Name: "linkedin-crm-demo"
3. Database Password: (choose something)
4. Region: (choose closest)
5. Click "Create new project" (takes ~2 min)

**C. Run Database Schema**
1. In Supabase, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Copy/paste entire contents of `packages/database/schema.sql`
4. Click "Run" (bottom right)
5. Click "New query" again
6. Copy/paste entire contents of `packages/database/functions.sql`
7. Click "Run"

**D. Get API Keys**
1. Click "Settings" (left sidebar)
2. Click "API"
3. Copy these values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

## Step 3: Configure Environment (1 min)

**A. Web App**
```bash
cd apps/web
cp .env.local.example .env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Get Claude API key: https://console.anthropic.com/ (free tier available)

## Step 4: Add Test Data (1 min)

```bash
cd /home/user/Linkedin-connector
node scripts/seed-demo-data.js
```

This creates:
- 10 test contacts (2 HOT, 3 WARM, 5 COLD)
- 2 active campaigns with stats
- Sample conversations
- Test messages

## Step 5: Start the App (1 min)

```bash
cd apps/web
npm run dev
```

Open: http://localhost:3000

## Step 6: Try the Demo! (2 min)

**A. Command Center** (Main attraction!)
1. Click "Command Center" in sidebar (✨ icon)
2. Try these commands:

```
Show me my hot leads
```

```
How are my campaigns doing?
```

```
What's my reply rate?
```

```
Show today's stats
```

**B. Dashboard Pages**
- Click "Leads" → See 10 test contacts
- Click "Campaigns" → See 2 sample campaigns
- Click "Inbox" → See conversations
- Click "Analytics" → See performance metrics

## Demo Commands to Try

### Basic Queries
```
Show me my hot leads
Show all leads
How many contacts do I have?
What's my best campaign?
Show me warm leads
```

### Analytics
```
How are my campaigns doing?
What's my reply rate?
Show today's stats
Which campaign has the most replies?
```

### Campaign Info
```
Show campaign details for [campaign name]
Which campaign is performing best?
How many campaigns are active?
```

### Leads
```
Show hot leads from this week
Show leads with no activity
How many leads need follow-up?
```

## Expected Demo Results

**Command: "Show me my hot leads"**
```
You have 2 hot leads 🔥:

1. Sarah Johnson
   Title: CEO at TechStartup
   Last message: "I'd love to schedule a call next week"
   Temperature: HOT
   Score: 9/10

2. Mike Chen
   Title: Founder at StartupXYZ
   Last message: "This looks exactly what we need!"
   Temperature: HOT
   Score: 8/10

Would you like me to draft replies for them?
```

**Command: "How are my campaigns doing?"**
```
You have 2 active campaigns:

📊 SaaS Founders Outreach
- 25 enrolled
- 18 messages sent
- 6 replies (33% reply rate)
- 2 HOT leads 🔥
- Status: Performing excellently!

📊 Agency Owners Campaign
- 15 enrolled
- 12 messages sent
- 2 replies (16% reply rate)
- 0 hot leads
- Status: Average performance

Your SaaS campaign is crushing it! 🚀
```

## Troubleshooting

**"Command failed" error:**
- Check your `ANTHROPIC_API_KEY` is set in `.env.local`
- Make sure you ran both SQL files in Supabase

**"No data" responses:**
- Run `node scripts/seed-demo-data.js` again
- Check Supabase SQL Editor for errors

**App won't start:**
```bash
# Clear and reinstall
rm -rf node_modules
npm install
cd apps/web
npm install
npm run dev
```

## What's Next?

After the demo, try:
1. **Add real leads** - Import CSV or add manually
2. **Create real campaign** - Use the campaign builder
3. **Set up agent server** - For automation (see DEPLOYMENT.md)

## Optional: Agent Server (Real Automation)

To enable actual LinkedIn automation:

**1. Install Redis**
```bash
brew install redis  # Mac
redis-server
```

**2. Configure Agent Server**
```bash
cd apps/agent-server
cp .env.example .env
```

Edit with your credentials.

**3. Start Agent Server**
```bash
cd apps/agent-server
npm run dev
```

Now agents will run automatically!

## Demo Video

Want to see it in action first? Check demo video: [link]

## Need Help?

- See full deployment guide: `DEPLOYMENT.md`
- Check database schema: `packages/database/schema.sql`
- View agent architecture: `apps/agent-server/`

Enjoy your AI-powered LinkedIn CRM! 🚀
