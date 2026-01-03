import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

export const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export async function classifyReply(message: string, context?: string): Promise<{
  temperature: 'HOT' | 'WARM' | 'COLD' | 'DEAD';
  reason: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string;
}> {
  const prompt = `You are an AI sales assistant analyzing LinkedIn message replies. Classify this reply and provide insights.

${context ? `Context: ${context}\n\n` : ''}Message: "${message}"

Classify the reply into one of these categories:
- HOT 🔥: Wants to sell their business, ready to book a call, very interested
- WARM 🟡: Curious, asking questions, somewhat interested
- COLD 🔵: Politely not interested, no immediate need
- DEAD ⚫: Hostile, spam, or explicitly not interested

Also identify:
- Sentiment: positive, neutral, or negative
- Intent: what are they trying to communicate?

Respond in JSON format:
{
  "temperature": "HOT|WARM|COLD|DEAD",
  "reason": "Brief explanation of why you classified it this way",
  "sentiment": "positive|neutral|negative",
  "intent": "Brief description of their intent"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse Claude response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function personalizeMessage(
  template: string,
  contact: {
    first_name: string;
    last_name: string;
    title?: string;
    company?: string;
    headline?: string;
  }
): Promise<string> {
  const prompt = `You are a sales expert personalizing an outreach message. Use the contact's information to make this message feel personal and relevant.

Template: "${template}"

Contact Info:
- Name: ${contact.first_name} ${contact.last_name}
- Title: ${contact.title || 'Unknown'}
- Company: ${contact.company || 'Unknown'}
- Headline: ${contact.headline || 'Unknown'}

Personalize the message by:
1. Replacing variables like {{first_name}}, {{company}}, etc.
2. Adding a brief, relevant hook based on their title/company
3. Keeping it concise (2-3 sentences max)
4. Making it conversational and human

Return ONLY the personalized message, no explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text.trim();
}

export async function generateReply(
  conversation: Array<{ direction: string; message: string }>,
  tone: 'professional' | 'friendly' | 'casual' = 'professional'
): Promise<string> {
  const conversationText = conversation
    .map((msg) => `${msg.direction === 'outbound' ? 'Me' : 'Them'}: ${msg.message}`)
    .join('\n');

  const prompt = `You are a sales professional replying to a LinkedIn message. Generate a ${tone} reply based on this conversation:

${conversationText}

Your reply should:
1. Address their questions or concerns
2. Move the conversation forward
3. Be concise (2-3 sentences)
4. Maintain a ${tone} tone

Return ONLY the reply message, no explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text.trim();
}
