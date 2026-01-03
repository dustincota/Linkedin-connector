'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/page-header';
import { Send, Loader2, Sparkles, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: string[];
  data?: any;
}

export default function CommandCenterPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI business assistant. I can help you manage your LinkedIn CRM, campaigns, leads, and agents. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeCommand = useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) throw new Error('Command failed');
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actions: data.actions_taken,
          data: data.data,
        },
      ]);
    },
    onError: (error: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || executeCommand.isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    executeCommand.mutate(input);
    setInput('');
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const quickActions = [
    'Show me my hot leads',
    'How are my campaigns doing?',
    'Run inbox sync now',
    'Create a new campaign',
    'Show today\'s stats',
    'What happened overnight?',
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        title="Command Center"
        description="Chat with your AI assistant to manage your business"
      />

      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-2xl`}>
                  <div
                    className={`rounded-2xl px-6 py-4 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>

                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.actions.map((action, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                        >
                          ✓ {action}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}

            {executeCommand.isPending && (
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="mx-auto max-w-3xl">
              <p className="mb-3 text-sm font-medium text-gray-700">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your command... (e.g., 'Show me my hot leads')"
                  disabled={executeCommand.isPending}
                  className="w-full rounded-xl border border-gray-300 px-6 py-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || executeCommand.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {executeCommand.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Powered by Claude AI</span>
              </div>
              <span>Press Enter to send</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
