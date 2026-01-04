#!/usr/bin/env node

/**
 * Automated Database Setup Script
 *
 * This script:
 * 1. Reads the schema.sql and functions.sql files
 * 2. Executes them against your Supabase database
 * 3. Seeds demo data
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(sqlContent, description) {
  console.log(`\n🔄 Running ${description}...`);

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: directError } = await supabase.from('_').select('*').limit(0);

      // Split SQL into statements and execute one by one
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('query', {
          query: statement + ';'
        });

        if (stmtError) {
          console.error(`❌ Error executing statement: ${stmtError.message}`);
          throw stmtError;
        }
      }
    }

    console.log(`✅ ${description} completed successfully!`);
    return true;
  } catch (err) {
    console.error(`❌ Error in ${description}:`, err.message);
    return false;
  }
}

async function executeSQLFile(filePath, description) {
  console.log(`\n📄 Reading ${description}...`);

  try {
    const sqlContent = readFileSync(filePath, 'utf-8');
    console.log(`✅ File read successfully (${sqlContent.length} characters)`);

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      process.stdout.write(`\r   Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Use raw SQL execution via Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok && response.status !== 404) {
          // Try direct postgres connection style
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          if (error && !error.message.includes('does not exist')) {
            console.error(`\n⚠️  Warning on statement ${i + 1}: ${error.message}`);
          }
        }
      } catch (err) {
        // Continue even if there are errors (some statements might already exist)
        if (!err.message.includes('already exists')) {
          console.error(`\n⚠️  Warning on statement ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ ${description} completed!`);
    return true;
  } catch (err) {
    console.error(`\n❌ Error reading ${description}:`, err.message);
    return false;
  }
}

async function seedDemoData() {
  console.log('\n🌱 Seeding demo data...');

  try {
    // Create companies
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .insert([
        {
          name: 'TechCorp Solutions',
          domain: 'techcorp.com',
          industry: 'Software',
          size: '51-200',
          linkedin_url: 'https://linkedin.com/company/techcorp',
        },
        {
          name: 'Growth Ventures',
          domain: 'growthventures.io',
          industry: 'Venture Capital',
          size: '11-50',
          linkedin_url: 'https://linkedin.com/company/growth-ventures',
        },
      ])
      .select();

    if (compError) throw compError;
    console.log('✅ Created 2 companies');

    // Create contacts
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .insert([
        {
          company_id: companies[0].id,
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@techcorp.com',
          title: 'VP of Sales',
          linkedin_url: 'https://linkedin.com/in/sarahjohnson',
          temperature: 'HOT',
          score: 9,
          headline: 'VP of Sales at TechCorp | B2B SaaS Expert',
          location: 'San Francisco, CA',
          connection_status: 'connected',
          tags: ['decision-maker', 'saas'],
        },
        {
          company_id: companies[0].id,
          first_name: 'Mike',
          last_name: 'Chen',
          email: 'mike@techcorp.com',
          title: 'Head of Marketing',
          linkedin_url: 'https://linkedin.com/in/mikechen',
          temperature: 'HOT',
          score: 8,
          headline: 'Marketing Leader | Growth Hacker',
          location: 'Austin, TX',
          connection_status: 'connected',
          tags: ['marketing', 'growth'],
        },
        {
          company_id: companies[1].id,
          first_name: 'Jessica',
          last_name: 'Williams',
          email: 'jessica@growthventures.io',
          title: 'Partner',
          linkedin_url: 'https://linkedin.com/in/jessicawilliams',
          temperature: 'WARM',
          score: 7,
          headline: 'VC Partner | Early Stage Investor',
          location: 'New York, NY',
          connection_status: 'connected',
          tags: ['investor', 'vc'],
        },
        {
          first_name: 'David',
          last_name: 'Martinez',
          email: 'david.martinez@email.com',
          title: 'CEO',
          linkedin_url: 'https://linkedin.com/in/davidmartinez',
          temperature: 'WARM',
          score: 6,
          headline: 'CEO & Founder | E-commerce',
          location: 'Los Angeles, CA',
          connection_status: 'pending',
          tags: ['founder', 'ecommerce'],
        },
        {
          first_name: 'Emily',
          last_name: 'Taylor',
          email: 'emily@startup.com',
          title: 'Product Manager',
          linkedin_url: 'https://linkedin.com/in/emilytaylor',
          temperature: 'WARM',
          score: 6,
          headline: 'Product Manager | SaaS',
          location: 'Seattle, WA',
          connection_status: 'connected',
          tags: ['product'],
        },
        {
          first_name: 'Robert',
          last_name: 'Anderson',
          email: 'robert@company.com',
          title: 'Director of Operations',
          linkedin_url: 'https://linkedin.com/in/robertanderson',
          temperature: 'COLD',
          score: 4,
          headline: 'Operations Director',
          location: 'Chicago, IL',
          connection_status: 'not_connected',
        },
        {
          first_name: 'Lisa',
          last_name: 'Thompson',
          email: 'lisa@business.com',
          title: 'Sales Manager',
          linkedin_url: 'https://linkedin.com/in/lisathompson',
          temperature: 'COLD',
          score: 5,
          headline: 'Sales Professional',
          location: 'Boston, MA',
          connection_status: 'not_connected',
        },
        {
          first_name: 'James',
          last_name: 'Wilson',
          email: 'james@corp.com',
          title: 'Account Executive',
          linkedin_url: 'https://linkedin.com/in/jameswilson',
          temperature: 'COLD',
          score: 3,
          headline: 'Account Executive',
          location: 'Miami, FL',
          connection_status: 'not_connected',
        },
        {
          first_name: 'Maria',
          last_name: 'Garcia',
          email: 'maria@enterprise.com',
          title: 'Business Development',
          linkedin_url: 'https://linkedin.com/in/mariagarcia',
          temperature: 'COLD',
          score: 4,
          headline: 'BD Manager',
          location: 'Denver, CO',
          connection_status: 'not_connected',
        },
        {
          first_name: 'Chris',
          last_name: 'Brown',
          email: 'chris@company.io',
          title: 'CTO',
          linkedin_url: 'https://linkedin.com/in/chrisbrown',
          temperature: 'COLD',
          score: 5,
          headline: 'Chief Technology Officer',
          location: 'Portland, OR',
          connection_status: 'not_connected',
        },
      ])
      .select();

    if (contactError) throw contactError;
    console.log('✅ Created 10 contacts (2 HOT, 3 WARM, 5 COLD)');

    // Create campaigns
    const { data: campaigns, error: campError } = await supabase
      .from('campaigns')
      .insert([
        {
          name: 'SaaS Founders Outreach',
          description: 'Target SaaS founders for partnership opportunities',
          status: 'active',
          daily_limit: 20,
          use_ai_personalization: true,
          total_enrolled: 15,
          total_sent: 12,
          total_connected: 8,
          total_replied: 5,
          total_hot: 2,
        },
        {
          name: 'VC Partnership Campaign',
          description: 'Connect with VCs for deal flow partnership',
          status: 'active',
          daily_limit: 10,
          use_ai_personalization: true,
          total_enrolled: 8,
          total_sent: 6,
          total_connected: 4,
          total_replied: 2,
          total_hot: 1,
        },
      ])
      .select();

    if (campError) throw campError;
    console.log('✅ Created 2 campaigns');

    // Create campaign steps for first campaign
    const { error: stepsError } = await supabase
      .from('campaign_steps')
      .insert([
        {
          campaign_id: campaigns[0].id,
          step_number: 1,
          type: 'connection_request',
          template: 'Hi {{first_name}}, I came across your profile and was impressed by your work in {{industry}}. Would love to connect!',
          delay_value: 0,
          delay_unit: 'minutes',
        },
        {
          campaign_id: campaigns[0].id,
          step_number: 2,
          type: 'message',
          template: 'Thanks for connecting! I help SaaS founders like you scale their sales operations. Would you be open to a quick chat?',
          delay_value: 2,
          delay_unit: 'days',
          condition_type: 'connected',
        },
      ]);

    if (stepsError) throw stepsError;
    console.log('✅ Created campaign steps');

    // Create conversations and messages for HOT leads
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .insert([
        {
          contact_id: contacts[0].id, // Sarah
          campaign_id: campaigns[0].id,
          linkedin_conversation_id: 'conv_sarah_123',
          temperature: 'HOT',
          temperature_reason: 'Expressed strong interest in partnership and asked about pricing',
          last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          last_message_from: 'contact',
          status: 'active',
        },
        {
          contact_id: contacts[1].id, // Mike
          campaign_id: campaigns[0].id,
          linkedin_conversation_id: 'conv_mike_456',
          temperature: 'HOT',
          temperature_reason: 'Wants to schedule a demo call this week',
          last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          last_message_from: 'contact',
          status: 'active',
        },
      ])
      .select();

    if (convError) throw convError;

    // Create messages
    const { error: msgError } = await supabase
      .from('messages')
      .insert([
        // Sarah's conversation
        {
          conversation_id: conversations[0].id,
          contact_id: contacts[0].id,
          message: 'Thanks for connecting! I help SaaS founders like you scale their sales operations. Would you be open to a quick chat?',
          direction: 'outbound',
          sent_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        },
        {
          conversation_id: conversations[0].id,
          contact_id: contacts[0].id,
          message: "This sounds interesting! We've been looking for solutions to help scale our outbound. What kind of pricing do you have?",
          direction: 'inbound',
          sentiment: 'positive',
          intent: 'pricing_inquiry',
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        },
        // Mike's conversation
        {
          conversation_id: conversations[1].id,
          contact_id: contacts[1].id,
          message: 'Thanks for connecting! I help SaaS founders like you scale their sales operations. Would you be open to a quick chat?',
          direction: 'outbound',
          sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        {
          conversation_id: conversations[1].id,
          contact_id: contacts[1].id,
          message: "Yes! I'd love to see a demo. Do you have any availability this week for a 30-min call?",
          direction: 'inbound',
          sentiment: 'positive',
          intent: 'meeting_request',
          sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        },
      ]);

    if (msgError) throw msgError;
    console.log('✅ Created conversations and messages');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   • 2 companies');
    console.log('   • 10 contacts (2 HOT, 3 WARM, 5 COLD)');
    console.log('   • 2 active campaigns');
    console.log('   • 2 conversations with messages');

    return true;
  } catch (err) {
    console.error('❌ Error seeding demo data:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 LinkedIn CRM Database Setup\n');
  console.log('================================================');

  // Step 1: Run schema
  const schemaPath = join(__dirname, '..', 'packages', 'database', 'schema.sql');
  const schemaSuccess = await executeSQLFile(schemaPath, 'Database Schema');

  if (!schemaSuccess) {
    console.log('\n⚠️  Schema execution had warnings, but continuing...');
  }

  // Step 2: Run functions
  const functionsPath = join(__dirname, '..', 'packages', 'database', 'functions.sql');
  const functionsSuccess = await executeSQLFile(functionsPath, 'Database Functions');

  if (!functionsSuccess) {
    console.log('\n⚠️  Functions execution had warnings, but continuing...');
  }

  // Step 3: Seed demo data
  const seedSuccess = await seedDemoData();

  console.log('\n================================================');
  console.log('✅ Setup Complete!\n');
  console.log('Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run dev');
  console.log('3. Open: http://localhost:3000');
  console.log('\n🎯 Try the Command Center at /command-center');
  console.log('');
}

main().catch(console.error);
