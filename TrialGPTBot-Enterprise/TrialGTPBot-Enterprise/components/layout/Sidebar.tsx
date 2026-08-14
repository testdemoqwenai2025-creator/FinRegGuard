'use client';

/**
 * Sidebar - Main navigation sidebar for TrialGPTBot Enterprise
 * Provides access to all major sections of the application
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number | string;
  description: string;
}

const mainNavItems: NavItem[] = [
  { 
    href: '/dashboard', 
    label: 'Review Dashboard', 
    icon: '📊',
    badge: '47',
    description: 'AI-powered task review queue'
  },
  { 
    href: '/trials', 
    label: 'Clinical Trials', 
    icon: '🧪',
    badge: '12',
    description: 'Manage trial protocols and data'
  },
  { 
    href: '/review', 
    label: 'Task Queue', 
    icon: '✅',
    badge: '23',
    description: 'Boolean confirmation workflow'
  },
  { 
    href: '/edc', 
    label: 'EDC Systems', 
    icon: '🔗',
    description: 'External system integrations'
  },
];

const secondaryNavItems: NavItem[] = [
  { 
    href: '/compliance', 
    label: 'Compliance Center', 
    icon: '🛡️',
    description: 'Regulatory compliance status'
  },
  { 
    href: '/audit', 
    label: 'Audit Trail', 
    icon: '📋',
    description: 'Complete audit log'
  },
  { 
    href: '/analytics', 
    label: 'Analytics', 
    icon: '📈',
    description: 'Performance insights'
  },
];

const settingsNavItems: NavItem[] = [
  { 
    href: '/settings', 
    label: 'Settings', 
    icon: '⚙️',
    description: 'Application configuration'
  },
  { 
    href: '/api-docs', 
    label: 'API Documentation', 
    icon: '📖',
    description: 'Developer resources'
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
      {/* Logo Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            T
          </div>
          <div>
            <h2 className="font-bold text-sm">TrialGPTBot</h2>
            <p className="text-xs text-slate-400">Enterprise v2.5</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main Navigation */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main
          </p>
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{item.label}</span>
                    <span className={`block text-xs truncate ${
                      isActive(item.href) ? 'text-blue-200' : 'text-slate-500'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive(item.href) ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Secondary Navigation */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Governance
          </p>
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{item.label}</span>
                    <span className={`block text-xs truncate ${
                      isActive(item.href) ? 'text-blue-200' : 'text-slate-500'
                    }`}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            System
          </p>
          <ul className="space-y-1">
            {settingsNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="block text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-slate-800">
        {/* System Status */}
        <div className="mb-4 p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">System Health</span>
            <span className="text-emerald-400 font-medium">98.7%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-[98.7%] bg-emerald-500 rounded-full"></div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 text-xs text-slate-400">
          <a href="#" className="block hover:text-white transition-colors">Documentation</a>
          <a href="#" className="block hover:text-white transition-colors">Support Portal</a>
          <a href="#" className="block hover:text-white transition-colors">What's New v2.5</a>
        </div>

        {/* Compliance Badges */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>FDA 21 CFR 11</span>
          <span>•</span>
          <span>EMA Annex 11</span>
          <span>•</span>
          <span>GDP</span>
        </div>
      </div>
    </aside>
  );
}
