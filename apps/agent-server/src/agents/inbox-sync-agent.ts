import { BaseAgent } from '@linkedin-crm/agents';
import { LinkedInService } from '@linkedin-crm/linkedin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from 'winston';
import { config } from '../config';

/**
 * Inbox Sync Agent
 *
 * Runs every 30 minutes to:
 * 1. Fetch all LinkedIn conversations
 * 2. Sync new messages to database
 * 3. Update conversation metadata
 */
export class InboxSyncAgent extends BaseAgent {
  private linkedIn: LinkedInService;

  constructor(supabase: SupabaseClient, logger: Logger) {
    super(supabase, logger, 'inbox-sync', 'linkedin');

    this.linkedIn = new LinkedInService(
      {
        email: config.linkedin.email,
        password: config.linkedin.password,
      },
      logger
    );
  }

  protected async execute(): Promise<void> {
    try {
      // Initialize LinkedIn browser
      await this.linkedIn.initialize();

      // Get all conversations
      const conversations = await this.linkedIn.getConversations();
      this.addLog('conversations_found', conversations.length);

      this.logger.info(`[InboxSync] Found ${conversations.length} conversations`);

      for (const conv of conversations) {
        try {
          await this.syncConversation(conv);
          this.incrementActions();
        } catch (error: any) {
          this.logger.error(`[InboxSync] Failed to sync conversation`, {
            conversationId: conv.conversationId,
            error: error.message,
          });
          this.incrementErrors();
        }
      }
    } finally {
      await this.linkedIn.close();
    }
  }

  private async syncConversation(conv: any) {
    // Find or create contact from LinkedIn profile
    const contact = await this.findOrCreateContact(conv.participant);

    // Find or create conversation
    const { data: existingConv } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('linkedin_conversation_id', conv.conversationId)
      .single();

    let conversationId: string;

    if (existingConv) {
      // Update existing conversation
      await this.supabase
        .from('conversations')
        .update({
          last_message_at: conv.lastMessageTime.toISOString(),
          last_message_from: 'contact', // Assume last message is from contact if unread
          unread_count: conv.unread ? existingConv.unread_count + 1 : existingConv.unread_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConv.id);

      conversationId = existingConv.id;
    } else {
      // Create new conversation
      const { data: newConv, error } = await this.supabase
        .from('conversations')
        .insert([
          {
            contact_id: contact.id,
            linkedin_conversation_id: conv.conversationId,
            status: 'active',
            last_message_at: conv.lastMessageTime.toISOString(),
            last_message_from: 'contact',
            unread_count: conv.unread ? 1 : 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      conversationId = newConv.id;

      await this.logActivity('conversation', conversationId, 'created');
    }

    // Sync messages for this conversation
    await this.syncMessages(conversationId, conv.conversationId, contact.id);
  }

  private async syncMessages(
    conversationId: string,
    linkedInConversationId: string,
    contactId: string
  ) {
    // Get messages from LinkedIn
    const messages = await this.linkedIn.getMessages(linkedInConversationId);

    for (const msg of messages) {
      // Check if message already exists
      const { data: existing } = await this.supabase
        .from('messages')
        .select('id')
        .eq('linkedin_message_id', msg.messageId)
        .single();

      if (existing) continue; // Skip if already synced

      // Determine direction (outbound if from us, inbound if from contact)
      const direction = msg.from === 'You' ? 'outbound' : 'inbound';

      // Insert message
      await this.supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          contact_id: contactId,
          message: msg.message,
          direction,
          linkedin_message_id: msg.messageId,
          sent_at: msg.timestamp.toISOString(),
          is_read: true, // Mark as read since we're syncing it
        },
      ]);

      await this.logActivity('message', msg.messageId, 'synced');
    }
  }

  private async findOrCreateContact(participant: any) {
    // Try to find existing contact by LinkedIn URL
    const { data: existing } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('linkedin_url', participant.profileUrl)
      .single();

    if (existing) {
      return existing;
    }

    // Parse name
    const nameParts = participant.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create new contact
    const { data: newContact, error } = await this.supabase
      .from('contacts')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          linkedin_url: participant.profileUrl,
          profile_image_url: participant.imageUrl,
          connection_status: 'connected',
          connected_at: new Date().toISOString(),
          source: 'linkedin_inbox',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await this.logActivity('contact', newContact.id, 'created', {
      source: 'linkedin_inbox',
    });

    return newContact;
  }
}
