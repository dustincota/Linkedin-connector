# Quickstart Demo Guide

## Get the App Running (5 minutes)

### Step 1: Open Terminal
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter
- **Linux**: Press `Ctrl + Alt + T`

### Step 2: Navigate to Project
```bash
cd /home/user/Linkedin-connector
```

### Step 3: Install Dependencies (if not already done)
```bash
npm install
```

### Step 4: Start the Web App
```bash
cd apps/web
npm run dev
```

You should see:
```
✓ Ready in 3s
- Local: http://localhost:3000
```

### Step 5: Open Browser
Go to: **http://localhost:3000**

---

## What You'll See

Your LinkedIn CRM with:
- 10 demo contacts (2 HOT 🔥, 3 WARM 🟡, 5 COLD 🔵)
- 2 active campaigns
- Leads, Campaigns, Inbox, Analytics pages
- Command Center for chatting with Claude

## Pages to Try

- **/leads** - View all contacts
- **/campaigns** - See outreach campaigns
- **/command-center** - Chat with Claude to manage your CRM
- **/inbox** - Message conversations
- **/analytics** - Performance dashboard

---

## Troubleshooting

**Port 3000 already in use?**
```bash
PORT=3001 npm run dev
```
Then open: http://localhost:3001

**Can't find the folder?**
The project is at: `/home/user/Linkedin-connector`

---

Enjoy! 🚀
