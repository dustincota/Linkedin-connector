'use client';

import { Search, Filter } from 'lucide-react';

interface LeadFiltersProps {
  filters: {
    search: string;
    temperature: string;
    status: string;
    tags: string[];
  };
  onFiltersChange: (filters: any) => void;
}

export function LeadFilters({ filters, onFiltersChange }: LeadFiltersProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Temperature Filter */}
        <select
          value={filters.temperature}
          onChange={(e) => onFiltersChange({ ...filters, temperature: e.target.value })}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Temperatures</option>
          <option value="HOT">🔥 Hot</option>
          <option value="WARM">🟡 Warm</option>
          <option value="COLD">🔵 Cold</option>
          <option value="DEAD">⚫ Dead</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="do_not_contact">Do Not Contact</option>
        </select>

        {/* Clear Filters */}
        {(filters.search || filters.temperature || filters.status) && (
          <button
            onClick={() =>
              onFiltersChange({ search: '', temperature: '', status: '', tags: [] })
            }
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
