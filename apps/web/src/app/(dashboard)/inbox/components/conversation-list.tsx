'use client';

import { formatDate, getTemperatureEmoji, getInitials } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  contact: {
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    title?: string;
  };
  temperature: string;
  last_message_at: string;
  last_message_from: string;
  unread_count: number;
  status: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No conversations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation.id)}
          className={`w-full border-b border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 ${
            selectedId === conversation.id ? 'bg-primary-50' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {conversation.contact.profile_image_url ? (
              <img
                src={conversation.contact.profile_image_url}
                alt=""
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  {getInitials(conversation.contact.first_name, conversation.contact.last_name)}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Name & Temperature */}
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 truncate">
                  {conversation.contact.first_name} {conversation.contact.last_name}
                </div>
                <span className="ml-2 text-sm">
                  {getTemperatureEmoji(conversation.temperature)}
                </span>
              </div>

              {/* Title */}
              {conversation.contact.title && (
                <div className="text-xs text-gray-500 truncate">{conversation.contact.title}</div>
              )}

              {/* Last Message Time */}
              <div className="mt-1 flex items-center justify-between">
                <div className="text-xs text-gray-500">{formatDate(conversation.last_message_at)}</div>
                {conversation.unread_count > 0 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                    {conversation.unread_count}
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
