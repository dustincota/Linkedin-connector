'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { CampaignStepEditor } from './components/campaign-step-editor';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import Link from 'next/link';
import type { CreateCampaignInput, CreateCampaignStepInput } from '@linkedin-crm/types';

interface CampaignStep {
  step_number: number;
  type: 'connection_request' | 'message' | 'follow_up' | 'inmail';
  subject?: string;
  template: string;
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days';
  condition_type?: 'no_reply' | 'connected' | 'replied' | null;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [campaignData, setCampaignData] = useState<Partial<CreateCampaignInput>>({
    name: '',
    description: '',
    status: 'draft',
    daily_limit: 20,
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    working_days: [1, 2, 3, 4, 5],
    timezone: 'America/New_York',
    use_ai_personalization: true,
  });

  const [steps, setSteps] = useState<CampaignStep[]>([
    {
      step_number: 1,
      type: 'connection_request',
      template: '',
      delay_value: 0,
      delay_unit: 'days',
    },
  ]);

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create steps
      const stepsData: CreateCampaignStepInput[] = steps.map((step) => ({
        campaign_id: campaign.id,
        ...step,
      }));

      const { error: stepsError } = await supabase.from('campaign_steps').insert(stepsData);

      if (stepsError) throw stepsError;

      return campaign;
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      router.push(`/campaigns/${campaign.id}`);
    },
  });

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_number: steps.length + 1,
        type: 'message',
        template: '',
        delay_value: 1,
        delay_unit: 'days',
      },
    ]);
  };

  const updateStep = (index: number, updatedStep: Partial<CampaignStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updatedStep };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.step_number = i + 1;
    });
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate();
  };

  return (
    <div>
      <PageHeader
        title="Create Campaign"
        description="Build a multi-step LinkedIn outreach campaign"
        actions={
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Basic Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="e.g., SaaS Founders Outreach"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={campaignData.description || ''}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, description: e.target.value })
                  }
                  placeholder="What is this campaign for?"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Daily Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={campaignData.daily_limit}
                    onChange={(e) =>
                      setCampaignData({ ...campaignData, daily_limit: parseInt(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Max actions per day (recommended: 20-30)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={campaignData.timezone}
                    onChange={(e) => setCampaignData({ ...campaignData, timezone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Working Hours Start
                  </label>
                  <input
                    type="time"
                    value={campaignData.working_hours_start}
                    onChange={(e) =>
                      setCampaignData({ ...campaignData, working_hours_start: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Working Hours End
                  </label>
                  <input
                    type="time"
                    value={campaignData.working_hours_end}
                    onChange={(e) =>
                      setCampaignData({ ...campaignData, working_hours_end: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={campaignData.use_ai_personalization}
                    onChange={(e) =>
                      setCampaignData({
                        ...campaignData,
                        use_ai_personalization: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ✨ Enable AI Personalization
                  </span>
                </label>
                <p className="ml-6 text-xs text-gray-500">
                  Claude will personalize each message based on the contact's profile
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Steps */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Campaign Sequence</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Build your multi-step outreach sequence
                </p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <CampaignStepEditor
                  key={index}
                  step={step}
                  stepNumber={index + 1}
                  onUpdate={(updatedStep) => updateStep(index, updatedStep)}
                  onRemove={() => removeStep(index)}
                  canRemove={steps.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/campaigns"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createCampaignMutation.isPending || !campaignData.name}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
