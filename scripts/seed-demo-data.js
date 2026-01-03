/**
 * Seed Demo Data
 *
 * Creates sample data for demo/testing:
 * - 10 contacts (2 HOT, 3 WARM, 5 COLD)
 * - 2 campaigns with stats
 * - Sample conversations
 * - Test messages
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedDemoData() {
  console.log('🌱 Seeding demo data...\n');

  try {
    // 1. Create Companies
    console.log('Creating companies...');
    const { data: companies } = await supabase
      .from('companies')
      .insert([
        {
          name: 'TechStartup Inc',
          industry: 'SaaS',
          size: '11-50',
          domain: 'techstartup.com',
        },
        {
          name: 'StartupXYZ',
          industry: 'Technology',
          size: '1-10',
          domain: 'startupxyz.com',
        },
        {
          name: 'Agency Pro',
          industry: 'Marketing',
          size: '51-200',
          domain: 'agencypro.com',
        },
      ])
      .select();
    console.log(`✓ Created ${companies.length} companies\n`);

    // 2. Create Contacts
    console.log('Creating contacts...');
    const { data: contacts } = await supabase
      .from('contacts')
      .insert([
        // HOT Leads
        {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@techstartup.com',
          title: 'CEO',
          company_id: companies[0].id,
          temperature: 'HOT',
          score: 9,
          linkedin_url: 'https://linkedin.com/in/sarahjohnson',
          connection_status: 'connected',
          source: 'demo',
        },
        {
          first_name: 'Mike',
          last_name: 'Chen',
          email: 'mike@startupxyz.com',
          title: 'Founder',
          company_id: companies[1].id,
          temperature: 'HOT',
          score: 8,
          linkedin_url: 'https://linkedin.com/in/mikechen',
          connection_status: 'connected',
          source: 'demo',
        },

        // WARM Leads
        {
          first_name: 'Emily',
          last_name: 'Rodriguez',
          email: 'emily@agencypro.com',
          title: 'Marketing Director',
          company_id: companies[2].id,
          temperature: 'WARM',
          score: 7,
          linkedin_url: 'https://linkedin.com/in/emilyrodriguez',
          connection_status: 'connected',
          source: 'demo',
        },
        {
          first_name: 'David',
          last_name: 'Kim',
          email: 'david@techstartup.com',
          title: 'CTO',
          company_id: companies[0].id,
          temperature: 'WARM',
          score: 6,
          linkedin_url: 'https://linkedin.com/in/davidkim',
          connection_status: 'connected',
          source: 'demo',
        },
        {
          first_name: 'Lisa',
          last_name: 'Patel',
          email: 'lisa@startupxyz.com',
          title: 'VP Sales',
          company_id: companies[1].id,
          temperature: 'WARM',
          score: 7,
          linkedin_url: 'https://linkedin.com/in/lisapatel',
          connection_status: 'connected',
          source: 'demo',
        },

        // COLD Leads
        {
          first_name: 'John',
          last_name: 'Smith',
          email: 'john@example.com',
          title: 'Product Manager',
          temperature: 'COLD',
          score: 5,
          linkedin_url: 'https://linkedin.com/in/johnsmith',
          connection_status: 'pending',
          source: 'demo',
        },
        {
          first_name: 'Anna',
          last_name: 'Martinez',
          email: 'anna@example.com',
          title: 'Designer',
          temperature: 'COLD',
          score: 4,
          linkedin_url: 'https://linkedin.com/in/annamartinez',
          connection_status: 'pending',
          source: 'demo',
        },
        {
          first_name: 'James',
          last_name: 'Wilson',
          email: 'james@example.com',
          title: 'Developer',
          temperature: 'COLD',
          score: 5,
          linkedin_url: 'https://linkedin.com/in/jameswilson',
          connection_status: 'not_connected',
          source: 'demo',
        },
        {
          first_name: 'Maria',
          last_name: 'Garcia',
          email: 'maria@example.com',
          title: 'Consultant',
          temperature: 'COLD',
          score: 4,
          linkedin_url: 'https://linkedin.com/in/mariagarcia',
          connection_status: 'not_connected',
          source: 'demo',
        },
        {
          first_name: 'Robert',
          last_name: 'Taylor',
          email: 'robert@example.com',
          title: 'Analyst',
          temperature: 'COLD',
          score: 5,
          linkedin_url: 'https://linkedin.com/in/roberttaylor',
          connection_status: 'not_connected',
          source: 'demo',
        },
      ])
      .select();
    console.log(`✓ Created ${contacts.length} contacts (2 HOT, 3 WARM, 5 COLD)\n`);

    // 3. Create Campaigns
    console.log('Creating campaigns...');
    const { data: campaigns } = await supabase
      .from('campaigns')
      .insert([
        {
          name: 'SaaS Founders Outreach',
          description: 'Targeting SaaS company founders and CEOs',
          status: 'active',
          daily_limit: 25,
          use_ai_personalization: true,
          total_enrolled: 25,
          total_sent: 18,
          total_connected: 12,
          total_replied: 6,
          total_hot: 2,
        },
        {
          name: 'Agency Owners Campaign',
          description: 'Reaching out to marketing agency owners',
          status: 'active',
          daily_limit: 20,
          use_ai_personalization: true,
          total_enrolled: 15,
          total_sent: 12,
          total_connected: 8,
          total_replied: 2,
          total_hot: 0,
        },
      ])
      .select();
    console.log(`✓ Created ${campaigns.length} campaigns\n`);

    // 4. Create Campaign Steps
    console.log('Creating campaign steps...');
    await supabase.from('campaign_steps').insert([
      // SaaS Founders Campaign
      {
        campaign_id: campaigns[0].id,
        step_number: 1,
        type: 'connection_request',
        template: 'Hi {{first_name}}, I noticed you\'re building something amazing at {{company}}. Would love to connect!',
        delay_value: 0,
        delay_unit: 'days',
      },
      {
        campaign_id: campaigns[0].id,
        step_number: 2,
        type: 'message',
        template: 'Hey {{first_name}}, thanks for connecting! I help SaaS founders like you scale their outreach. Would you be open to a quick chat?',
        delay_value: 2,
        delay_unit: 'days',
        condition_type: 'connected',
      },
      {
        campaign_id: campaigns[0].id,
        step_number: 3,
        type: 'follow_up',
        template: 'Just following up on my previous message. Would love to share how we\'ve helped companies like {{company}} 3x their LinkedIn response rates.',
        delay_value: 3,
        delay_unit: 'days',
        condition_type: 'no_reply',
      },

      // Agency Owners Campaign
      {
        campaign_id: campaigns[1].id,
        step_number: 1,
        type: 'connection_request',
        template: 'Hi {{first_name}}, fellow marketer here! Love what {{company}} is doing. Let\'s connect!',
        delay_value: 0,
        delay_unit: 'days',
      },
      {
        campaign_id: campaigns[1].id,
        step_number: 2,
        type: 'message',
        template: 'Thanks for connecting {{first_name}}! I help agencies automate their LinkedIn outreach. Want to see how?',
        delay_value: 2,
        delay_unit: 'days',
        condition_type: 'connected',
      },
    ]);
    console.log('✓ Created campaign steps\n');

    // 5. Create Conversations
    console.log('Creating conversations...');
    const hotContacts = contacts.filter((c) => c.temperature === 'HOT');
    const { data: conversations } = await supabase
      .from('conversations')
      .insert(
        hotContacts.map((contact) => ({
          contact_id: contact.id,
          campaign_id: campaigns[0].id,
          temperature: 'HOT',
          temperature_reason: 'Expressed strong interest in scheduling a call',
          last_message_at: new Date().toISOString(),
          last_message_from: 'contact',
          status: 'active',
          unread_count: 1,
        }))
      )
      .select();
    console.log(`✓ Created ${conversations.length} conversations\n`);

    // 6. Create Messages
    console.log('Creating messages...');
    await supabase.from('messages').insert([
      // Sarah's conversation
      {
        conversation_id: conversations[0].id,
        contact_id: hotContacts[0].id,
        message: 'Hi Sarah, thanks for connecting! I help SaaS founders scale their outreach.',
        direction: 'outbound',
        sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        conversation_id: conversations[0].id,
        contact_id: hotContacts[0].id,
        message: "I'd love to schedule a call next week to learn more about this!",
        direction: 'inbound',
        sentiment: 'positive',
        intent: 'schedule_meeting',
        sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },

      // Mike's conversation
      {
        conversation_id: conversations[1].id,
        contact_id: hotContacts[1].id,
        message: 'Hey Mike, saw what you're building at StartupXYZ. Impressive!',
        direction: 'outbound',
        sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        conversation_id: conversations[1].id,
        contact_id: hotContacts[1].id,
        message: 'This looks exactly like what we need! Can you send me more details?',
        direction: 'inbound',
        sentiment: 'positive',
        intent: 'request_information',
        sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    console.log('✓ Created sample messages\n');

    // 7. Create Outreach Records
    console.log('Creating outreach records...');
    await supabase.from('outreach').insert([
      {
        contact_id: contacts[0].id,
        campaign_id: campaigns[0].id,
        type: 'connection_request',
        message: 'Hi Sarah...',
        status: 'accepted',
        sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        contact_id: contacts[1].id,
        campaign_id: campaigns[0].id,
        type: 'connection_request',
        message: 'Hi Mike...',
        status: 'accepted',
        sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    console.log('✓ Created outreach records\n');

    console.log('✅ Demo data seeded successfully!\n');
    console.log('Summary:');
    console.log(`- ${companies.length} companies`);
    console.log(`- ${contacts.length} contacts (2 HOT 🔥, 3 WARM 🟡, 5 COLD 🔵)`);
    console.log(`- ${campaigns.length} active campaigns`);
    console.log(`- ${conversations.length} conversations`);
    console.log('\nYou can now:');
    console.log('1. Run: cd apps/web && npm run dev');
    console.log('2. Open: http://localhost:3000/command-center');
    console.log('3. Try: "Show me my hot leads"\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

seedDemoData();
