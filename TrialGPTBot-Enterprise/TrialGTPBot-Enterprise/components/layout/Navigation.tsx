'use client';

/**
 * Navigation - Top header bar for TrialGPTBot Enterprise
 * Provides global navigation, search, user menu, and status indicators
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or trigger search
      window.location.href = `/dashboard?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left Section: Logo & Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              T
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">TrialGPTBot Enterprise</h1>
              <p className="text-xs text-gray-500">AI-Powered Clinical Trials</p>
            </div>
          </Link>

          {/* Current Page Indicator */}
          <nav className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-gray-400">/</span>
            {getPageTitle(pathname)}
          </nav>
        </div>

        {/* Center Section: Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8 hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trials, subjects, forms, tasks..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          {/* Live Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Systems Online</span>
          </div>

          {/* Notifications */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                SC
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700">Dr. Chen</span>
              <svg className="w-4 h-4 text-slate-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-slide-up">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">Dr. Sarah Chen</p>
                  <p className="text-xs text-slate-500">Senior Clinical Reviewer</p>
                </div>
                <Link href="/settings/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile Settings</Link>
                <Link href="/settings/preferences" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Preferences</Link>
                <Link href="/settings/api-keys" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">API Keys & Integrations</Link>
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Review Dashboard',
    '/trials': 'Clinical Trials',
    '/trials/new': 'New Trial',
    '/review': 'Task Review Queue',
    '/edc': 'EDC Integration',
    '/compliance': 'Compliance Center',
    '/audit': 'Audit Trail',
    '/settings': 'Settings',
    '/analytics': 'Analytics',
  };
  
  return titles[pathname] || 'Dashboard';
}
