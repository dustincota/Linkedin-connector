'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { Plus, Play, Pause, MoreVertical, Users, Send, MessageSquare, TrendingUp, LayoutList } from 'lucide-react';
import type { Campaign } from '@linkedin-crm/types';

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const supabase = createClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateReplyRate = (campaign: Campaign) => {
    if (campaign.total_sent === 0) return 0;
    return Math.round((campaign.total_replied / campaign.total_sent) * 100);
  };

  const calculateConnectionRate = (campaign: Campaign) => {
    if (campaign.total_sent === 0) return 0;
    return Math.round((campaign.total_connected / campaign.total_sent) * 100);
  };

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Manage your LinkedIn outreach campaigns"
        actions={
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Campaign Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-sm text-gray-500">Loading campaigns...</div>
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-gray-200 bg-white">
            <LayoutList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
            <div className="mt-6">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 truncate">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                      campaign.status
                    )}`}
                  >
                    {campaign.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      Enrolled
                    </div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {campaign.total_enrolled}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Send className="h-4 w-4" />
                      Sent
                    </div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {campaign.total_sent}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MessageSquare className="h-4 w-4" />
                      Replies
                    </div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {campaign.total_replied}
                    </div>
                    <div className="text-xs text-gray-500">
                      {calculateReplyRate(campaign)}% rate
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <TrendingUp className="h-4 w-4" />
                      Hot Leads
                    </div>
                    <div className="mt-1 text-2xl font-bold text-hot">
                      {campaign.total_hot}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Connection Rate</span>
                    <span>{calculateConnectionRate(campaign)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: `${calculateConnectionRate(campaign)}%` }}
                    />
                  </div>
                </div>

                {/* Settings Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Daily limit: {campaign.daily_limit}</span>
                    <span>
                      {campaign.use_ai_personalization && '✨ AI Personalization'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
