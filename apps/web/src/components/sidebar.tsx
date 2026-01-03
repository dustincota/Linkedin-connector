'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Inbox,
  Users,
  LayoutList,
  BarChart3,
  DollarSign,
  Target,
  PenTool,
  Newspaper,
  CheckSquare,
  Bot,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  divider?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Command Center', href: '/command-center', icon: Sparkles, divider: true },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: LayoutList },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Deals', href: '/deals', icon: DollarSign, divider: true },
  { name: 'Buyers', href: '/buyers', icon: Target },
  { name: 'Content', href: '/content', icon: PenTool, divider: true },
  { name: 'Research', href: '/research', icon: Newspaper },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, divider: true },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <span className="text-sm font-bold text-white">LC</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">LinkedIn CRM</div>
          <div className="text-xs text-gray-500">Business OS</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                {item.divider && <div className="my-3 border-t border-gray-200" />}
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            <span className="text-xs font-medium text-gray-600">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">John Doe</div>
            <div className="text-xs text-gray-500 truncate">john@example.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
