import { PageHeader } from '@/components/page-header';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to your LinkedIn CRM Business Operating System"
      />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats cards */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Hot Leads</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-500">🔥</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Active Campaigns</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">0</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Total Leads</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">0</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="text-sm font-medium text-gray-500">Reply Rate</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">0%</div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
