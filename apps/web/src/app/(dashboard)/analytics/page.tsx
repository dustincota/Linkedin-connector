'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { TrendingUp, Users, Send, MessageSquare, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const supabase = createClient();

  // Fetch overall stats
  const { data: stats } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const [contactsRes, campaignsRes, messagesRes, conversationsRes] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('outreach').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('temperature', 'HOT'),
      ]);

      return {
        totalContacts: contactsRes.count || 0,
        activeCampaigns: campaignsRes.count || 0,
        messagesSent: messagesRes.count || 0,
        hotLeads: conversationsRes.count || 0,
      };
    },
  });

  // Fetch campaign performance
  const { data: campaigns } = useQuery({
    queryKey: ['analytics-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('total_replied', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Fetch temperature distribution
  const { data: temperatureDistribution } = useQuery({
    queryKey: ['analytics-temperature'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('temperature')
        .neq('temperature', 'COLD');

      if (error) throw error;

      const distribution = data.reduce(
        (acc, contact) => {
          acc[contact.temperature] = (acc[contact.temperature] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return distribution;
    },
  });

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Track your LinkedIn outreach performance"
      />

      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalContacts || 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeCampaigns || 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.messagesSent || 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hot Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.hotLeads || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Temperature Distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Lead Temperature Distribution</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">🔥 Hot Leads</p>
                  <p className="mt-1 text-2xl font-bold text-red-900">
                    {temperatureDistribution?.HOT || 0}
                  </p>
                </div>
                <div className="text-3xl">🔥</div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">🟡 Warm Leads</p>
                  <p className="mt-1 text-2xl font-bold text-yellow-900">
                    {temperatureDistribution?.WARM || 0}
                  </p>
                </div>
                <div className="text-3xl">🟡</div>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">⚫ Dead Leads</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {temperatureDistribution?.DEAD || 0}
                  </p>
                </div>
                <div className="text-3xl">⚫</div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
            <p className="text-sm text-gray-500">Top campaigns by reply rate</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Connected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reply Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns?.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-500">
                        {campaign.status === 'active' && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_enrolled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_sent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_connected}
                      <span className="ml-1 text-xs text-gray-500">
                        ({calculateRate(campaign.total_connected, campaign.total_sent)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_replied}
                      <span className="ml-1 text-xs text-gray-500">
                        ({calculateRate(campaign.total_replied, campaign.total_sent)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-hot font-semibold">
                      {campaign.total_hot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full"
                            style={{
                              width: `${calculateRate(campaign.total_replied, campaign.total_sent)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {calculateRate(campaign.total_replied, campaign.total_sent)}%
                        </span>
                      </div>
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
