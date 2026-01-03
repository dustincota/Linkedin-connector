'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, Edit, Users, Send, MessageSquare, TrendingUp } from 'lucide-react';
import { formatDate, getTemperatureEmoji } from '@/lib/utils';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: campaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(
          `
          *,
          steps:campaign_steps(*)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ['campaign-enrollments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_enrollments')
        .select(
          `
          *,
          contact:contacts(*)
        `
        )
        .eq('campaign_id', id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: 'active' | 'paused') => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  if (!campaign) return <div>Loading...</div>;

  const replyRate = campaign.total_sent > 0
    ? Math.round((campaign.total_replied / campaign.total_sent) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description={campaign.description || undefined}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            {campaign.status === 'active' ? (
              <button
                onClick={() => toggleStatusMutation.mutate('paused')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            ) : (
              <button
                onClick={() => toggleStatusMutation.mutate('active')}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                Activate
              </button>
            )}

            <Link
              href={`/campaigns/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              Total Enrolled
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{campaign.total_enrolled}</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Send className="h-4 w-4" />
              Messages Sent
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{campaign.total_sent}</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MessageSquare className="h-4 w-4" />
              Replies
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{campaign.total_replied}</div>
            <div className="mt-1 text-sm text-gray-500">{replyRate}% rate</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              Hot Leads
            </div>
            <div className="mt-2 text-3xl font-bold text-hot">{campaign.total_hot}</div>
          </div>
        </div>

        {/* Campaign Steps */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Sequence</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {campaign.steps?.map((step: any, index: number) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{step.type.replace('_', ' ')}</span>
                      {index > 0 && (
                        <span className="text-sm text-gray-500">
                          • Wait {step.delay_value} {step.delay_unit}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{step.template.substring(0, 150)}...</p>
                    {step.condition_type && (
                      <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        Condition: {step.condition_type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Enrolled Contacts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {enrollments?.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.contact.first_name} {enrollment.contact.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{enrollment.contact.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          enrollment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : enrollment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Step {enrollment.current_step}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(enrollment.enrolled_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enrollment.last_action_at
                        ? formatDate(enrollment.last_action_at)
                        : 'Not yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
