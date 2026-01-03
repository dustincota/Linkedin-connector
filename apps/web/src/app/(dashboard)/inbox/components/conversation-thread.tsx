'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime, getTemperatureEmoji } from '@/lib/utils';
import { Send, Sparkles, ExternalLink } from 'lucide-react';

interface ConversationThreadProps {
  conversationId: string;
}

export function ConversationThread({ conversationId }: ConversationThreadProps) {
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          contact:contacts(*)
        `
        )
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // In a real implementation, this would call the agent API to send via LinkedIn
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          contact_id: conversation?.contact_id,
          message,
          direction: 'outbound',
          sent_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      setMessageText('');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  if (!conversation) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {conversation.contact.first_name} {conversation.contact.last_name}
              </h2>
              <span className="text-xl">{getTemperatureEmoji(conversation.temperature)}</span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  conversation.temperature === 'HOT'
                    ? 'bg-hot-light text-hot'
                    : conversation.temperature === 'WARM'
                      ? 'bg-warm-light text-warm'
                      : 'bg-cold-light text-cold'
                }`}
              >
                {conversation.temperature}
              </span>
            </div>
            {conversation.contact.title && (
              <p className="text-sm text-gray-500">{conversation.contact.title}</p>
            )}
          </div>

          {conversation.contact.linkedin_url && (
            <a
              href={conversation.contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              View LinkedIn
            </a>
          )}
        </div>

        {conversation.temperature_reason && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <strong>AI Analysis:</strong> {conversation.temperature_reason}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages?.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-lg rounded-lg px-4 py-3 ${
                message.direction === 'outbound'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              <div
                className={`mt-2 text-xs ${
                  message.direction === 'outbound' ? 'text-primary-100' : 'text-gray-500'
                }`}
              >
                {formatDateTime(message.sent_at)}
                {message.sentiment && (
                  <span className="ml-2">
                    • {message.sentiment}
                    {message.intent && ` • ${message.intent}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Sparkles className="h-4 w-4" />
              AI Suggest
            </button>

            <button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
