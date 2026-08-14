import './globals.css';
import { Inter } from 'next/font/google';
import { Navigation } from '@/components/layout/Navigation';
import { Sidebar } from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TrialGPTBot Enterprise | AI-Powered Clinical Trial Management',
  description: 'Advanced AI-powered clinical trial management platform with Boolean confirmation workflow, EDC integration, and regulatory compliance (FDA 21 CFR Part 11, EMA Annex 11)',
  keywords: ['clinical trials', 'AI', 'EDC', 'FDA', 'regulatory', 'Boolean confirmation', 'review dashboard'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          {/* Sidebar Navigation */}
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header/Navigation */}
            <Navigation />
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-6 grid-pattern">
              {children}
            </main>
          </div>
        </div>
        
        {/* Toast Container */}
        <div id="toast-container" className="toast-container" />
      </body>
    </html>
  );
}
