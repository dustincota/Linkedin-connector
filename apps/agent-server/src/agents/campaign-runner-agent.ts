import { BaseAgent } from '@linkedin-crm/agents';
import { LinkedInService } from '@linkedin-crm/linkedin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from 'winston';
import { config } from '../config';
import { personalizeMessage } from '../lib/claude';

/**
 * Campaign Runner Agent
 *
 * Runs every 30 minutes to:
 * 1. Get active campaigns
 * 2. Find enrollments ready for next step
 * 3. Execute campaign steps (send connections/messages)
 * 4. Respect daily limits and working hours
 */
export class CampaignRunnerAgent extends BaseAgent {
  private linkedIn: LinkedInService;
  private dailyActions = {
    connections: 0,
    messages: 0,
  };

  constructor(supabase: SupabaseClient, logger: Logger) {
    super(supabase, logger, 'campaign-runner', 'linkedin');

    this.linkedIn = new LinkedInService(
      {
        email: config.linkedin.email,
        password: config.linkedin.password,
      },
      logger
    );
  }

  protected async execute(): Promise<void> {
    // Check if within working hours
    if (!this.linkedIn.isWithinWorkingHours()) {
      this.logger.info('[CampaignRunner] Outside working hours, skipping');
      this.addLog('skipped_reason', 'outside_working_hours');
      return;
    }

    // Load today's action counts
    await this.loadDailyActionCounts();

    try {
      // Initialize LinkedIn browser
      await this.linkedIn.initialize();

      // Get active campaigns
      const { data: campaigns } = await this.supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active');

      if (!campaigns || campaigns.length === 0) {
        this.logger.info('[CampaignRunner] No active campaigns');
        return;
      }

      this.addLog('active_campaigns', campaigns.length);

      for (const campaign of campaigns) {
        if (this.dailyActions.connections >= campaign.daily_limit) {
          this.logger.info('[CampaignRunner] Daily limit reached for campaign', {
            campaignId: campaign.id,
          });
          continue;
        }

        await this.processCampaign(campaign);
      }
    } finally {
      await this.linkedIn.close();
    }

    this.addLog('daily_actions', this.dailyActions);
  }

  private async loadDailyActionCounts() {
    const today = new Date().toISOString().split('T')[0];

    // Count connections sent today
    const { count: connectionsCount } = await this.supabase
      .from('outreach')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'connection_request')
      .gte('sent_at', today);

    // Count messages sent today
    const { count: messagesCount } = await this.supabase
      .from('outreach')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'message')
      .gte('sent_at', today);

    this.dailyActions.connections = connectionsCount || 0;
    this.dailyActions.messages = messagesCount || 0;
  }

  private async processCampaign(campaign: any) {
    // Get enrollments ready for next step
    const { data: enrollments } = await this.supabase
      .from('campaign_enrollments')
      .select(
        `
        *,
        contact:contacts(*),
        campaign:campaigns(*)
      `
      )
      .eq('campaign_id', campaign.id)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) return;

    for (const enrollment of enrollments) {
      // Check if daily limit reached
      if (this.dailyActions.connections >= campaign.daily_limit) break;

      // Check if enough time has passed since last action
      if (!this.isReadyForNextStep(enrollment)) continue;

      try {
        await this.executeNextStep(enrollment);
        this.incrementActions();
      } catch (error: any) {
        this.logger.error('[CampaignRunner] Failed to execute step', {
          enrollmentId: enrollment.id,
          error: error.message,
        });
        this.incrementErrors();

        // Mark enrollment as failed if too many errors
        await this.supabase
          .from('campaign_enrollments')
          .update({ status: 'failed' })
          .eq('id', enrollment.id);
      }
    }
  }

  private isReadyForNextStep(enrollment: any): boolean {
    if (!enrollment.last_action_at) return true; // First step

    // Get current step
    const currentStep = enrollment.current_step;
    // In production, fetch step details to get delay settings
    // For now, use a default delay of 1 day
    const delayHours = 24;

    const lastAction = new Date(enrollment.last_action_at);
    const now = new Date();
    const hoursSinceLastAction = (now.getTime() - lastAction.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastAction >= delayHours;
  }

  private async executeNextStep(enrollment: any) {
    const contact = enrollment.contact;
    const campaign = enrollment.campaign;

    // Get current step details
    const { data: step } = await this.supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('step_number', enrollment.current_step)
      .single();

    if (!step) {
      // No more steps, mark as completed
      await this.supabase
        .from('campaign_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);
      return;
    }

    // Personalize message if AI personalization enabled
    let message = step.template;
    if (campaign.use_ai_personalization) {
      message = await personalizeMessage(step.template, {
        first_name: contact.first_name,
        last_name: contact.last_name,
        title: contact.title,
        company: contact.company?.name,
        headline: contact.headline,
      });
    } else {
      // Simple variable replacement
      message = message
        .replace(/\{\{first_name\}\}/g, contact.first_name)
        .replace(/\{\{last_name\}\}/g, contact.last_name)
        .replace(/\{\{company\}\}/g, contact.company?.name || '')
        .replace(/\{\{title\}\}/g, contact.title || '');
    }

    // Execute step based on type
    if (step.type === 'connection_request') {
      await this.linkedIn.sendConnectionRequest(contact.linkedin_url, message);
      this.dailyActions.connections++;

      // Log outreach
      await this.supabase.from('outreach').insert([
        {
          contact_id: contact.id,
          campaign_id: campaign.id,
          campaign_step_id: step.id,
          type: 'connection_request',
          message: step.template,
          personalized_message: message,
          status: 'sent',
          sent_at: new Date().toISOString(),
        },
      ]);
    } else if (step.type === 'message') {
      // Get conversation for this contact
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contact.id)
        .single();

      if (conversation?.linkedin_conversation_id) {
        await this.linkedIn.sendMessage(conversation.linkedin_conversation_id, message);
        this.dailyActions.messages++;

        // Log outreach
        await this.supabase.from('outreach').insert([
          {
            contact_id: contact.id,
            campaign_id: campaign.id,
            campaign_step_id: step.id,
            type: 'message',
            message: step.template,
            personalized_message: message,
            status: 'sent',
            sent_at: new Date().toISOString(),
          },
        ]);

        // Insert message to database
        await this.supabase.from('messages').insert([
          {
            conversation_id: conversation.id,
            contact_id: contact.id,
            message,
            direction: 'outbound',
            sent_at: new Date().toISOString(),
          },
        ]);
      }
    }

    // Update enrollment
    await this.supabase
      .from('campaign_enrollments')
      .update({
        current_step: enrollment.current_step + 1,
        last_action_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    // Update campaign stats
    await this.supabase.rpc('increment_campaign_sent', { campaign_id: campaign.id });

    await this.logActivity('campaign_enrollment', enrollment.id, 'step_executed', {
      step_number: enrollment.current_step,
      step_type: step.type,
    });
  }
}
