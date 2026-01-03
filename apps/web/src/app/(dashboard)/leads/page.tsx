'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { LeadsTable } from './components/leads-table';
import { LeadDialog } from './components/lead-dialog';
import { ImportDialog } from './components/import-dialog';
import { LeadFilters } from './components/lead-filters';
import { Plus, Upload } from 'lucide-react';

export default function LeadsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    temperature: '',
    status: '',
    tags: [],
  });

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Manage your LinkedIn contacts and leads"
        actions={
          <>
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
          </>
        }
      />

      <div className="p-6">
        <div className="space-y-4">
          <LeadFilters filters={filters} onFiltersChange={setFilters} />
          <LeadsTable filters={filters} />
        </div>
      </div>

      <LeadDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
