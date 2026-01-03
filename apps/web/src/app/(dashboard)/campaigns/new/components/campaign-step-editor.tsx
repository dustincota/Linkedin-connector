'use client';

import { Trash2, GripVertical } from 'lucide-react';

interface CampaignStep {
  step_number: number;
  type: 'connection_request' | 'message' | 'follow_up' | 'inmail';
  subject?: string;
  template: string;
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days';
  condition_type?: 'no_reply' | 'connected' | 'replied' | null;
}

interface CampaignStepEditorProps {
  step: CampaignStep;
  stepNumber: number;
  onUpdate: (step: Partial<CampaignStep>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function CampaignStepEditor({
  step,
  stepNumber,
  onUpdate,
  onRemove,
  canRemove,
}: CampaignStepEditorProps) {
  const getStepIcon = () => {
    switch (step.type) {
      case 'connection_request':
        return '👋';
      case 'message':
        return '💬';
      case 'follow_up':
        return '🔔';
      case 'inmail':
        return '📧';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start gap-4">
        {/* Step Number */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
          {stepNumber}
        </div>

        <div className="flex-1 space-y-4">
          {/* Step Type & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={step.type}
                onChange={(e) =>
                  onUpdate({
                    type: e.target.value as CampaignStep['type'],
                  })
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="connection_request">👋 Connection Request</option>
                <option value="message">💬 Message</option>
                <option value="follow_up">🔔 Follow-up</option>
                <option value="inmail">📧 InMail</option>
              </select>

              {/* Delay */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Wait</span>
                <input
                  type="number"
                  min="0"
                  value={step.delay_value}
                  onChange={(e) => onUpdate({ delay_value: parseInt(e.target.value) })}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
                />
                <select
                  value={step.delay_unit}
                  onChange={(e) =>
                    onUpdate({ delay_unit: e.target.value as CampaignStep['delay_unit'] })
                  }
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            </div>

            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Subject (for InMail) */}
          {step.type === 'inmail' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={step.subject || ''}
                onChange={(e) => onUpdate({ subject: e.target.value })}
                placeholder="InMail subject line"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Message Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message Template
              <span className="ml-2 text-xs font-normal text-gray-500">
                Available variables: {'{'}
                {'{'}first_name{'}'}{'}'}
                , {'{'}
                {'{'}last_name{'}'}{'}'}
                , {'{'}
                {'{'}company{'}'}{'}'}
                , {'{'}
                {'{'}title{'}'}
                {'}'}
              </span>
            </label>
            <textarea
              rows={4}
              value={step.template}
              onChange={(e) => onUpdate({ template: e.target.value })}
              placeholder={
                step.type === 'connection_request'
                  ? "Hi {{first_name}}, I'd love to connect..."
                  : 'Hey {{first_name}}, following up on...'
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>{step.template.length} characters</span>
              {step.type === 'connection_request' && step.template.length > 300 && (
                <span className="text-yellow-600">LinkedIn limits connection notes to 300 chars</span>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <select
              value={step.condition_type || ''}
              onChange={(e) =>
                onUpdate({
                  condition_type: e.target.value
                    ? (e.target.value as CampaignStep['condition_type'])
                    : null,
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Always send this step</option>
              <option value="no_reply">Only if no reply</option>
              <option value="connected">Only if connected</option>
              <option value="replied">Only if they replied</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
