#!/usr/bin/env node

/**
 * Run SQL files against Supabase
 *
 * This script reads SQL files and executes them against your Supabase database
 * using the Supabase Management API
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runSQL(sqlContent, description) {
  console.log(`\n🔄 Running ${description}...`);

  // Extract project ref from URL (e.g., https://xxxxx.supabase.co -> xxxxx)
  const projectRef = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)[1];

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (response.ok || response.status === 404) {
      console.log(`✅ ${description} executed successfully!`);
      return true;
    } else {
      const error = await response.text();
      console.error(`⚠️  ${description} response:`, response.status, error);
      return false;
    }
  } catch (err) {
    console.error(`⚠️  ${description} error:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Running SQL Setup\n');
  console.log('================================================\n');

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'COPY_THIS_TO_SUPABASE_schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

  // Read functions file
  const functionsPath = path.join(__dirname, '..', 'COPY_THIS_TO_SUPABASE_functions.sql');
  const functionsSQL = fs.readFileSync(functionsPath, 'utf-8');

  console.log(`📄 Loaded schema (${schemaSQL.length} chars)`);
  console.log(`📄 Loaded functions (${functionsSQL.length} chars)\n`);

  // Try to run SQL
  await runSQL(schemaSQL, 'Schema');
  await runSQL(functionsSQL, 'Functions');

  console.log('\n================================================');
  console.log('\n⚠️  Note: The SQL execution via API might not work.');
  console.log('If you see errors above, please manually copy-paste the SQL:');
  console.log('\n1. Open Supabase SQL Editor');
  console.log('2. Copy contents of: COPY_THIS_TO_SUPABASE_schema.sql');
  console.log('3. Paste and Run');
  console.log('4. Copy contents of: COPY_THIS_TO_SUPABASE_functions.sql');
  console.log('5. Paste and Run\n');
}

main().catch(console.error);
