import { BaseAgent } from '@linkedin-crm/agents';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from 'winston';
import { classifyReply } from '../lib/claude';

/**
 * Reply Classifier Agent
 *
 * Runs every 30 minutes to:
 * 1. Find unclassified messages
 * 2. Use Claude to classify reply temperature (HOT/WARM/COLD/DEAD)
 * 3. Update conversation and contact temperature
 * 4. Create notifications for HOT leads
 */
export class ReplyClassifierAgent extends BaseAgent {
  constructor(supabase: SupabaseClient, logger: Logger) {
    super(supabase, logger, 'reply-classifier', 'linkedin');
  }

  protected async execute(): Promise<void> {
    // Get unclassified inbound messages (no sentiment analyzed yet)
    const { data: messages } = await this.supabase
      .from('messages')
      .select(
        `
        *,
        conversation:conversations(*),
        contact:contacts(*)
      `
      )
      .eq('direction', 'inbound')
      .is('sentiment', null)
      .order('sent_at', { ascending: false })
      .limit(50); // Process 50 at a time

    if (!messages || messages.length === 0) {
      this.logger.info('[ReplyClassifier] No unclassified messages');
      return;
    }

    this.addLog('messages_to_classify', messages.length);

    for (const message of messages) {
      try {
        await this.classifyMessage(message);
        this.incrementActions();
      } catch (error: any) {
        this.logger.error('[ReplyClassifier] Failed to classify message', {
          messageId: message.id,
          error: error.message,
        });
        this.incrementErrors();
      }
    }
  }

  private async classifyMessage(message: any) {
    // Get conversation context (last few messages)
    const { data: contextMessages } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', message.conversation_id)
      .order('sent_at', { ascending: false })
      .limit(5);

    const context =
      contextMessages
        ?.reverse()
        .map((m) => `${m.direction === 'outbound' ? 'Me' : 'Them'}: ${m.message}`)
        .join('\n') || '';

    // Classify with Claude
    const classification = await classifyReply(message.message, context);

    this.logger.info('[ReplyClassifier] Classified message', {
      messageId: message.id,
      temperature: classification.temperature,
      sentiment: classification.sentiment,
    });

    // Update message with classification
    await this.supabase
      .from('messages')
      .update({
        sentiment: classification.sentiment,
        intent: classification.intent,
      })
      .eq('id', message.id);

    // Update conversation temperature
    await this.supabase
      .from('conversations')
      .update({
        temperature: classification.temperature,
        temperature_reason: classification.reason,
      })
      .eq('id', message.conversation_id);

    // Update contact temperature
    await this.supabase
      .from('contacts')
      .update({
        temperature: classification.temperature,
        temperature_updated_at: new Date().toISOString(),
      })
      .eq('id', message.contact_id);

    await this.logActivity('message', message.id, 'classified', {
      temperature: classification.temperature,
      sentiment: classification.sentiment,
    });

    // Create notification for HOT leads
    if (classification.temperature === 'HOT') {
      const contact = message.contact;

      await this.createNotification(
        `🔥 Hot Lead: ${contact.first_name} ${contact.last_name}`,
        `${contact.first_name} replied: "${message.message.substring(0, 100)}..."\n\nReason: ${classification.reason}`,
        'hot_lead',
        'urgent',
        { contactId: contact.id }
      );

      // Update campaign stats if part of a campaign
      if (message.conversation.campaign_id) {
        await this.supabase.rpc('increment_campaign_hot', {
          campaign_id: message.conversation.campaign_id,
        });
      }
    }

    // Update campaign reply stats
    if (message.conversation.campaign_id) {
      await this.supabase.rpc('increment_campaign_replied', {
        campaign_id: message.conversation.campaign_id,
      });
    }
  }
}
