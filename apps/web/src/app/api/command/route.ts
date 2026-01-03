import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    // Use Claude to interpret the command
    const interpretation = await interpretCommand(command);

    // Execute the interpreted actions
    const result = await executeActions(interpretation);

    return NextResponse.json({
      response: result.response,
      actions_taken: result.actions_taken,
      data: result.data,
    });
  } catch (error: any) {
    console.error('Command error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function interpretCommand(command: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    system: `You are an AI assistant managing a LinkedIn CRM business operating system.

Available capabilities:
1. Query database:
   - contacts: LinkedIn contacts with temperature (HOT/WARM/COLD/DEAD)
   - campaigns: Outreach campaigns with stats
   - conversations: LinkedIn message threads
   - messages: Individual messages
   - outreach: Connection requests and messages sent
   - agent_runs: Agent execution history

2. Trigger agents:
   - inbox-sync: Fetch LinkedIn messages
   - campaign-runner: Execute campaigns
   - reply-classifier: Classify messages

3. Perform actions:
   - Create campaigns
   - Update contact status
   - Generate replies
   - View analytics

Respond in JSON format:
{
  "intent": "what user wants",
  "action_type": "query|trigger_agent|create|update",
  "queries": [
    {
      "table": "table_name",
      "select": "*",
      "filters": {"field": "value"},
      "order": {"field": "created_at", "ascending": false},
      "limit": 10
    }
  ],
  "agent_triggers": ["agent_name"],
  "response_template": "how to respond to user"
}`,
    messages: [
      {
        role: 'user',
        content: command,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

async function executeActions(interpretation: any) {
  const actions_taken: string[] = [];
  let queryResults: any = {};

  // Execute database queries
  if (interpretation.queries && interpretation.queries.length > 0) {
    for (const query of interpretation.queries) {
      try {
        let supabaseQuery = supabase.from(query.table).select(query.select || '*');

        // Apply filters
        if (query.filters) {
          Object.entries(query.filters).forEach(([field, value]) => {
            supabaseQuery = supabaseQuery.eq(field, value);
          });
        }

        // Apply ordering
        if (query.order) {
          supabaseQuery = supabaseQuery.order(
            query.order.field,
            { ascending: query.order.ascending ?? false }
          );
        }

        // Apply limit
        if (query.limit) {
          supabaseQuery = supabaseQuery.limit(query.limit);
        }

        const { data, error } = await supabaseQuery;

        if (error) throw error;

        queryResults[query.table] = data;
        actions_taken.push(`Queried ${query.table} (${data?.length || 0} results)`);
      } catch (error: any) {
        console.error(`Query error for ${query.table}:`, error);
        actions_taken.push(`Failed to query ${query.table}`);
      }
    }
  }

  // Trigger agents
  if (interpretation.agent_triggers && interpretation.agent_triggers.length > 0) {
    for (const agent of interpretation.agent_triggers) {
      try {
        // Call agent server API
        const response = await fetch(`${process.env.AGENT_SERVER_URL || 'http://localhost:3001'}/api/agents/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent }),
        });

        if (response.ok) {
          actions_taken.push(`Triggered ${agent} agent`);
        }
      } catch (error) {
        console.error(`Failed to trigger ${agent}:`, error);
        actions_taken.push(`Failed to trigger ${agent}`);
      }
    }
  }

  // Format response using Claude
  const formattedResponse = await formatResponse(
    interpretation.response_template,
    queryResults,
    actions_taken
  );

  return {
    response: formattedResponse,
    actions_taken,
    data: queryResults,
  };
}

async function formatResponse(
  template: string,
  data: any,
  actions: string[]
) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Format this response for the user:

Template: ${template}

Data: ${JSON.stringify(data, null, 2)}

Actions taken: ${actions.join(', ')}

Provide a natural, conversational response that:
1. Directly answers the user's question
2. Highlights important insights
3. Uses emojis appropriately (🔥 for hot leads, etc.)
4. Suggests next actions when relevant
5. Keeps it concise but informative

Response:`,
      },
    ],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : 'Unable to format response';
}
