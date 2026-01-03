'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/page-header';
import { ConversationList } from './components/conversation-list';
import { ConversationThread } from './components/conversation-thread';
import { Filter } from 'lucide-react';

export default function InboxPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [temperatureFilter, setTemperatureFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const supabase = createClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', temperatureFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(
          `
          *,
          contact:contacts(*),
          messages:messages(count)
        `
        )
        .order('last_message_at', { ascending: false });

      if (temperatureFilter) {
        query = query.eq('temperature', temperatureFilter);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Auto-select first conversation
  if (conversations && conversations.length > 0 && !selectedConversationId) {
    setSelectedConversationId(conversations[0].id);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        title="Inbox"
        description="Unified LinkedIn conversations"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List Sidebar */}
        <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4 space-y-3">
            <select
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Temperatures</option>
              <option value="HOT">🔥 Hot</option>
              <option value="WARM">🟡 Warm</option>
              <option value="COLD">🔵 Cold</option>
              <option value="DEAD">⚫ Dead</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Conversations */}
          <ConversationList
            conversations={conversations || []}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            isLoading={isLoading}
          />
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 bg-gray-50">
          {selectedConversationId ? (
            <ConversationThread conversationId={selectedConversationId} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-500">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
